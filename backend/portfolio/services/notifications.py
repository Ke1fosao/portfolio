import json
import logging
import os
from datetime import datetime
from html import escape
from urllib import parse, request
from urllib.error import HTTPError, URLError

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

from portfolio.models import TelegramBotUser

logger = logging.getLogger(__name__)



def _lead_admin_url(lead) -> str:
    base = getattr(settings, 'PUBLIC_SITE_URL', '').rstrip('/')
    return f'{base}/admin/contact?lead={lead.pk}' if base else ''


def _plain_message(lead) -> str:
    method = lead.get_contact_method_display()
    admin_url = _lead_admin_url(lead)
    lines = [
        'Нова заявка з портфоліо',
        '',
        f'Ім’я: {lead.name}',
        f'Спосіб зв’язку: {method}',
        f'Контакт: {lead.contact_value}',
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
        f'<b>Ім’я:</b> {escape(lead.name)}',
        f'<b>Канал:</b> {escape(lead.get_contact_method_display())}',
        f'<b>Контакт:</b> <code>{escape(lead.contact_value)}</code>',
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
    return {chat_id.strip() for chat_id in raw.split(',') if chat_id.strip()}


def is_allowed_telegram_chat(chat_id: str) -> bool:
    allowed = allowed_telegram_chat_ids()
    return not allowed or str(chat_id) in allowed


def send_telegram_message(chat_id: str, text: str, parse_mode: str = 'HTML') -> tuple[bool, str]:
    if not is_allowed_telegram_chat(str(chat_id)):
        return False, 'Telegram: цей chat_id не входить у список дозволених.'
    token = _telegram_token()
    if not token:
        return False, 'Telegram не налаштований: додайте TELEGRAM_BOT_TOKEN у backend/.env.'
    if not chat_id:
        return False, 'Telegram: порожній chat_id.'
    payload = parse.urlencode({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': parse_mode,
        'disable_web_page_preview': 'true',
    }).encode('utf-8')
    api_url = f'https://api.telegram.org/bot{token}/sendMessage'
    http_request = request.Request(api_url, data=payload, method='POST')
    try:
        with request.urlopen(http_request, timeout=8) as response:
            data = json.loads(response.read().decode('utf-8'))
        if data.get('ok'):
            return True, ''
        return False, str(data.get('description') or 'Telegram API повернув помилку.')
    except HTTPError as exc:
        description = ''
        try:
            data = json.loads(exc.read().decode('utf-8'))
            description = str(data.get('description') or '').strip()
        except Exception:
            description = ''
        logger.warning('Telegram notification failed for chat %s with HTTP %s', chat_id, exc.code)
        return False, f'Telegram API: {description or f"HTTP {exc.code}"}'
    except (URLError, TimeoutError):
        logger.warning('Telegram notification connection error for chat %s', chat_id)
        return False, 'Telegram: не вдалося підключитися до API. Спробуйте повторити сповіщення з адмінпанелі.'
    except Exception:
        # Do not serialize the exception or URL: Telegram bot tokens are part of the API path.
        logger.error('Unexpected Telegram notification error for chat %s', chat_id)
        return False, 'Telegram: неочікувана помилка відправлення.'


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
    if not _telegram_token() or not recipients:
        return False, 'Telegram не налаштований: додайте TELEGRAM_BOT_TOKEN і виберіть отримувача в адмінці після /start.'

    errors = []
    sent = 0
    text = _telegram_message(lead)
    for chat_id in recipients:
        ok, error = send_telegram_message(chat_id, text)
        if ok:
            sent += 1
        elif error:
            errors.append(f'{chat_id}: {error}')
    if sent:
        return True, '; '.join(errors)
    return False, '; '.join(errors) or 'Telegram API не прийняв повідомлення.'


def send_email_notification(lead) -> tuple[bool, str]:
    recipient = getattr(settings, 'ADMIN_NOTIFICATION_EMAIL', '').strip()
    if not recipient:
        return False, 'Email не налаштований: додайте ADMIN_NOTIFICATION_EMAIL у backend/.env.'

    subject = f'Нова заявка: {lead.name} · {lead.get_contact_method_display()}'
    plain = _plain_message(lead)
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
        return True, ''
    except Exception:
        # SMTP credentials and server diagnostics must not be written into the lead record.
        logger.error('Email lead notification failed for lead %s', lead.pk)
        return False, 'Email: не вдалося надіслати лист. Перевірте SMTP-параметри у backend/.env.'


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
