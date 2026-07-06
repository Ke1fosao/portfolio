import json
import os
import time
from urllib import parse, request
from urllib.error import HTTPError, URLError

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from portfolio.models import ContactLead, TelegramBotUser
from portfolio.services.notifications import is_allowed_telegram_chat, send_telegram_message


class Command(BaseCommand):
    help = 'Runs Telegram bot long polling for local portfolio notifications.'

    def add_arguments(self, parser):
        parser.add_argument('--once', action='store_true', help='Process available updates once and exit.')
        parser.add_argument('--timeout', type=int, default=25)

    def handle(self, *args, **options):
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
        if not token:
            raise CommandError('TELEGRAM_BOT_TOKEN is missing in backend/.env')

        self.stdout.write(self.style.SUCCESS('Telegram bot polling started. Send /start to the bot.'))
        offset = None
        while True:
            updates = self._get_updates(token, offset, options['timeout'])
            for update in updates:
                offset = int(update['update_id']) + 1
                self._handle_update(update)
            if options['once']:
                break
            time.sleep(1)

    def _get_updates(self, token, offset, timeout):
        params = {'timeout': timeout, 'allowed_updates': json.dumps(['message'])}
        if offset is not None:
            params['offset'] = offset
        url = f'https://api.telegram.org/bot{token}/getUpdates?{parse.urlencode(params)}'
        try:
            with request.urlopen(url, timeout=timeout + 8) as response:
                data = json.loads(response.read().decode('utf-8'))
            if not data.get('ok'):
                self.stderr.write(str(data.get('description') or 'Telegram getUpdates failed.'))
                return []
            return data.get('result', [])
        except (HTTPError, URLError, TimeoutError) as exc:
            self.stderr.write(f'Telegram polling error: {exc}')
            return []

    def _handle_update(self, update):
        message = update.get('message') or {}
        chat = message.get('chat') or {}
        sender = message.get('from') or {}
        text = (message.get('text') or '').strip()
        chat_id = str(chat.get('id') or '')
        if not chat_id:
            return
        if not is_allowed_telegram_chat(chat_id):
            TelegramBotUser.objects.update_or_create(
                chat_id=chat_id,
                defaults={
                    'user_id': str(sender.get('id') or ''),
                    'username': sender.get('username') or '',
                    'first_name': sender.get('first_name') or chat.get('first_name') or '',
                    'last_name': sender.get('last_name') or chat.get('last_name') or '',
                    'language_code': sender.get('language_code') or '',
                    'last_command': text[:120],
                    'last_seen_at': timezone.now(),
                    'is_blocked': True,
                    'is_notification_recipient': False,
                },
            )
            return

        bot_user, _ = TelegramBotUser.objects.update_or_create(
            chat_id=chat_id,
            defaults={
                'user_id': str(sender.get('id') or ''),
                'username': sender.get('username') or '',
                'first_name': sender.get('first_name') or chat.get('first_name') or '',
                'last_name': sender.get('last_name') or chat.get('last_name') or '',
                'language_code': sender.get('language_code') or '',
                'last_command': text[:120],
                'last_seen_at': timezone.now(),
                'is_blocked': False,
            },
        )

        command = text.split()[0].lower() if text else ''
        args = text.split()[1:]
        if command == '/start':
            reply = (
                'Бот підключено до портфоліо і працює тільки для твого chat id.\n\n'
                'Команди: /menu, /status, /today, /new, /leads, /lead ID, /take ID, /done ID, /spam ID, /read ID, /search текст.'
            )
        elif command in ['/help', '/menu']:
            reply = (
                '<b>Команди портфоліо-бота</b>\n'
                '/status - стан CRM\n'
                '/today - заявки за сьогодні\n'
                '/new - нові непрочитані заявки\n'
                '/leads - останні 5 заявок\n'
                '/lead ID - деталі заявки\n'
                '/take ID - взяти заявку в роботу\n'
                '/done ID - завершити заявку\n'
                '/spam ID - позначити як спам\n'
                '/read ID - позначити прочитаною\n'
                '/search текст - пошук по заявках\n'
                '/id - твій chat id'
            )
        elif command == '/id':
            reply = f'Твій chat id: <code>{chat_id}</code>'
        elif command == '/notify_on':
            bot_user.is_notification_recipient = True
            bot_user.save(update_fields=['is_notification_recipient', 'updated_at'])
            reply = 'Сповіщення для цього Telegram увімкнено.'
        elif command == '/notify_off':
            bot_user.is_notification_recipient = False
            bot_user.save(update_fields=['is_notification_recipient', 'updated_at'])
            reply = 'Сповіщення для цього Telegram вимкнено.'
        elif command == '/status':
            reply = self._status_message()
        elif command == '/today':
            reply = self._lead_list_message(ContactLead.objects.filter(created_at__date=timezone.localdate()).order_by('-created_at')[:10], 'Заявки за сьогодні')
        elif command == '/new':
            reply = self._lead_list_message(ContactLead.objects.filter(is_read=False).exclude(status='spam').order_by('-created_at')[:10], 'Нові непрочитані заявки')
        elif command == '/leads':
            reply = self._recent_leads_message()
        elif command == '/lead':
            reply = self._lead_detail(args)
        elif command == '/take':
            reply = self._set_lead_status(args, 'in_progress', 'Заявку взято в роботу.')
        elif command == '/done':
            reply = self._set_lead_status(args, 'completed', 'Заявку завершено.')
        elif command == '/spam':
            reply = self._set_lead_status(args, 'spam', 'Заявку позначено як спам.')
        elif command == '/read':
            reply = self._mark_read(args)
        elif command == '/search':
            reply = self._search_leads(' '.join(args))
        else:
            reply = 'Команда не розпізнана. Напиши /help.'

        ok, error = send_telegram_message(chat_id, reply)
        if not ok:
            self.stderr.write(error)

    def _status_message(self):
        unread = ContactLead.objects.filter(is_read=False).count()
        new = ContactLead.objects.filter(status='new').count()
        in_progress = ContactLead.objects.filter(status='in_progress').count()
        waiting = ContactLead.objects.filter(status='waiting_client').count()
        return (
            '<b>Стан CRM</b>\n'
            f'Нові: <b>{new}</b>\n'
            f'Непрочитані: <b>{unread}</b>\n'
            f'У роботі: <b>{in_progress}</b>\n'
            f'Очікують клієнта: <b>{waiting}</b>'
        )

    def _recent_leads_message(self):
        leads = ContactLead.objects.order_by('-created_at')[:5]
        return self._lead_list_message(leads, 'Останні заявки')

    def _lead_list_message(self, leads, title):
        leads = list(leads)
        if not leads:
            return 'Заявок за цим запитом немає.'
        lines = [f'<b>{title}</b>']
        for lead in leads:
            created = timezone.localtime(lead.created_at).strftime('%d.%m %H:%M')
            unread = ' · unread' if not lead.is_read else ''
            lines.append(f'#{lead.pk} {created} - <b>{lead.name}</b> ({lead.get_status_display()}{unread})')
        return '\n'.join(lines)

    def _lead_detail(self, args):
        lead = self._get_lead(args)
        if isinstance(lead, str):
            return lead
        admin_url = os.getenv('PUBLIC_SITE_URL', 'http://127.0.0.1:5173').rstrip('/') + f'/admin/contact?lead={lead.pk}'
        lines = [
            f'<b>Заявка #{lead.pk}</b>',
            f'Імʼя: <b>{lead.name}</b>',
            f'Статус: {lead.get_status_display()}',
            f'Прочитана: {"так" if lead.is_read else "ні"}',
            f'Контакт: <code>{lead.contact_value}</code>',
            f'Послуга: {lead.service or "не вказано"}',
            f'Бюджет: {lead.budget or "не вказано"}',
            f'Повідомлення: {lead.message or "немає"}',
            f'Адмінка: {admin_url}',
        ]
        return '\n'.join(lines)

    def _set_lead_status(self, args, status, success):
        lead = self._get_lead(args)
        if isinstance(lead, str):
            return lead
        lead.status = status
        if status == 'in_progress' and not lead.first_response_at:
            lead.first_response_at = timezone.now()
        lead.save(update_fields=['status', 'first_response_at', 'updated_at'])
        return f'{success}\n#{lead.pk} {lead.name}: {lead.get_status_display()}'

    def _mark_read(self, args):
        lead = self._get_lead(args)
        if isinstance(lead, str):
            return lead
        lead.is_read = True
        lead.viewed_at = lead.viewed_at or timezone.now()
        lead.save(update_fields=['is_read', 'viewed_at', 'updated_at'])
        return f'Заявку #{lead.pk} позначено прочитаною.'

    def _search_leads(self, query):
        query = query.strip()
        if len(query) < 2:
            return 'Напиши текст пошуку після команди, наприклад: /search сайт'
        leads = ContactLead.objects.filter(
            name__icontains=query
        ) | ContactLead.objects.filter(
            contact_value__icontains=query
        ) | ContactLead.objects.filter(
            message__icontains=query
        )
        return self._lead_list_message(leads.order_by('-created_at')[:10], f'Пошук: {query}')

    def _get_lead(self, args):
        if not args or not str(args[0]).isdigit():
            return 'Передай ID заявки, наприклад: /lead 12'
        try:
            return ContactLead.objects.get(pk=int(args[0]))
        except ContactLead.DoesNotExist:
            return f'Заявку #{args[0]} не знайдено.'
