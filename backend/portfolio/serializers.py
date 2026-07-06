from rest_framework import serializers
from .models import (
    SiteSettings, Service, Project, Testimonial, PricingPlan, FAQ,
    BlogPost, ContactLead, TelegramBotUser, PageSection, MediaAsset,
    SeoMetadata, EditorDraft, Certificate, AboutPage, ContentVersion,
    AdminActionLog, AdminBackup, AdminProfile, AdminSecuritySettings,
)
from .services.admin_system import compare_snapshots, media_dependencies


def absolute_file_url(serializer, field):
    if not field:
        return ''
    request = serializer.context.get('request')
    try:
        url = field.url
    except (ValueError, AttributeError):
        return ''
    return request.build_absolute_uri(url) if request else url


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = '__all__'


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class TestimonialSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Testimonial
        fields = '__all__'


class ProjectSerializer(serializers.ModelSerializer):
    testimonials = serializers.SerializerMethodField()
    uploaded_cover_url = serializers.SerializerMethodField()

    def get_testimonials(self, obj):
        request = self.context.get('request')
        queryset = obj.testimonials.all()
        if not request or not request.user.is_authenticated:
            queryset = queryset.filter(is_active=True, is_verified=True, is_published=True)
        return TestimonialSerializer(queryset, many=True, context=self.context).data

    def get_uploaded_cover_url(self, obj):
        return absolute_file_url(self, obj.cover_image)

    class Meta:
        model = Project
        fields = '__all__'


class PricingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = '__all__'


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'


class BlogPostSerializer(serializers.ModelSerializer):
    uploaded_cover_url = serializers.SerializerMethodField()

    def get_uploaded_cover_url(self, obj):
        return absolute_file_url(self, obj.cover_image)

    class Meta:
        model = BlogPost
        fields = '__all__'


class ContactLeadSerializer(serializers.ModelSerializer):
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)
    form_elapsed_ms = serializers.IntegerField(required=False, min_value=0, write_only=True)

    class Meta:
        model = ContactLead
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at', 'telegram_notified_at', 'email_notified_at',
            'notification_errors', 'request_fingerprint',
        ]

    def validate_name(self, value):
        value = ' '.join(str(value).split())
        if len(value) < 2:
            raise serializers.ValidationError('Вкажіть ім’я щонайменше з 2 символів.')
        if len(value) > 80:
            raise serializers.ValidationError('Ім’я занадто довге.')
        if 'http://' in value.lower() or 'https://' in value.lower():
            raise serializers.ValidationError('Посилання в полі імені не допускаються.')
        return value

    def validate_message(self, value):
        value = str(value or '').strip()
        if len(value) > 3000:
            raise serializers.ValidationError('Повідомлення має містити не більше 3000 символів.')
        if value.lower().count('http://') + value.lower().count('https://') > 3:
            raise serializers.ValidationError('Забагато посилань у повідомленні.')
        return value

    def validate(self, attrs):
        import hashlib
        import re
        from datetime import timedelta
        from django.conf import settings
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError as DjangoValidationError
        from django.utils import timezone

        if str(attrs.pop('website', '') or '').strip():
            raise serializers.ValidationError({'detail': 'Форму відхилено системою захисту від спаму.'})

        elapsed = attrs.pop('form_elapsed_ms', None)
        if elapsed is not None and elapsed < 2200:
            raise serializers.ValidationError({'detail': 'Форму надіслано надто швидко. Спробуйте ще раз.'})

        if self.instance is not None and 'contact_method' not in attrs and 'contact_value' not in attrs:
            return attrs

        method = attrs.get('contact_method', getattr(self.instance, 'contact_method', None))
        raw = str(attrs.get('contact_value', getattr(self.instance, 'contact_value', '')) or '').strip()
        if method == 'email':
            try:
                validate_email(raw)
            except DjangoValidationError:
                raise serializers.ValidationError({'contact_value': 'Вкажіть коректну email-адресу.'})
            normalized = raw.lower()
        elif method == 'phone':
            compact = re.sub(r'[\s()\-]', '', raw)
            if not re.fullmatch(r'\+?\d{10,15}', compact):
                raise serializers.ValidationError({'contact_value': 'Вкажіть номер у форматі +380XXXXXXXXX.'})
            normalized = compact if compact.startswith('+') else f'+{compact}'
        elif method == 'telegram':
            username = raw
            username = re.sub(r'^https?://t\.me/', '', username, flags=re.I).strip('/')
            username = username[1:] if username.startswith('@') else username
            if not re.fullmatch(r'[A-Za-z0-9_]{5,32}', username):
                raise serializers.ValidationError({'contact_value': 'Вкажіть Telegram username, наприклад @username.'})
            normalized = f'@{username}'
        else:
            raise serializers.ValidationError({'contact_method': 'Оберіть доступний спосіб зв’язку.'})
        attrs['contact_value'] = normalized

        request = self.context.get('request')
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '') if request else ''
        ip = forwarded.split(',')[0].strip() if forwarded else (request.META.get('REMOTE_ADDR', '') if request else '')
        source_string = f'{settings.SECRET_KEY}|{ip}|{method}|{normalized.lower()}'
        fingerprint = hashlib.sha256(source_string.encode('utf-8')).hexdigest()
        attrs['request_fingerprint'] = fingerprint

        if self.instance is None:
            duplicate_after = timezone.now() - timedelta(minutes=10)
            message = attrs.get('message', '')
            if ContactLead.objects.filter(
                request_fingerprint=fingerprint,
                message=message,
                created_at__gte=duplicate_after,
            ).exists():
                raise serializers.ValidationError({'detail': 'Таку заявку вже отримано. Не потрібно надсилати її повторно.'})
        return attrs


class TelegramBotUserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = TelegramBotUser
        fields = '__all__'
        read_only_fields = [
            'chat_id', 'user_id', 'username', 'first_name', 'last_name',
            'language_code', 'last_command', 'last_seen_at', 'created_at', 'updated_at',
            'display_name',
        ]


class PageSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageSection
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class MediaAssetSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    usage = serializers.SerializerMethodField()

    def get_file_url(self, obj):
        return absolute_file_url(self, obj.file)

    def get_thumbnail_url(self, obj):
        return absolute_file_url(self, obj.thumbnail)

    def get_usage(self, obj):
        usages = []
        file_url = obj.file.url if obj.file else ''
        if not file_url:
            return usages
        if Project.objects.filter(cover_image=obj.file.name).exists():
            usages.append('Обкладинка проєкту')
        if BlogPost.objects.filter(cover_image=obj.file.name).exists():
            usages.append('Обкладинка статті')
        if AboutPage.objects.filter(hero_photo=obj.file.name).exists():
            usages.append('Портрет на сторінці Про мене')
        if SeoMetadata.objects.filter(og_image=obj).exists():
            usages.append('Open Graph image')
        return usages

    class Meta:
        model = MediaAsset
        fields = '__all__'
        read_only_fields = [
            'mime_type', 'size', 'width', 'height', 'thumbnail',
            'uploaded_by', 'created_at', 'updated_at', 'file_url', 'thumbnail_url', 'usage',
        ]


def analyze_seo(obj):
    issues = []
    title = obj.seo_title or obj.og_title
    description = obj.seo_description or obj.og_description
    if not title:
        issues.append('Відсутній SEO title.')
    elif len(title) < 25:
        issues.append('SEO title надто короткий.')
    elif len(title) > 70:
        issues.append('SEO title надто довгий.')
    if not description:
        issues.append('Відсутній SEO description.')
    elif len(description) < 70:
        issues.append('SEO description надто короткий.')
    elif len(description) > 170:
        issues.append('SEO description надто довгий.')
    if not obj.canonical_url:
        issues.append('Відсутній canonical URL.')
    if not obj.og_image and not obj.og_image_url:
        issues.append('Відсутнє Open Graph зображення.')
    if obj.slug and ' ' in obj.slug:
        issues.append('Slug містить пробіли.')
    if not obj.index:
        issues.append('Сторінка має noindex.')
    return issues


class SeoMetadataSerializer(serializers.ModelSerializer):
    issues = serializers.SerializerMethodField()
    og_image_url_resolved = serializers.SerializerMethodField()

    def get_issues(self, obj):
        return analyze_seo(obj)

    def get_og_image_url_resolved(self, obj):
        if obj.og_image:
            return absolute_file_url(self, obj.og_image.file)
        return obj.og_image_url

    class Meta:
        model = SeoMetadata
        fields = '__all__'
        read_only_fields = ['updated_at', 'issues', 'og_image_url_resolved']


class EditorDraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = EditorDraft
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


class ContentVersionSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = ContentVersion
        fields = '__all__'
        read_only_fields = ['created_at', 'author_name']


class ContentVersionCompareSerializer(serializers.Serializer):
    left = ContentVersionSerializer(read_only=True)
    right = ContentVersionSerializer(read_only=True)
    changes = serializers.ListField(read_only=True)


class AdminActionLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AdminActionLog
        fields = '__all__'
        read_only_fields = ['created_at', 'user_name']


class AdminBackupSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    restored_by_name = serializers.CharField(source='restored_by.username', read_only=True)

    class Meta:
        model = AdminBackup
        fields = '__all__'
        read_only_fields = [
            'created_at', 'created_by', 'created_by_name', 'restored_by',
            'restored_by_name', 'file_path', 'file_name', 'size',
            'checksum_sha256', 'status', 'error', 'verified_at', 'restored_at',
        ]


class AdminProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    is_superuser = serializers.BooleanField(source='user.is_superuser', read_only=True)

    class Meta:
        model = AdminProfile
        fields = [
            'id', 'user', 'username', 'email', 'is_superuser', 'role',
            'two_factor_enabled', 'last_login_at', 'locked_until',
            'failed_login_count', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'username', 'email', 'is_superuser', 'two_factor_enabled',
            'last_login_at', 'locked_until', 'failed_login_count',
            'created_at', 'updated_at',
        ]


class AdminSecuritySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminSecuritySettings
        fields = '__all__'
        read_only_fields = ['updated_at']


class TrashItemSerializer(serializers.Serializer):
    type = serializers.CharField()
    id = serializers.CharField()
    title = serializers.CharField()
    deleted_at = serializers.DateTimeField()
    deleted_by = serializers.CharField(allow_blank=True)
    purge_after = serializers.DateTimeField()
    days_left = serializers.IntegerField()
    dependencies = serializers.ListField()


class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = '__all__'


class AboutPageSerializer(serializers.ModelSerializer):
    hero_photo_url = serializers.SerializerMethodField()
    resume_file_url = serializers.SerializerMethodField()
    diploma_file_url = serializers.SerializerMethodField()

    def get_hero_photo_url(self, obj):
        return absolute_file_url(self, obj.hero_photo)

    def get_resume_file_url(self, obj):
        return absolute_file_url(self, obj.resume_file)

    def get_diploma_file_url(self, obj):
        return absolute_file_url(self, obj.diploma_file)

    class Meta:
        model = AboutPage
        fields = '__all__'
        read_only_fields = ['updated_at']
