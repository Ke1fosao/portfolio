import json
import logging
from html import escape
from urllib import parse, request
from urllib.error import HTTPError, URLError

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError, connection
from django.utils import timezone

from portfolio.models import NotificationDelivery, TelegramBotUser

logger = logging.getLogger(__name__)


def notification_delivery_storage_ready() -> bool:
    """Return whether the delivery-log table exists without raising during local upgrades."""
    try:
        return NotificationDelivery._meta.db_table in connection.introspection.table_names()
    except DatabaseError:
        logger.exception('Could not inspect notification delivery storage')
        return False


def record_notification_delivery(
    *,
    channel: str,
    event: str,
    recipient: str = '',
    status: str = 'pending',
    message_preview: str = '',
    error: str = '',
    lead=None,
    metadata: dict | None = None,
    sent_at=None,
):
    """Best-effort delivery logging. Telegram/email delivery must not fail because a migration is pending."""
    try:
        return NotificationDelivery.objects.create(
            lead=lead,
            channel=channel,
            event=event,
            recipient=str(recipient or ''),
            status=status,
            message_preview=(message_preview or '')[:280],
            error=error or '',
            metadata=metadata or {},
            sent_at=sent_at,
        )
    except DatabaseError:
        logger.exception('Notification was sent/attempted, but delivery logging is unavailable. Run migrations.')
        return None


def _lead_admin_url(lead) -> str:
    base = getattr(settings, 'PUBLIC_SITE_URL', '').rstrip('/')
    return f'{base}/admin/contact?lead={lead.pk}' if base else ''


def telegram_web_app_url() -> str:
    configured = getattr(settings, 'TELEGRAM_WEBAPP_URL', '').strip()
    if configured:
        return configured
    base = getattr(settings, 'PUBLIC_SITE_URL', '').rstrip('/')
    return f'{base}/telegram-app' if base else ''


def telegram_web_app_is_ready() -> bool:
    return telegram_web_app_url().lower().startswith('https://')


def telegram_web_app_keyboard() -> dict | None:
    url = telegram_web_app_url()
    if not url:
        return None
    return {
        'inline_keyboard': [[
            {'text': '📱 Відкрити CRM-додаток', 'web_app': {'url': url}},
        ]],
    }


def _plain_message(lead) -> str:
    method = lead.get_contact_method_display()
    admin_url = _lead_admin_url(lead)
    lines = [
        'Нова заявка з портфоліо',
        '',
        f'Ім’я: {lead.name}',
        f'Спосіб зв’язку: {method}',
        f'Контакт: {lead.contact_value}',
        f'Послуга: {lead.service or "Не вказано"}',
        f'Бюджет: {lead.budget or "Не вказано"}',
        f'Повідомлення: {lead.message or "Не вказано"}',
        f'Джерело: {lead.source}',
        f'Створено: {timezone.localtime(lead.created_at).strftime("%d.%m.%Y %H:%M")}',
    ]
    if admin_url:
        lines.extend(['', f'Відкрити в адмінпанелі: {admin_url}'])
    return '\n'.join(lines)


def _telegram_message(lead) -> str:
    admin_url = _lead_admin_url(lead)
    parts = [
        '<b>🟢 Нова заявка з портфоліо</b>',
        '',
        f'<b>№:</b> {lead.pk}',
        f'<b>Ім’я:</b> {escape(lead.name)}',
        f'<b>Канал:</b> {escape(lead.get_contact_method_display())}',
        f'<b>Контакт:</b> <code>{escape(lead.contact_value)}</code>',
        f'<b>Послуга:</b> {escape(lead.service or "Не вказано")}',
        f'<b>Бюджет:</b> {escape(lead.budget or "Не вказано")}',
        f'<b>Повідомлення:</b> {escape(lead.message or "Не вказано")}',
        f'<b>Час:</b> {escape(timezone.localtime(lead.created_at).strftime("%d.%m.%Y %H:%M"))}',
    ]
    if admin_url:
        parts.extend(['', f'<a href="{escape(admin_url)}">Відкрити заявку в адмінпанелі</a>'])
    return '\n'.join(parts)


def _telegram_token() -> str:
    return getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()


def allowed_telegram_chat_ids() -> set[str]:
    raw = getattr(settings, 'TELEGRAM_ALLOWED_CHAT_IDS', '').strip()
    allowed = {chat_id.strip() for chat_id in raw.split(',') if chat_id.strip()}
    fallback = getattr(settings, 'TELEGRAM_CHAT_ID', '').strip()
    if fallback:
        allowed.add(fallback)
    return allowed


def is_allowed_telegram_chat(chat_id: str) -> bool:
    allowed = allowed_telegram_chat_ids()
    return bool(allowed) and str(chat_id) in allowed


def telegram_api_call(method: str, payload: dict | None = None, timeout: int = 8) -> tuple[bool, dict, str]:
    token = _telegram_token()
    if not token:
        return False, {}, 'Telegram не налаштований: додайте TELEGRAM_BOT_TOKEN у backend/.env.'

    encoded_payload = {}
    for key, value in (payload or {}).items():
        if value is None:
            continue
        encoded_payload[key] = json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else value

    api_url = f'https://api.telegram.org/bot{token}/{method}'
    http_request = request.Request(
        api_url,
        data=parse.urlencode(encoded_payload).encode('utf-8'),
        method='POST',
    )
    try:
        with request.urlopen(http_request, timeout=timeout) as response:
            data = json.loads(response.read().decode('utf-8'))
        if data.get('ok'):
            return True, data.get('result') if isinstance(data.get('result'), dict) else {'value': data.get('result')}, ''
        return False, {}, str(data.get('description') or 'Telegram API повернув помилку.')
    except HTTPError as exc:
        description = ''
        try:
            data = json.loads(exc.read().decode('utf-8'))
            description = str(data.get('description') or '').strip()
        except Exception:
            description = ''
        logger.warning('Telegram API method %s failed with HTTP %s', method, exc.code)
        return False, {}, f'Telegram API: {description or f"HTTP {exc.code}"}'
    except (URLError, TimeoutError):
        logger.warning('Telegram API connection error for method %s', method)
        return False, {}, 'Telegram: не вдалося підключитися до API.'
    except Exception:
        logger.exception('Unexpected Telegram API error for method %s', method)
        return False, {}, 'Telegram: неочікувана помилка запиту.'


def send_telegram_message(
    chat_id: str,
    text: str,
    parse_mode: str = 'HTML',
    reply_markup: dict | None = None,
) -> tuple[bool, str]:
    if not is_allowed_telegram_chat(str(chat_id)):
        return False, 'Telegram: цей chat_id не входить у список дозволених.'
    if not chat_id:
        return False, 'Telegram: порожній chat_id.'

    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': parse_mode,
        'disable_web_page_preview': 'true',
    }
    if reply_markup:
        payload['reply_markup'] = reply_markup
    ok, _, error = telegram_api_call('sendMessage', payload)
    return ok, error


def _delivery(lead, channel: str, recipient: str, preview: str, event: str = 'lead_created'):
    return record_notification_delivery(
        lead=lead,
        channel=channel,
        event=event,
        recipient=recipient,
        message_preview=preview,
        status='pending',
    )


def _finish_delivery(delivery, ok: bool, error: str = '', metadata: dict | None = None):
    if delivery is None:
        return
    try:
        delivery.status = 'sent' if ok else 'failed'
        delivery.error = error or ''
        delivery.metadata = metadata or {}
        delivery.sent_at = timezone.now() if ok else None
        delivery.save(update_fields=['status', 'error', 'metadata', 'sent_at'])
    except DatabaseError:
        logger.exception('Could not update notification delivery log. Run migrations.')


def send_telegram_notification(lead) -> tuple[bool, str]:
    recipients = list(TelegramBotUser.objects.filter(
        is_notification_recipient=True,
        is_blocked=False,
    ).values_list('chat_id', flat=True))
    allowed = allowed_telegram_chat_ids()
    if allowed:
        recipients = [chat_id for chat_id in recipients if chat_id in allowed]
    fallback_chat_id = getattr(settings, 'TELEGRAM_CHAT_ID', '').strip()
    if not recipients and fallback_chat_id and (not allowed or fallback_chat_id in allowed):
        recipients = [fallback_chat_id]
    if not recipients and allowed:
        recipients = sorted(allowed)
    recipients = list(dict.fromkeys(recipients))

    if not _telegram_token() or not recipients:
        error = 'Telegram не налаштований: додайте TELEGRAM_BOT_TOKEN і виберіть отримувача в адмінці після /start.'
        delivery = _delivery(lead, 'telegram', '', _telegram_message(lead))
        _finish_delivery(delivery, False, error)
        return False, error

    errors = []
    sent = 0
    text = _telegram_message(lead)
    keyboard = telegram_web_app_keyboard() if telegram_web_app_is_ready() else None
    for chat_id in recipients:
        delivery = _delivery(lead, 'telegram', chat_id, text)
        ok, error = send_telegram_message(chat_id, text, reply_markup=keyboard)
        _finish_delivery(delivery, ok, error, {'web_app_button': bool(keyboard)})
        if ok:
            sent += 1
        elif error:
            errors.append(f'{chat_id}: {error}')
    if sent:
        return True, '; '.join(errors)
    return False, '; '.join(errors) or 'Telegram API не прийняв повідомлення.'


def send_email_notification(lead) -> tuple[bool, str]:
    recipient = getattr(settings, 'ADMIN_NOTIFICATION_EMAIL', '').strip()
    preview = _plain_message(lead)
    delivery = _delivery(lead, 'email', recipient, preview)
    if not recipient:
        error = 'Email не налаштований: додайте ADMIN_NOTIFICATION_EMAIL у backend/.env.'
        _finish_delivery(delivery, False, error)
        return False, error

    subject = f'Нова заявка: {lead.name} · {lead.get_contact_method_display()}'
    plain = preview
    admin_url = _lead_admin_url(lead)
    html = f'''
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172019">
        <div style="padding:24px;border-radius:18px;background:#172019;color:white">
          <div style="font-size:12px;color:#d8ff80;text-transform:uppercase;letter-spacing:.1em">Portfolio lead</div>
          <h1 style="margin:10px 0 0;font-size:28px">Нова заявка з сайту</h1>
        </div>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px">
          <tr><td style="padding:10px;border-bottom:1px solid #e5e8e3;color:#6b746e">Ім’я</td><td style="padding:10px;border-bottom:1px solid #e5e8e3"><b>{escape(lead.name)}</b></td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #e5e8e3;color:#6b746e">Канал</td><td style="padding:10px;border-bottom:1px solid #e5e8e3">{escape(lead.get_contact_method_display())}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #e5e8e3;color:#6b746e">Контакт</td><td style="padding:10px;border-bottom:1px solid #e5e8e3"><b>{escape(lead.contact_value)}</b></td></tr>
        </table>
        <div style="padding:18px;margin-top:16px;border-radius:14px;background:#f1f5ef;line-height:1.65">{escape(lead.message or 'Повідомлення не вказано').replace(chr(10), '<br>')}</div>
        {f'<p style="margin-top:20px"><a href="{escape(admin_url)}" style="display:inline-block;padding:13px 18px;border-radius:999px;background:#205d3b;color:white;text-decoration:none;font-weight:bold">Відкрити в адмінпанелі</a></p>' if admin_url else ''}
      </div>
    '''
    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
            reply_to=[lead.contact_value] if lead.contact_method == 'email' else None,
        )
        email.attach_alternative(html, 'text/html')
        email.send(fail_silently=False)
        _finish_delivery(delivery, True)
        return True, ''
    except Exception:
        logger.exception('Email lead notification failed for lead %s', lead.pk)
        error = 'Email: не вдалося надіслати лист. Перевірте SMTP-параметри у backend/.env.'
        _finish_delivery(delivery, False, error)
        return False, error


def notify_about_lead(lead) -> dict:
    telegram_ok, telegram_error = send_telegram_notification(lead)
    email_ok, email_error = send_email_notification(lead)

    errors = [message for message in [telegram_error, email_error] if message]
    now = timezone.now()
    update_fields = ['notification_errors', 'updated_at']
    lead.notification_errors = '\n'.join(errors)
    if telegram_ok:
        lead.telegram_notified_at = now
        update_fields.append('telegram_notified_at')
    if email_ok:
        lead.email_notified_at = now
        update_fields.append('email_notified_at')
    lead.save(update_fields=update_fields)

    return {
        'telegram_sent': telegram_ok,
        'email_sent': email_ok,
        'errors': errors,
    }
