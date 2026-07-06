import os
import csv
import hmac
from io import StringIO
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.core.files.base import ContentFile
from django.http import FileResponse, HttpResponse
from django.db.models import Q, Count
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import BasePermission
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import (
    SiteSettings, Service, Project, Testimonial, PricingPlan, FAQ,
    BlogPost, ContactLead, TelegramBotUser, PageSection, MediaAsset,
    SeoMetadata, EditorDraft, Certificate, AboutPage, ContentVersion,
    AdminActionLog, AdminBackup, AdminProfile, AdminSecuritySettings,
)
from .serializers import (
    SiteSettingsSerializer, ServiceSerializer, ProjectSerializer, TestimonialSerializer,
    PricingPlanSerializer, FAQSerializer, BlogPostSerializer, ContactLeadSerializer,
    TelegramBotUserSerializer, PageSectionSerializer, MediaAssetSerializer,
    SeoMetadataSerializer, EditorDraftSerializer, CertificateSerializer, AboutPageSerializer,
    ContentVersionSerializer, AdminActionLogSerializer, AdminBackupSerializer,
    AdminProfileSerializer, AdminSecuritySettingsSerializer,
)
from .services.admin_system import (
    TRASH_MODELS, VERSION_MODELS, ROLE_PERMISSIONS, analytics_csv_response_rows,
    analytics_payload, apply_snapshot, backup_codes, compare_snapshots,
    create_backup, create_version, decrypt_text, encrypt_text, ensure_admin_profile,
    generate_totp_secret, hash_backup_code, hash_value, log_action, object_title,
    restore_backup_file, restore_deleted, snapshot_instance, soft_delete,
    trash_dependencies, user_has_scope, verify_backup_file, verify_totp,
)
from .services.notifications import notify_about_lead
from .services.notifications import send_telegram_message
from .throttles import LeadBurstThrottle, LeadHourlyThrottle


class AdminScopePermission(BasePermission):
    def has_permission(self, request, view):
        return user_has_scope(request.user, getattr(view, 'admin_scope', 'content'))


class AdminTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = str(request.data.get('username', '')).strip()
        cache_key = f'admin-login:{username.lower()}:{request.META.get("REMOTE_ADDR", "")}'
        settings_obj = AdminSecuritySettings.load()
        lock_key = f'{cache_key}:locked'
        if cache_key and request.data.get('password') and timezone.now().timestamp() < float(cache.get(lock_key, 0) or 0):
            log_action(request, action='login_blocked', entity_type='auth', description='Login blocked by rate limit', result='blocked')
            return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        user = authenticate(username=username, password=request.data.get('password', ''))
        if user:
            profile = ensure_admin_profile(user)
            if profile.two_factor_enabled:
                code = str(request.data.get('totp_code') or request.data.get('code') or '').strip()
                secret = decrypt_text(profile.totp_secret_encrypted)
                code_hash = hash_backup_code(code)
                backup_match = next((item for item in profile.backup_codes_hashes if hmac.compare_digest(item, code_hash)), None)
                if not code or not (verify_totp(secret, code) or backup_match):
                    log_action(request, user=user, action='two_factor_failed', entity_type='auth', description='Invalid 2FA code', result='failed')
                    return Response({'detail': 'Two-factor code is required.'}, status=status.HTTP_401_UNAUTHORIZED)
                if backup_match:
                    profile.backup_codes_hashes = [item for item in profile.backup_codes_hashes if item != backup_match]
                    profile.save(update_fields=['backup_codes_hashes', 'updated_at'])
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            if user:
                profile = ensure_admin_profile(user)
                profile.last_login_at = timezone.now()
                profile.last_login_ip_hash = hash_value(request.META.get('REMOTE_ADDR', ''))
                profile.failed_login_count = 0
                profile.locked_until = None
                profile.save(update_fields=['last_login_at', 'last_login_ip_hash', 'failed_login_count', 'locked_until', 'updated_at'])
                cache.delete(cache_key)
                log_action(request, user=user, action='login', entity_type='auth', description='Admin login', result='success')
            return response
        attempts = int(cache.get(cache_key, 0) or 0) + 1
        cache.set(cache_key, attempts, timeout=settings_obj.login_lockout_minutes * 60)
        if attempts >= settings_obj.login_lockout_attempts:
            until = timezone.now() + timedelta(minutes=settings_obj.login_lockout_minutes)
            cache.set(lock_key, until.timestamp(), timeout=settings_obj.login_lockout_minutes * 60)
        log_action(request, action='login_failed', entity_type='auth', description='Failed admin login', result='failed')
        return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)


class VersionedModelMixin:
    admin_scope = 'content'

    def get_queryset(self):
        qs = super().get_queryset()
        if hasattr(qs.model, 'deleted_at') and self.request.query_params.get('include_deleted') not in ['1', 'true', 'yes']:
            qs = qs.filter(deleted_at__isnull=True)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        create_version(instance, self.request.user, 'create', f'Created {object_title(instance)}')
        log_action(self.request, action='create', entity_type=instance.__class__.__name__.lower(), entity_id=instance.pk, description=f'Created {object_title(instance)}')

    def perform_update(self, serializer):
        before = snapshot_instance(serializer.instance)
        instance = serializer.save()
        version = create_version(instance, self.request.user, 'update', f'Updated {object_title(instance)}', previous_snapshot=before)
        log_action(self.request, action='update', entity_type=instance.__class__.__name__.lower(), entity_id=instance.pk, description=f'Updated {object_title(instance)}', changed_fields=version.changed_fields)

    def perform_destroy(self, instance):
        if hasattr(instance, 'deleted_at'):
            soft_delete(instance, self.request)
        else:
            log_action(self.request, action='delete', entity_type=instance.__class__.__name__.lower(), entity_id=instance.pk, description=f'Deleted {object_title(instance)}')
            instance.delete()


class AdminWritePublicReadMixin:
    admin_scope = 'content'
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), AdminScopePermission()]


class SiteSettingsViewSet(VersionedModelMixin, AdminWritePublicReadMixin, viewsets.ModelViewSet):
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer

    def list(self, request, *args, **kwargs):
        instance = self.queryset.first()
        if not instance:
            return Response({})
        return Response(self.get_serializer(instance).data)


class AboutPageViewSet(VersionedModelMixin, AdminWritePublicReadMixin, viewsets.ModelViewSet):
    queryset = AboutPage.objects.all()
    serializer_class = AboutPageSerializer

    def list(self, request, *args, **kwargs):
        instance = self.queryset.first()
        if not instance:
            instance = AboutPage.objects.create()
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        instance = self.queryset.first() or AboutPage.objects.create()
        field_name = request.data.get('field')
        uploaded_file = request.FILES.get('file')
        allowed = {'hero_photo', 'resume_file', 'diploma_file'}
        if field_name not in allowed or not uploaded_file:
            return Response({'detail': 'Передайте field і file.'}, status=status.HTTP_400_BAD_REQUEST)

        if field_name == 'hero_photo' and not uploaded_file.content_type.startswith('image/'):
            return Response({'detail': 'Для портрета потрібне зображення.'}, status=status.HTTP_400_BAD_REQUEST)
        if field_name in {'resume_file', 'diploma_file'}:
            allowed_types = {'application/pdf', 'image/png', 'image/jpeg', 'image/webp'}
            if uploaded_file.content_type not in allowed_types:
                return Response({'detail': 'Документ має бути PDF, PNG, JPG або WEBP.'}, status=status.HTTP_400_BAD_REQUEST)

        old_file = getattr(instance, field_name)
        if old_file:
            old_file.delete(save=False)
        setattr(instance, field_name, uploaded_file)
        instance.save(update_fields=[field_name, 'updated_at'])
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_file(self, request):
        instance = self.queryset.first() or AboutPage.objects.create()
        field_name = request.data.get('field')
        if field_name not in {'hero_photo', 'resume_file', 'diploma_file'}:
            return Response({'detail': 'Невідоме поле.'}, status=status.HTTP_400_BAD_REQUEST)
        file_field = getattr(instance, field_name)
        if file_field:
            file_field.delete(save=False)
        setattr(instance, field_name, None)
        instance.save(update_fields=[field_name, 'updated_at'])
        return Response(self.get_serializer(instance).data)


class ServiceViewSet(VersionedModelMixin, AdminWritePublicReadMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True)
        return qs


class ProjectViewSet(VersionedModelMixin, AdminWritePublicReadMixin, viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True).exclude(status='draft')
        category = self.request.query_params.get('category')
        featured = self.request.query_params.get('featured')
        if category and category != 'all':
            qs = qs.filter(category__iexact=category)
        if featured in ['1', 'true', 'True']:
            qs = qs.filter(featured=True)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def upload_cover(self, request, slug=None):
        project = self.get_object()
        uploaded_file = request.FILES.get('file')
        if not uploaded_file or not uploaded_file.content_type.startswith('image/'):
            return Response({'detail': 'Потрібне зображення.'}, status=status.HTTP_400_BAD_REQUEST)
        if project.cover_image:
            project.cover_image.delete(save=False)
        project.cover_image = uploaded_file
        project.save(update_fields=['cover_image'])
        return Response(self.get_serializer(project).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_cover(self, request, slug=None):
        project = self.get_object()
        if project.cover_image:
            project.cover_image.delete(save=False)
        project.cover_image = None
        project.save(update_fields=['cover_image'])
        return Response(self.get_serializer(project).data)


class TestimonialViewSet(VersionedModelMixin, AdminWritePublicReadMixin, viewsets.ModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True, is_published=True, is_verified=True)
        return qs


class PricingPlanViewSet(VersionedModelMixin, AdminWritePublicReadMixin, viewsets.ModelViewSet):
    queryset = PricingPlan.objects.all()
    serializer_class = PricingPlanSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True)
        return qs


class FAQViewSet(VersionedModelMixin, AdminWritePublicReadMixin, viewsets.ModelViewSet):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True)
        return qs


class BlogPostViewSet(VersionedModelMixin, AdminWritePublicReadMixin, viewsets.ModelViewSet):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            now = timezone.now()
            qs = qs.filter(Q(status='published') | Q(status='scheduled', published_at__lte=now))
        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def upload_cover(self, request, slug=None):
        post = self.get_object()
        uploaded_file = request.FILES.get('file')
        if not uploaded_file or not uploaded_file.content_type.startswith('image/'):
            return Response({'detail': 'Потрібне зображення.'}, status=status.HTTP_400_BAD_REQUEST)
        if post.cover_image:
            post.cover_image.delete(save=False)
        post.cover_image = uploaded_file
        post.save(update_fields=['cover_image'])
        return Response(self.get_serializer(post).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_cover(self, request, slug=None):
        post = self.get_object()
        if post.cover_image:
            post.cover_image.delete(save=False)
            post.cover_image = None
            post.save(update_fields=['cover_image'])
        return Response(self.get_serializer(post).data)


class ContactLeadViewSet(viewsets.ModelViewSet):
    admin_scope = 'leads'
    queryset = ContactLead.objects.all()
    serializer_class = ContactLeadSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), AdminScopePermission()]

    def get_throttles(self):
        if self.action == 'create':
            return [LeadBurstThrottle(), LeadHourlyThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        qs = super().get_queryset().filter(deleted_at__isnull=True)
        params = self.request.query_params
        query = params.get('q', '').strip()
        if query:
            qs = qs.filter(
                Q(name__icontains=query) |
                Q(contact_value__icontains=query) |
                Q(telegram__icontains=query) |
                Q(message__icontains=query)
            )
        status_value = params.get('status')
        if status_value and status_value != 'all':
            qs = qs.filter(status=status_value)
        read_value = params.get('read')
        if read_value == 'unread':
            qs = qs.filter(is_read=False)
        elif read_value == 'read':
            qs = qs.filter(is_read=True)
        service = params.get('service')
        if service:
            qs = qs.filter(service__icontains=service)
        source = params.get('source')
        if source:
            qs = qs.filter(source__icontains=source)
        if params.get('has_next_action') in ['1', 'true', 'yes']:
            qs = qs.filter(next_action_at__isnull=False)
        if params.get('overdue') in ['1', 'true', 'yes']:
            qs = qs.filter(next_action_at__lt=timezone.now()).exclude(status__in=['completed', 'rejected', 'spam'])
        if params.get('spam') not in ['1', 'true', 'yes']:
            qs = qs.exclude(status='spam')
        period = params.get('period')
        now = timezone.now()
        if period == 'today':
            qs = qs.filter(created_at__date=timezone.localdate())
        elif period == '7d':
            qs = qs.filter(created_at__gte=now - timedelta(days=7))
        elif period == '30d':
            qs = qs.filter(created_at__gte=now - timedelta(days=30))
        date_from = params.get('date_from')
        date_to = params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        ordering_map = {
            'oldest': 'created_at',
            'updated': '-updated_at',
            'next_action': 'next_action_at',
            'status': 'status',
            'newest': '-created_at',
        }
        return qs.order_by(ordering_map.get(params.get('ordering'), '-created_at'))

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save(source='portfolio-contact-form', status='new')
        create_version(lead, None, 'create', 'Public contact lead created')
        log_action(request, action='lead_created', entity_type='leads', entity_id=lead.pk, description='Public contact form submission')
        notify_about_lead(lead)
        return Response(
            {
                'id': lead.pk,
                'status': lead.status,
                'created_at': lead.created_at,
                'detail': 'Заявку прийнято.',
            },
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        lead = self.get_object()
        if not lead.is_read:
            lead.is_read = True
            lead.viewed_at = timezone.now()
            lead.save(update_fields=['is_read', 'viewed_at', 'updated_at'])
        return Response(self.get_serializer(lead).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_read(self, request, pk=None):
        lead = self.get_object()
        before = snapshot_instance(lead)
        read = bool(request.data.get('is_read', True))
        lead.is_read = read
        lead.viewed_at = timezone.now() if read and not lead.viewed_at else (None if not read else lead.viewed_at)
        lead.save(update_fields=['is_read', 'viewed_at', 'updated_at'])
        version = create_version(lead, request.user, 'update', 'Lead read state changed', previous_snapshot=before)
        log_action(request, action='lead_mark_read', entity_type='leads', entity_id=lead.pk, description='Lead read state changed', changed_fields=version.changed_fields)
        return Response(self.get_serializer(lead).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def retry_notifications(self, request, pk=None):
        lead = self.get_object()
        result = notify_about_lead(lead)
        return Response({'lead': self.get_serializer(lead).data, 'notifications': result})

    def perform_update(self, serializer):
        before = snapshot_instance(serializer.instance)
        instance = serializer.save()
        version = create_version(instance, self.request.user, 'update', f'Updated lead {instance.pk}', previous_snapshot=before)
        log_action(self.request, action='lead_update', entity_type='leads', entity_id=instance.pk, description=f'Updated lead {instance.pk}', changed_fields=version.changed_fields)

    def perform_destroy(self, instance):
        soft_delete(instance, self.request)


class TelegramBotUserViewSet(viewsets.ModelViewSet):
    queryset = TelegramBotUser.objects.all()
    serializer_class = TelegramBotUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def status(self, request):
        return Response({
            'users': TelegramBotUser.objects.count(),
            'recipients': TelegramBotUser.objects.filter(is_notification_recipient=True, is_blocked=False).count(),
            'has_token': bool(os.getenv('TELEGRAM_BOT_TOKEN', '').strip()),
        })

    @action(detail=True, methods=['post'])
    def test_message(self, request, pk=None):
        user = self.get_object()
        ok, error = send_telegram_message(
            user.chat_id,
            'Тестове сповіщення з адмінпанелі портфоліо. Якщо бачиш це повідомлення, Telegram налаштований правильно.',
        )
        return Response({'sent': ok, 'error': error})


class PageSectionViewSet(VersionedModelMixin, viewsets.ModelViewSet):
    queryset = PageSection.objects.all()
    serializer_class = PageSectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    admin_scope = 'content'

    def get_queryset(self):
        qs = super().get_queryset()
        page = self.request.query_params.get('page')
        if page:
            qs = qs.filter(page=page)
        return qs

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        order = request.data.get('order', [])
        if not isinstance(order, list):
            return Response({'detail': 'order має бути масивом ID.'}, status=status.HTTP_400_BAD_REQUEST)
        sections = {section.id: section for section in PageSection.objects.filter(id__in=order)}
        for index, section_id in enumerate(order):
            section = sections.get(int(section_id)) if str(section_id).isdigit() else None
            if section:
                section.order = index
                section.save(update_fields=['order', 'updated_at'])
        return Response(PageSectionSerializer(self.get_queryset(), many=True, context={'request': request}).data)

    @action(detail=False, methods=['post'])
    def seed_defaults(self, request):
        page = request.data.get('page', 'home')
        defaults = {
            'home': ['Hero', 'Про мене', 'Послуги', 'Переваги', 'Етапи роботи', 'Проєкти', 'Відгуки', 'Ціни', 'FAQ', 'CTA', 'Контакти'],
            'about': ['Hero', 'Історія', 'Шлях', 'Проєкт BABY LAND', 'AI напрям', 'Освіта', 'Документи', 'Фінальний CTA'],
            'projects': ['Hero', 'Фільтри', 'Список проєктів', 'CTA'],
            'services': ['Hero', 'Послуги', 'Процес', 'FAQ', 'CTA'],
            'pricing': ['Hero', 'Пакети', 'FAQ', 'CTA'],
            'blog': ['Hero', 'Список статей', 'CTA'],
            'contact': ['Hero', 'Контакти', 'Форма'],
        }
        titles = defaults.get(page, defaults['home'])
        created = []
        for index, title in enumerate(titles):
            section, was_created = PageSection.objects.get_or_create(
                page=page,
                section_type=slugify(title, allow_unicode=True) or f'section-{index}',
                defaults={'title': title, 'order': index, 'is_system': index == 0, 'settings': {'description': title}},
            )
            if was_created:
                created.append(section.id)
        return Response({'created': created, 'sections': PageSectionSerializer(PageSection.objects.filter(page=page), many=True).data})


class MediaAssetViewSet(VersionedModelMixin, viewsets.ModelViewSet):
    queryset = MediaAsset.objects.all()
    serializer_class = MediaAssetSerializer
    permission_classes = [permissions.IsAuthenticated]
    admin_scope = 'media'
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        query = self.request.query_params.get('q', '').strip()
        category = self.request.query_params.get('category', '').strip()
        media_type = self.request.query_params.get('type', '').strip()
        if query:
            qs = qs.filter(Q(title__icontains=query) | Q(original_name__icontains=query) | Q(alt_text__icontains=query))
        if category:
            qs = qs.filter(category__iexact=category)
        if media_type == 'image':
            qs = qs.filter(mime_type__startswith='image/')
        elif media_type == 'document':
            qs = qs.exclude(mime_type__startswith='image/')
        return qs

    def perform_create(self, serializer):
        uploaded = self.request.FILES.get('file')
        if uploaded:
            content_type = uploaded.content_type or ''
            if content_type not in MediaAsset.SAFE_CONTENT_TYPES:
                raise ValueError('Небезпечний або непідтримуваний тип файлу.')
            if uploaded.size > 12 * 1024 * 1024:
                raise ValueError('Файл завеликий. Ліміт 12 MB.')
            serializer.save(
                uploaded_by=self.request.user,
                original_name=uploaded.name,
                title=self.request.data.get('title') or uploaded.name,
                mime_type=content_type,
                size=uploaded.size,
            )
        else:
            serializer.save(uploaded_by=self.request.user)
        self._fill_image_metadata(serializer.instance)

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    def _fill_image_metadata(self, asset):
        if not asset.mime_type.startswith('image/') or not asset.file:
            return
        try:
            from io import BytesIO
            from PIL import Image

            asset.file.open('rb')
            image = Image.open(asset.file)
            asset.width, asset.height = image.size
            image.thumbnail((420, 420))
            output = BytesIO()
            image.convert('RGB').save(output, format='WEBP', quality=82)
            asset.thumbnail.save(f'{asset.pk}-thumb.webp', ContentFile(output.getvalue()), save=False)
            asset.save(update_fields=['width', 'height', 'thumbnail', 'updated_at'])
        except Exception:
            asset.save(update_fields=['updated_at'])

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def replace_file(self, request, pk=None):
        asset = self.get_object()
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'detail': 'Передайте file.'}, status=status.HTTP_400_BAD_REQUEST)
        if uploaded.content_type not in MediaAsset.SAFE_CONTENT_TYPES:
            return Response({'detail': 'Небезпечний або непідтримуваний тип файлу.'}, status=status.HTTP_400_BAD_REQUEST)
        asset.file = uploaded
        asset.original_name = uploaded.name
        asset.mime_type = uploaded.content_type
        asset.size = uploaded.size
        asset.save()
        self._fill_image_metadata(asset)
        return Response(self.get_serializer(asset).data)


class SeoMetadataViewSet(VersionedModelMixin, viewsets.ModelViewSet):
    queryset = SeoMetadata.objects.all()
    serializer_class = SeoMetadataSerializer
    permission_classes = [permissions.IsAuthenticated]
    admin_scope = 'seo'

    def get_queryset(self):
        qs = super().get_queryset()
        issue_filter = self.request.query_params.get('filter')
        if issue_filter == 'noindex':
            qs = qs.filter(index=False)
        elif issue_filter == 'missing_title':
            qs = qs.filter(seo_title='')
        elif issue_filter == 'missing_description':
            qs = qs.filter(seo_description='')
        elif issue_filter == 'missing_og':
            qs = qs.filter(og_image__isnull=True, og_image_url='')
        return qs

    @action(detail=False, methods=['post'])
    def seed_defaults(self, request):
        defaults = [
            ('home', '/', 'Головна'),
            ('about', '/about', 'Про мене'),
            ('projects', '/projects', 'Проєкти'),
            ('services', '/services', 'Послуги'),
            ('pricing', '/pricing', 'Ціни'),
            ('blog', '/blog', 'Блог'),
            ('contact', '/contact', 'Контакти'),
        ]
        for page_key, path_value, title in defaults:
            SeoMetadata.objects.get_or_create(
                page_key=page_key,
                content_type='page',
                object_id='',
                defaults={'path': path_value, 'seo_title': title, 'slug': page_key, 'canonical_url': path_value},
            )
        return Response(self.get_serializer(self.get_queryset(), many=True).data)


class EditorDraftViewSet(viewsets.ModelViewSet):
    queryset = EditorDraft.objects.all()
    serializer_class = EditorDraftSerializer
    permission_classes = [permissions.IsAuthenticated]
    admin_scope = 'content'

    def get_queryset(self):
        qs = super().get_queryset().filter(user=self.request.user)
        entity_type = self.request.query_params.get('entity_type')
        entity_id = self.request.query_params.get('entity_id')
        page_key = self.request.query_params.get('page_key')
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if entity_id:
            qs = qs.filter(entity_id=entity_id)
        if page_key:
            qs = qs.filter(page_key=page_key)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CertificateViewSet(VersionedModelMixin, AdminWritePublicReadMixin, viewsets.ModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_authenticated:
            qs = qs.filter(is_active=True)
        return qs


class ContentVersionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ContentVersion.objects.select_related('author', 'previous_version')
    serializer_class = ContentVersionSerializer
    permission_classes = [permissions.IsAuthenticated, AdminScopePermission]
    admin_scope = 'content'

    def get_queryset(self):
        qs = super().get_queryset()
        entity_type = self.request.query_params.get('entity_type')
        entity_id = self.request.query_params.get('entity_id')
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if entity_id:
            qs = qs.filter(entity_id=str(entity_id))
        return qs

    @action(detail=True, methods=['get'])
    def compare(self, request, pk=None):
        current = self.get_object()
        other_id = request.query_params.get('other')
        other = ContentVersion.objects.filter(pk=other_id).first() if other_id else current.previous_version
        changes = compare_snapshots(other.snapshot if other else {}, current.snapshot)
        return Response({
            'left': ContentVersionSerializer(other, context={'request': request}).data if other else None,
            'right': ContentVersionSerializer(current, context={'request': request}).data,
            'changes': changes,
        })

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        version = self.get_object()
        if request.data.get('confirm') not in [True, 'true', '1', 1]:
            return Response({'detail': 'Confirmation is required.'}, status=status.HTTP_400_BAD_REQUEST)
        model = VERSION_MODELS.get(version.entity_type) or VERSION_MODELS.get(f'{version.entity_type}s')
        if not model:
            for candidate in set(VERSION_MODELS.values()):
                if candidate.__name__.lower() == version.entity_type:
                    model = candidate
                    break
        if not model:
            return Response({'detail': 'Unknown version entity type.'}, status=status.HTTP_400_BAD_REQUEST)
        instance = model.objects.filter(pk=version.entity_id).first()
        if not instance:
            return Response({'detail': 'Current object was not found.'}, status=status.HTTP_404_NOT_FOUND)
        before = snapshot_instance(instance)
        create_version(instance, request.user, 'backup', f'Pre-restore backup before v{version.version_number}', previous_snapshot=before, status='pre_restore')
        apply_snapshot(instance, version.snapshot)
        restored = model.objects.get(pk=instance.pk)
        created = create_version(restored, request.user, 'restore', f'Restored version {version.version_number}', previous_snapshot=before, status='restored')
        log_action(request, action='version_restore', entity_type=version.entity_type, entity_id=version.entity_id, description=f'Restored version {version.version_number}', changed_fields=created.changed_fields)
        return Response({'restored': ContentVersionSerializer(created, context={'request': request}).data, 'object_id': instance.pk})

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        version = self.get_object()
        draft = EditorDraft.objects.create(
            entity_type=version.entity_type,
            entity_id=version.entity_id,
            page_key=f'version-{version.pk}',
            user=request.user,
            payload=version.snapshot,
            server_updated_at=timezone.now(),
        )
        log_action(request, action='version_duplicate', entity_type=version.entity_type, entity_id=version.entity_id, description=f'Duplicated version {version.version_number} to draft')
        return Response(EditorDraftSerializer(draft, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        version = self.get_object()
        return Response({'version': ContentVersionSerializer(version, context={'request': request}).data, 'snapshot': version.snapshot})


class TrashViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, AdminScopePermission]
    admin_scope = 'content'

    def list(self, request):
        settings_obj = AdminSecuritySettings.load()
        items = []
        for key, model in TRASH_MODELS.items():
            for obj in model.objects.filter(deleted_at__isnull=False).select_related('deleted_by')[:200]:
                purge_after = obj.deleted_at + timedelta(days=settings_obj.trash_retention_days)
                items.append({
                    'type': key,
                    'id': str(obj.pk),
                    'title': object_title(obj),
                    'deleted_at': obj.deleted_at,
                    'deleted_by': obj.deleted_by.username if obj.deleted_by else '',
                    'purge_after': purge_after,
                    'days_left': max((purge_after.date() - timezone.localdate()).days, 0),
                    'dependencies': trash_dependencies(model, obj),
                })
        items.sort(key=lambda item: item['deleted_at'], reverse=True)
        return Response(items)

    @action(detail=False, methods=['post'])
    def restore(self, request):
        model = TRASH_MODELS.get(request.data.get('type'))
        pk = request.data.get('id')
        if not model or not pk:
            return Response({'detail': 'type and id are required.'}, status=status.HTTP_400_BAD_REQUEST)
        obj = restore_deleted(model, pk, request)
        return Response({'restored': True, 'type': request.data.get('type'), 'id': obj.pk})

    @action(detail=False, methods=['post'])
    def purge(self, request):
        model = TRASH_MODELS.get(request.data.get('type'))
        pk = request.data.get('id')
        if not model or not pk:
            return Response({'detail': 'type and id are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('password'):
            if not request.user.check_password(request.data.get('password')):
                log_action(request, action='purge_blocked', entity_type=request.data.get('type'), entity_id=pk, description='Wrong password for purge', result='blocked')
                return Response({'detail': 'Re-authorization failed.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'detail': 'Password confirmation is required.'}, status=status.HTTP_400_BAD_REQUEST)
        obj = model.objects.filter(pk=pk, deleted_at__isnull=False).first()
        if not obj:
            return Response({'detail': 'Trash item was not found.'}, status=status.HTTP_404_NOT_FOUND)
        deps = trash_dependencies(model, obj)
        if deps and request.data.get('force') not in [True, 'true', '1', 1]:
            return Response({'detail': 'Object has dependencies.', 'dependencies': deps}, status=status.HTTP_409_CONFLICT)
        title = object_title(obj)
        obj.delete()
        log_action(request, action='purge', entity_type=request.data.get('type'), entity_id=pk, description=f'Permanently deleted {title}')
        return Response({'purged': True})

    @action(detail=False, methods=['post'])
    def bulk_restore(self, request):
        restored = []
        for item in request.data.get('items', []):
            model = TRASH_MODELS.get(item.get('type'))
            if model and item.get('id'):
                restored.append({'type': item.get('type'), 'id': restore_deleted(model, item.get('id'), request).pk})
        return Response({'restored': restored})


class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, AdminScopePermission]
    admin_scope = 'analytics'

    def list(self, request):
        data = analytics_payload(
            period=request.query_params.get('period', '7d'),
            date_from=request.query_params.get('date_from'),
            date_to=request.query_params.get('date_to'),
        )
        return Response(data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        rows = analytics_csv_response_rows(
            period=request.query_params.get('period', '7d'),
            date_from=request.query_params.get('date_from'),
            date_to=request.query_params.get('date_to'),
        )
        buffer = StringIO()
        writer = csv.DictWriter(buffer, fieldnames=['id', 'created_at', 'status', 'source', 'service', 'budget', 'has_first_response', 'utm_source'])
        writer.writeheader()
        writer.writerows(rows)
        log_action(request, action='analytics_export', entity_type='analytics', description='Exported filtered analytics CSV')
        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="portfolio-analytics.csv"'
        return response


class AdminBackupViewSet(viewsets.ModelViewSet):
    queryset = AdminBackup.objects.all()
    serializer_class = AdminBackupSerializer
    permission_classes = [permissions.IsAuthenticated, AdminScopePermission]
    admin_scope = 'security'

    def create(self, request, *args, **kwargs):
        if AdminBackup.objects.filter(status='running').exists():
            return Response({'detail': 'Backup is already running.'}, status=status.HTTP_409_CONFLICT)
        backup = create_backup(user=request.user, backup_type='manual')
        log_action(request, action='backup_create', entity_type='backup', entity_id=backup.pk, description=f'Created backup {backup.file_name}', result='success' if backup.status == 'success' else 'failed')
        return Response(self.get_serializer(backup).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        backup = self.get_object()
        ok, error = verify_backup_file(backup)
        log_action(request, action='backup_verify', entity_type='backup', entity_id=backup.pk, description=f'Verified backup {backup.file_name}', result='success' if ok else 'failed')
        return Response({'ok': ok, 'error': error, 'backup': self.get_serializer(backup).data})

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        backup = self.get_object()
        if backup.status != 'success' or not backup.file_path or not Path(backup.file_path).exists():
            return Response({'detail': 'Backup file is not available.'}, status=status.HTTP_404_NOT_FOUND)
        log_action(request, action='backup_download', entity_type='backup', entity_id=backup.pk, description=f'Downloaded backup {backup.file_name}')
        return FileResponse(open(backup.file_path, 'rb'), as_attachment=True, filename=backup.file_name)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        backup = self.get_object()
        if not request.data.get('password') or not request.user.check_password(request.data.get('password')):
            log_action(request, action='backup_restore_blocked', entity_type='backup', entity_id=backup.pk, description='Backup restore re-authorization failed', result='blocked')
            return Response({'detail': 'Password confirmation is required.'}, status=status.HTTP_403_FORBIDDEN)
        ok, error = restore_backup_file(backup, user=request.user)
        log_action(request, action='backup_restore', entity_type='backup', entity_id=backup.pk, description=f'Restored backup {backup.file_name}', result='success' if ok else 'failed')
        return Response({'ok': ok, 'error': error, 'backup': self.get_serializer(backup).data})

    def destroy(self, request, *args, **kwargs):
        backup = self.get_object()
        if request.data.get('password') and not request.user.check_password(request.data.get('password')):
            return Response({'detail': 'Re-authorization failed.'}, status=status.HTTP_403_FORBIDDEN)
        if backup.file_path and Path(backup.file_path).exists():
            Path(backup.file_path).unlink()
        backup.status = 'deleted'
        backup.save(update_fields=['status'])
        log_action(request, action='backup_delete', entity_type='backup', entity_id=backup.pk, description=f'Deleted backup {backup.file_name}')
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminActionLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AdminActionLog.objects.select_related('user')
    serializer_class = AdminActionLogSerializer
    permission_classes = [permissions.IsAuthenticated, AdminScopePermission]
    admin_scope = 'audit'

    def get_queryset(self):
        qs = super().get_queryset()
        query = self.request.query_params.get('q', '').strip()
        if query:
            qs = qs.filter(Q(action__icontains=query) | Q(description__icontains=query) | Q(entity_type__icontains=query))
        for key in ['action', 'entity_type', 'result']:
            value = self.request.query_params.get(key)
            if value:
                qs = qs.filter(**{key: value})
        user = self.request.query_params.get('user')
        if user:
            qs = qs.filter(user__username__icontains=user)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs


class AdminSecurityViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, AdminScopePermission]
    admin_scope = 'security'

    def list(self, request):
        profile = ensure_admin_profile(request.user)
        settings_obj = AdminSecuritySettings.load()
        return Response({
            'profile': AdminProfileSerializer(profile, context={'request': request}).data,
            'settings': AdminSecuritySettingsSerializer(settings_obj).data,
            'roles': [{'key': key, 'permissions': sorted(list(value))} for key, value in ROLE_PERMISSIONS.items()],
            'failed_logins': AdminActionLog.objects.filter(action='login_failed').count(),
            'recent_critical_actions': AdminActionLogSerializer(AdminActionLog.objects.filter(action__in=['backup_restore', 'purge', 'role_update', 'two_factor_disable'])[:10], many=True).data,
            'active_sessions': 1,
            'password_policy': 'Use a unique long password; lockout is enabled after configured failed attempts.',
        })

    @action(detail=False, methods=['get', 'patch'], url_path='settings')
    def security_settings(self, request):
        obj = AdminSecuritySettings.load()
        if request.method == 'PATCH':
            serializer = AdminSecuritySettingsSerializer(obj, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            log_action(request, action='security_settings_update', entity_type='security', description='Updated security settings')
            return Response(serializer.data)
        return Response(AdminSecuritySettingsSerializer(obj).data)

    @action(detail=False, methods=['get'])
    def roles(self, request):
        profiles = [ensure_admin_profile(user) for user in get_user_model().objects.filter(is_staff=True)]
        return Response(AdminProfileSerializer([profile for profile in profiles if profile], many=True).data)

    @action(detail=False, methods=['post'])
    def update_role(self, request):
        if not request.user.is_superuser and ensure_admin_profile(request.user).role != AdminProfile.ROLE_OWNER:
            return Response({'detail': 'Only owner can change roles.'}, status=status.HTTP_403_FORBIDDEN)
        profile = AdminProfile.objects.get(pk=request.data.get('profile_id'))
        role = request.data.get('role')
        if role not in dict(AdminProfile.ROLE_CHOICES):
            return Response({'detail': 'Unknown role.'}, status=status.HTTP_400_BAD_REQUEST)
        before = profile.role
        profile.role = role
        profile.save(update_fields=['role', 'updated_at'])
        log_action(request, action='role_update', entity_type='admin_profile', entity_id=profile.pk, description=f'Role changed from {before} to {role}')
        return Response(AdminProfileSerializer(profile).data)

    @action(detail=False, methods=['post'])
    def setup_2fa(self, request):
        profile = ensure_admin_profile(request.user)
        secret = generate_totp_secret()
        profile.totp_secret_encrypted = encrypt_text(secret)
        profile.two_factor_enabled = False
        profile.save(update_fields=['totp_secret_encrypted', 'two_factor_enabled', 'updated_at'])
        uri = f'otpauth://totp/DK Portfolio:{request.user.username}?secret={secret}&issuer=DK Portfolio'
        log_action(request, action='two_factor_setup_start', entity_type='security', description='Started 2FA setup')
        return Response({'secret': secret, 'otpauth_uri': uri})

    @action(detail=False, methods=['post'])
    def confirm_2fa(self, request):
        profile = ensure_admin_profile(request.user)
        secret = decrypt_text(profile.totp_secret_encrypted)
        if not secret or not verify_totp(secret, request.data.get('code')):
            return Response({'detail': 'Invalid 2FA code.'}, status=status.HTTP_400_BAD_REQUEST)
        codes = backup_codes()
        profile.two_factor_enabled = True
        profile.backup_codes_hashes = [hash_backup_code(code) for code in codes]
        profile.save(update_fields=['two_factor_enabled', 'backup_codes_hashes', 'updated_at'])
        log_action(request, action='two_factor_enable', entity_type='security', description='Enabled 2FA')
        return Response({'enabled': True, 'backup_codes': codes})

    @action(detail=False, methods=['post'])
    def disable_2fa(self, request):
        profile = ensure_admin_profile(request.user)
        if not request.data.get('password') or not request.user.check_password(request.data.get('password')):
            return Response({'detail': 'Password confirmation is required.'}, status=status.HTTP_403_FORBIDDEN)
        profile.two_factor_enabled = False
        profile.totp_secret_encrypted = ''
        profile.backup_codes_hashes = []
        profile.save(update_fields=['two_factor_enabled', 'totp_secret_encrypted', 'backup_codes_hashes', 'updated_at'])
        log_action(request, action='two_factor_disable', entity_type='security', description='Disabled 2FA')
        return Response({'enabled': False})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search(request):
    query = request.query_params.get('q', '').strip()
    if len(query) < 2:
        return Response({'projects': [], 'services': [], 'posts': []})
    projects = Project.objects.filter(
        Q(title__icontains=query) | Q(summary__icontains=query) | Q(category__icontains=query),
        is_active=True,
    ).exclude(status='draft')[:8]
    services = Service.objects.filter(
        Q(title__icontains=query) | Q(summary__icontains=query), is_active=True
    )[:8]
    posts = BlogPost.objects.filter(
        Q(title__icontains=query) | Q(excerpt__icontains=query), status='published'
    )[:8]
    serializer_context = {'request': request}
    return Response({
        'projects': ProjectSerializer(projects, many=True, context=serializer_context).data,
        'services': ServiceSerializer(services, many=True, context=serializer_context).data,
        'posts': BlogPostSerializer(posts, many=True, context=serializer_context).data,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def editor_preview(request):
    page = request.query_params.get('page', 'home')
    serializer_context = {'request': request}
    return Response({
        'page': page,
        'settings': SiteSettingsSerializer(SiteSettings.objects.first(), context=serializer_context).data if SiteSettings.objects.exists() else {},
        'about': AboutPageSerializer(AboutPage.objects.first(), context=serializer_context).data if AboutPage.objects.exists() else {},
        'sections': PageSectionSerializer(PageSection.objects.filter(page=page), many=True, context=serializer_context).data,
        'projects': ProjectSerializer(Project.objects.all()[:8], many=True, context=serializer_context).data,
        'services': ServiceSerializer(Service.objects.all()[:8], many=True, context=serializer_context).data,
        'pricing': PricingPlanSerializer(PricingPlan.objects.all()[:6], many=True, context=serializer_context).data,
        'posts': BlogPostSerializer(BlogPost.objects.all()[:6], many=True, context=serializer_context).data,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    lead_statuses = ContactLead.objects.values('status').annotate(total=Count('id'))
    unread_leads = ContactLead.objects.filter(is_read=False).count()
    pending_response = ContactLead.objects.filter(
        status__in=['new', 'viewed', 'in_progress'],
        first_response_at__isnull=True,
    ).exclude(status='spam').count()
    stale_leads = ContactLead.objects.filter(
        updated_at__lt=now - timedelta(days=3),
        status__in=['new', 'viewed', 'in_progress', 'waiting_client'],
    ).count()
    notification_errors = ContactLead.objects.exclude(notification_errors='').count()
    draft_posts = BlogPost.objects.filter(status='draft').count()
    projects_without_cover = Project.objects.filter(cover_image='', cover_image_url='').count()
    valid_month_leads = ContactLead.objects.filter(created_at__gte=month_start, deleted_at__isnull=True).exclude(status='spam')
    valid_month_count = valid_month_leads.count()
    completed_month_count = valid_month_leads.filter(status='completed').count()
    response_seconds = [
        (lead.first_response_at - lead.created_at).total_seconds()
        for lead in valid_month_leads.exclude(first_response_at__isnull=True)
    ]
    latest_backup = AdminBackup.objects.filter(status='success').order_by('-created_at').first()
    trash_count = sum(model.objects.filter(deleted_at__isnull=False).count() for model in TRASH_MODELS.values())
    failed_logins = AdminActionLog.objects.filter(action='login_failed', created_at__gte=now - timedelta(days=7)).count()
    critical_security_events = AdminActionLog.objects.filter(
        action__in=['login_blocked', 'backup_restore', 'purge', 'role_update', 'two_factor_disable'],
        created_at__gte=now - timedelta(days=7),
    ).count()
    seo_issue_count = sum(
        1 for item in SeoMetadata.objects.all()
        if not item.seo_title or not item.seo_description or (not item.og_image and not item.og_image_url) or not item.index
    )
    recent_leads = ContactLead.objects.all().order_by('-created_at')[:8]
    recent_activity = []
    for lead in ContactLead.objects.order_by('-created_at')[:5]:
        recent_activity.append({
            'type': 'lead_created',
            'title': f'Нова заявка: {lead.name}',
            'created_at': lead.created_at,
        })
    for post in BlogPost.objects.order_by('-updated_at')[:4]:
        recent_activity.append({
            'type': 'post',
            'title': f'Стаття: {post.title}',
            'created_at': post.updated_at,
        })
    recent_activity = sorted(
        [item for item in recent_activity if item.get('created_at')],
        key=lambda item: item['created_at'],
        reverse=True,
    )[:8]
    system_attention = [
        {'key': 'backup_missing', 'title': 'Backup ще не створено', 'description': 'Створи першу резервну копію бази та media.', 'count': 1 if not latest_backup else 0, 'url': '/admin/backups'},
        {'key': 'security_events', 'title': 'Критичні події безпеки', 'description': 'Події за останні 7 днів.', 'count': critical_security_events, 'url': '/admin/audit-log'},
        {'key': 'trash', 'title': 'Записи у кошику', 'description': 'Можна відновити або остаточно видалити після перевірки.', 'count': trash_count, 'url': '/admin/trash'},
        {'key': 'failed_logins', 'title': 'Невдалі входи', 'description': 'Перевір журнал входів і lockout.', 'count': failed_logins, 'url': '/admin/audit-log?action=login_failed'},
        {'key': 'seo_issues', 'title': 'SEO-проблеми', 'description': 'Сторінки з неповними SEO-даними.', 'count': seo_issue_count, 'url': '/admin/seo'},
    ]
    return Response({
        'projects': Project.objects.count(),
        'active_projects': Project.objects.filter(is_active=True).exclude(status='draft').count(),
        'services': Service.objects.count(),
        'leads': ContactLead.objects.count(),
        'new_leads': ContactLead.objects.filter(status='new').count(),
        'unread_leads': unread_leads,
        'pending_response': pending_response,
        'in_progress_leads': ContactLead.objects.filter(status='in_progress').count(),
        'waiting_client_leads': ContactLead.objects.filter(status='waiting_client').count(),
        'completed_this_month': ContactLead.objects.filter(status='completed', updated_at__gte=month_start).count(),
        'conversion_this_month': round((completed_month_count / valid_month_count) * 100, 1) if valid_month_count else 0,
        'avg_response_seconds': round(sum(response_seconds) / len(response_seconds)) if response_seconds else None,
        'latest_backup_at': latest_backup.created_at if latest_backup else None,
        'latest_backup_status': latest_backup.status if latest_backup else '',
        'trash_count': trash_count,
        'failed_logins_7d': failed_logins,
        'critical_security_events_7d': critical_security_events,
        'seo_issue_count': seo_issue_count,
        'recent_changes': ContentVersionSerializer(ContentVersion.objects.order_by('-created_at')[:5], many=True, context={'request': request}).data,
        'posts': BlogPost.objects.count(),
        'draft_posts': draft_posts,
        'lead_statuses': list(lead_statuses),
        'recent_leads': ContactLeadSerializer(recent_leads, many=True, context={'request': request}).data,
        'attention': [
            item for item in [
                {'key': 'unread', 'title': 'Непереглянуті заявки', 'description': 'Нові звернення, які ще ніхто не відкривав.', 'count': unread_leads, 'url': '/admin/contact?read=unread'},
                {'key': 'no_response', 'title': 'Без першої відповіді', 'description': 'Заявки в роботі або нові, де ще не зафіксована перша відповідь.', 'count': pending_response, 'url': '/admin/contact?status=in_progress'},
                {'key': 'stale', 'title': 'Немає активності 3+ дні', 'description': 'Заявки, які давно не оновлювались.', 'count': stale_leads, 'url': '/admin/contact?overdue=1'},
                {'key': 'draft_posts', 'title': 'Чернетки статей', 'description': 'Матеріали блогу, які ще не опубліковані.', 'count': draft_posts, 'url': '/admin/blog?status=draft'},
                {'key': 'project_covers', 'title': 'Проєкти без обкладинки', 'description': 'Кейси без завантаженої або зовнішньої обкладинки.', 'count': projects_without_cover, 'url': '/admin/projects'},
                {'key': 'notification_errors', 'title': 'Помилки сповіщень', 'description': 'Заявки з помилками Telegram або email.', 'count': notification_errors, 'url': '/admin/contact'},
            ] + system_attention if item['count']
        ],
        'activity': recent_activity,
    })
