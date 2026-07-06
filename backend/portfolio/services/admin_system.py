import base64
import csv
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import shutil
import sqlite3
import time
import zipfile
from datetime import datetime, timedelta
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.db.models import Count
from django.forms.models import model_to_dict
from django.utils import timezone

from portfolio.models import (
    AdminActionLog,
    AdminBackup,
    AdminProfile,
    AdminSecuritySettings,
    BlogPost,
    ContactLead,
    ContentVersion,
    FAQ,
    MediaAsset,
    PageSection,
    PricingPlan,
    Project,
    SeoMetadata,
    Service,
    SiteSettings,
    Testimonial,
    Certificate,
)


SENSITIVE_KEYS = {
    'password', 'token', 'secret', 'key', 'cookie', 'session',
    'totp_secret_encrypted', 'backup_codes_hashes',
}

VERSION_MODELS = {
    'settings': SiteSettings,
    'service': Service,
    'services': Service,
    'project': Project,
    'projects': Project,
    'testimonial': Testimonial,
    'testimonials': Testimonial,
    'pricing': PricingPlan,
    'pricingplan': PricingPlan,
    'faq': FAQ,
    'faqs': FAQ,
    'post': BlogPost,
    'posts': BlogPost,
    'lead': ContactLead,
    'leads': ContactLead,
    'page_section': PageSection,
    'page-sections': PageSection,
    'media_asset': MediaAsset,
    'media-assets': MediaAsset,
    'seo': SeoMetadata,
    'seo-metadata': SeoMetadata,
    'certificate': Certificate,
    'certificates': Certificate,
}

TRASH_MODELS = {
    'projects': Project,
    'posts': BlogPost,
    'services': Service,
    'faqs': FAQ,
    'testimonials': Testimonial,
    'pricing': PricingPlan,
    'certificates': Certificate,
    'media-assets': MediaAsset,
    'leads': ContactLead,
    'page-sections': PageSection,
}


def client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '') if request else ''
    return forwarded.split(',')[0].strip() if forwarded else (request.META.get('REMOTE_ADDR', '') if request else '')


def hash_value(value):
    if not value:
        return ''
    return hashlib.sha256(f'{settings.SECRET_KEY}|{value}'.encode('utf-8')).hexdigest()


def mask_user_agent(request):
    ua = request.META.get('HTTP_USER_AGENT', '') if request else ''
    return ua[:220]


def is_sensitive_key(key):
    lowered = str(key).lower()
    return any(part in lowered for part in SENSITIVE_KEYS)


def sanitize_value(value):
    if isinstance(value, dict):
        return {key: ('[redacted]' if is_sensitive_key(key) else sanitize_value(val)) for key, val in value.items()}
    if isinstance(value, list):
        return [sanitize_value(item) for item in value]
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def snapshot_instance(instance):
    data = model_to_dict(instance)
    data['id'] = instance.pk
    clean = {}
    for key, value in data.items():
        if is_sensitive_key(key):
            clean[key] = '[redacted]'
            continue
        if hasattr(value, 'pk'):
            clean[key] = value.pk
        else:
            clean[key] = sanitize_value(value)
    return clean


def changed_fields(before, after):
    changes = []
    for key in sorted(set(before) | set(after)):
        if is_sensitive_key(key):
            continue
        if before.get(key) != after.get(key):
            changes.append({'field': key, 'old': before.get(key), 'new': after.get(key)})
    return changes


def create_version(instance, user=None, action='update', description='', previous_snapshot=None, status='saved'):
    entity_type = instance.__class__.__name__.lower()
    entity_id = str(instance.pk)
    latest = ContentVersion.objects.filter(entity_type=entity_type, entity_id=entity_id).order_by('-version_number').first()
    snapshot = snapshot_instance(instance)
    changes = changed_fields(previous_snapshot or {}, snapshot) if previous_snapshot is not None else []
    return ContentVersion.objects.create(
        entity_type=entity_type,
        entity_id=entity_id,
        version_number=(latest.version_number + 1) if latest else 1,
        snapshot=snapshot,
        author=user if getattr(user, 'is_authenticated', False) else None,
        action=action,
        description=description[:260],
        previous_version=latest,
        changed_fields=changes,
        status=status,
    )


def log_action(request=None, user=None, action='action', entity_type='', entity_id='', description='', result='success', changed_fields=None, metadata=None):
    actor = user or (request.user if request and getattr(request, 'user', None) and request.user.is_authenticated else None)
    safe_metadata = sanitize_value(metadata or {})
    return AdminActionLog.objects.create(
        user=actor,
        action=action,
        entity_type=entity_type[:80],
        entity_id=str(entity_id or '')[:80],
        description=description[:320],
        result=result,
        ip_hash=hash_value(client_ip(request)),
        user_agent=mask_user_agent(request),
        request_id=(request.META.get('HTTP_X_REQUEST_ID', '') if request else '')[:80],
        changed_fields=changed_fields or [],
        metadata=safe_metadata,
    )


def ensure_admin_profile(user):
    if not user or not user.is_authenticated:
        return None
    role = AdminProfile.ROLE_OWNER if user.is_superuser else AdminProfile.ROLE_ADMIN
    profile, _ = AdminProfile.objects.get_or_create(user=user, defaults={'role': role})
    if user.is_superuser and profile.role != AdminProfile.ROLE_OWNER:
        profile.role = AdminProfile.ROLE_OWNER
        profile.save(update_fields=['role', 'updated_at'])
    return profile


ROLE_PERMISSIONS = {
    AdminProfile.ROLE_OWNER: {'*'},
    AdminProfile.ROLE_ADMIN: {'content', 'leads', 'analytics', 'seo', 'media', 'audit', 'security'},
    AdminProfile.ROLE_EDITOR: {'content', 'seo', 'media'},
    AdminProfile.ROLE_LEAD_MANAGER: {'leads'},
    AdminProfile.ROLE_ANALYTICS: {'analytics'},
}


def user_has_scope(user, scope):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    profile = ensure_admin_profile(user)
    allowed = ROLE_PERMISSIONS.get(profile.role if profile else '', set())
    return '*' in allowed or scope in allowed


def model_label(instance_or_model):
    model = instance_or_model if isinstance(instance_or_model, type) else instance_or_model.__class__
    for key, value in TRASH_MODELS.items():
        if value is model:
            return key
    for key, value in VERSION_MODELS.items():
        if value is model:
            return key
    return model.__name__.lower()


def object_title(obj):
    for field in ('title', 'name', 'question', 'author', 'page_key', 'original_name'):
        if hasattr(obj, field) and getattr(obj, field):
            return str(getattr(obj, field))
    return str(obj)


def soft_delete(instance, request):
    before = snapshot_instance(instance)
    instance.deleted_at = timezone.now()
    instance.deleted_by = request.user
    instance.save(update_fields=['deleted_at', 'deleted_by'])
    create_version(instance, request.user, 'delete', f'Soft deleted {object_title(instance)}', previous_snapshot=before)
    log_action(request, action='soft_delete', entity_type=model_label(instance), entity_id=instance.pk, description=f'Moved to trash: {object_title(instance)}')


def restore_deleted(model, pk, request):
    obj = model.objects.get(pk=pk)
    before = snapshot_instance(obj)
    obj.deleted_at = None
    obj.deleted_by = None
    obj.save(update_fields=['deleted_at', 'deleted_by'])
    create_version(obj, request.user, 'restore', f'Restored {object_title(obj)}', previous_snapshot=before)
    log_action(request, action='restore_deleted', entity_type=model_label(model), entity_id=pk, description=f'Restored from trash: {object_title(obj)}')
    return obj


def media_dependencies(asset):
    deps = []
    if not asset:
        return deps
    if Project.objects.filter(cover_image=asset.file.name, deleted_at__isnull=True).exists():
        deps.append('Used as project cover')
    if BlogPost.objects.filter(cover_image=asset.file.name, deleted_at__isnull=True).exists():
        deps.append('Used as blog cover')
    if SeoMetadata.objects.filter(og_image=asset).exists():
        deps.append('Used as SEO Open Graph image')
    return deps


def trash_dependencies(model, obj):
    if model is MediaAsset:
        return media_dependencies(obj)
    if model is Project and Testimonial.objects.filter(project=obj, deleted_at__isnull=True).exists():
        return ['Project has testimonials']
    if model is PageSection and obj.is_system:
        return ['System section is part of page structure']
    return []


def compare_snapshots(old, new):
    return changed_fields(old or {}, new or {})


def apply_snapshot(instance, snapshot):
    blocked = {'id', 'pk', 'deleted_by'}
    for key, value in (snapshot or {}).items():
        if key in blocked or is_sensitive_key(key) or not hasattr(instance, key):
            continue
        field = instance._meta.get_field(key)
        if getattr(field, 'many_to_many', False):
            continue
        if field.is_relation and value:
            setattr(instance, f'{key}_id', value)
        else:
            setattr(instance, key, value)
    instance.save()
    return instance


def encrypt_text(value):
    if not value:
        return ''
    key = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
    raw = value.encode('utf-8')
    stream = hashlib.sha256(key + b'totp').digest()
    encrypted = bytes(byte ^ stream[index % len(stream)] for index, byte in enumerate(raw))
    return base64.urlsafe_b64encode(encrypted).decode('ascii')


def decrypt_text(value):
    if not value:
        return ''
    key = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
    stream = hashlib.sha256(key + b'totp').digest()
    raw = base64.urlsafe_b64decode(value.encode('ascii'))
    return bytes(byte ^ stream[index % len(stream)] for index, byte in enumerate(raw)).decode('utf-8')


def generate_totp_secret():
    return base64.b32encode(secrets.token_bytes(20)).decode('ascii').rstrip('=')


def totp_code(secret, interval=None):
    interval = int(time.time() // 30) if interval is None else interval
    padded = secret + ('=' * ((8 - len(secret) % 8) % 8))
    key = base64.b32decode(padded, casefold=True)
    msg = interval.to_bytes(8, 'big')
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code = ((digest[offset] & 0x7F) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3]
    return str(code % 1000000).zfill(6)


def verify_totp(secret, code):
    clean = ''.join(str(code or '').split())
    now_interval = int(time.time() // 30)
    return any(hmac.compare_digest(totp_code(secret, now_interval + drift), clean) for drift in (-1, 0, 1))


def backup_codes():
    return [f'{secrets.token_hex(4)}-{secrets.token_hex(4)}' for _ in range(8)]


def hash_backup_code(code):
    return hashlib.sha256(f'{settings.SECRET_KEY}|backup-code|{code}'.encode('utf-8')).hexdigest()


def backup_root():
    root = Path(getattr(settings, 'PORTFOLIO_BACKUP_DIR', settings.BASE_DIR.parent / 'backups'))
    root.mkdir(parents=True, exist_ok=True)
    return root


def create_backup(user=None, backup_type='manual'):
    record = AdminBackup.objects.create(created_by=user if getattr(user, 'is_authenticated', False) else None, backup_type=backup_type, status='running')
    timestamp = timezone.localtime().strftime('%Y%m%d-%H%M%S')
    file_name = f'portfolio-backup-{timestamp}-{record.pk}.zip'
    file_path = backup_root() / file_name
    try:
        db_path = settings.DATABASES['default']['NAME']
        with zipfile.ZipFile(file_path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            if db_path and Path(db_path).exists():
                archive.write(db_path, 'database/db.sqlite3')
            media_root = Path(settings.MEDIA_ROOT)
            if media_root.exists():
                for path in media_root.rglob('*'):
                    if path.is_file():
                        archive.write(path, f'media/{path.relative_to(media_root).as_posix()}')
            manifest = {
                'created_at': timezone.now().isoformat(),
                'type': backup_type,
                'includes': ['database', 'media'],
                'excluded': ['.env', 'tokens', 'passwords', 'session cookies'],
            }
            archive.writestr('manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
        digest = hashlib.sha256()
        with open(file_path, 'rb') as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b''):
                digest.update(chunk)
        record.file_path = str(file_path)
        record.file_name = file_name
        record.size = file_path.stat().st_size
        record.checksum_sha256 = digest.hexdigest()
        record.status = 'success'
        record.save(update_fields=['file_path', 'file_name', 'size', 'checksum_sha256', 'status'])
    except Exception as exc:
        record.status = 'failed'
        record.error = str(exc)
        record.save(update_fields=['status', 'error'])
    return record


def verify_backup_file(record):
    path = Path(record.file_path)
    if not path.exists() or record.status != 'success':
        return False, 'Backup file is missing or not successful.'
    digest = hashlib.sha256()
    try:
        with open(path, 'rb') as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b''):
                digest.update(chunk)
        if record.checksum_sha256 and digest.hexdigest() != record.checksum_sha256:
            return False, 'Checksum mismatch.'
        with zipfile.ZipFile(path, 'r') as archive:
            bad = archive.testzip()
            if bad:
                return False, f'Corrupted archive member: {bad}'
            if 'database/db.sqlite3' not in archive.namelist():
                return False, 'Database file is missing from backup.'
        record.verified_at = timezone.now()
        record.save(update_fields=['verified_at'])
        return True, ''
    except Exception as exc:
        return False, str(exc)


def restore_backup_file(record, user=None):
    ok, error = verify_backup_file(record)
    if not ok:
        return False, error
    current_backup = create_backup(user=user, backup_type='pre_restore')
    if current_backup.status != 'success':
        return False, f'Could not create pre-restore backup: {current_backup.error}'
    db_path = Path(settings.DATABASES['default']['NAME'])
    try:
        with zipfile.ZipFile(record.file_path, 'r') as archive:
            with archive.open('database/db.sqlite3') as source, open(db_path, 'wb') as target:
                shutil.copyfileobj(source, target)
            media_root = Path(settings.MEDIA_ROOT)
            for member in archive.namelist():
                if member.startswith('media/') and not member.endswith('/'):
                    target = media_root / Path(member).relative_to('media')
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with archive.open(member) as source, open(target, 'wb') as output:
                        shutil.copyfileobj(source, output)
        sqlite3.connect(db_path).execute('select 1').close()
        record.restored_at = timezone.now()
        record.restored_by = user if getattr(user, 'is_authenticated', False) else None
        record.save(update_fields=['restored_at', 'restored_by'])
        return True, ''
    except Exception as exc:
        return False, str(exc)


def analytics_period(period, date_from=None, date_to=None):
    today = timezone.localdate()
    if period == 'today':
        start = end = today
    elif period == 'yesterday':
        start = end = today - timedelta(days=1)
    elif period == '30d':
        end = today
        start = today - timedelta(days=29)
    elif period == 'month':
        start = today.replace(day=1)
        end = today
    elif period == 'previous_month':
        first = today.replace(day=1)
        end = first - timedelta(days=1)
        start = end.replace(day=1)
    elif period == 'custom' and date_from and date_to:
        start = datetime.fromisoformat(date_from).date()
        end = datetime.fromisoformat(date_to).date()
    else:
        end = today
        start = today - timedelta(days=6)
    days = max((end - start).days + 1, 1)
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days - 1)
    return start, end, prev_start, prev_end


def lead_queryset_for_period(start, end):
    return ContactLead.objects.filter(deleted_at__isnull=True, created_at__date__gte=start, created_at__date__lte=end)


def analytics_payload(period='7d', date_from=None, date_to=None):
    start, end, prev_start, prev_end = analytics_period(period, date_from, date_to)
    qs = lead_queryset_for_period(start, end)
    prev_qs = lead_queryset_for_period(prev_start, prev_end)
    valid = qs.exclude(status='spam')
    valid_count = valid.count()
    in_work_count = valid.filter(status__in=['in_progress', 'waiting_client', 'completed']).count()
    completed_count = valid.filter(status='completed').count()
    first_response_values = [
        (lead.first_response_at - lead.created_at).total_seconds()
        for lead in valid.exclude(first_response_at__isnull=True)
    ]
    processing_values = [
        (lead.updated_at - lead.created_at).total_seconds()
        for lead in valid.filter(status__in=['completed', 'rejected'])
    ]
    by_day = []
    day = start
    while day <= end:
        by_day.append({'date': day.isoformat(), 'total': qs.filter(created_at__date=day).count()})
        day += timedelta(days=1)
    funnel_steps = [
        ('received', 'Received', qs.count()),
        ('viewed', 'Viewed', valid.filter(status__in=['viewed', 'in_progress', 'waiting_client', 'completed']).count()),
        ('in_progress', 'In progress', valid.filter(status__in=['in_progress', 'waiting_client', 'completed']).count()),
        ('waiting_client', 'Waiting client', valid.filter(status__in=['waiting_client', 'completed']).count()),
        ('completed', 'Completed', completed_count),
    ]
    funnel = []
    previous = None
    for key, label, count in funnel_steps:
        transition = None if previous in (None, 0) else round((count / previous) * 100, 1)
        loss = 0 if previous is None else max(previous - count, 0)
        funnel.append({'key': key, 'label': label, 'count': count, 'transition_percent': transition, 'loss': loss})
        previous = count
    sources = list(qs.values('source').annotate(total=Count('id')).order_by('-total'))
    services = list(qs.values('service').annotate(total=Count('id')).order_by('-total'))
    return {
        'period': {'start': start.isoformat(), 'end': end.isoformat(), 'previous_start': prev_start.isoformat(), 'previous_end': prev_end.isoformat()},
        'kpi': {
            'total': qs.count(),
            'previous_total': prev_qs.count(),
            'new': qs.filter(status='new').count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'waiting_client': qs.filter(status='waiting_client').count(),
            'completed': completed_count,
            'rejected': qs.filter(status='rejected').count(),
            'spam': qs.filter(status='spam').count(),
            'work_conversion': round((in_work_count / valid_count) * 100, 1) if valid_count else 0,
            'completion_conversion': round((completed_count / valid_count) * 100, 1) if valid_count else 0,
            'avg_first_response_seconds': round(sum(first_response_values) / len(first_response_values)) if first_response_values else None,
            'avg_processing_seconds': round(sum(processing_values) / len(processing_values)) if processing_values else None,
            'without_response': valid.filter(first_response_at__isnull=True).count(),
        },
        'formulas': {
            'work_conversion': 'in_progress + waiting_client + completed / all non-spam leads',
            'completion_conversion': 'completed / all non-spam leads',
            'avg_first_response': 'first_response_at - created_at',
            'avg_processing': 'updated_at - created_at for completed or rejected leads',
        },
        'by_day': by_day,
        'funnel': funnel,
        'sources': [{'source': item['source'] or 'Unknown', 'total': item['total']} for item in sources],
        'services': [{'service': item['service'] or 'Unknown', 'total': item['total']} for item in services],
    }


def analytics_csv_response_rows(period='7d', date_from=None, date_to=None):
    start, end, _, _ = analytics_period(period, date_from, date_to)
    rows = []
    for lead in lead_queryset_for_period(start, end).order_by('-created_at'):
        rows.append({
            'id': lead.id,
            'created_at': lead.created_at.isoformat(),
            'status': lead.status,
            'source': lead.source or 'Unknown',
            'service': lead.service or 'Unknown',
            'budget': lead.budget,
            'has_first_response': bool(lead.first_response_at),
            'utm_source': lead.utm_source,
        })
    return rows
