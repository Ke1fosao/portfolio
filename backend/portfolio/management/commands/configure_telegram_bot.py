from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from portfolio.services.notifications import (
    allowed_telegram_chat_ids, send_telegram_message, telegram_api_call,
    telegram_web_app_is_ready, telegram_web_app_keyboard, telegram_web_app_url,
)


class Command(BaseCommand):
    help = 'Configures Telegram bot commands and the private Mini App menu button.'

    def handle(self, *args, **options):
        if not getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip():
            raise CommandError('TELEGRAM_BOT_TOKEN is missing in backend/.env')
        if not telegram_web_app_is_ready():
            raise CommandError(f'TELEGRAM_WEBAPP_URL must be public HTTPS. Current: {telegram_web_app_url()}')
        allowed = sorted(allowed_telegram_chat_ids())
        if not allowed:
            raise CommandError('TELEGRAM_ALLOWED_CHAT_IDS is empty.')

        commands = [
            {'command': 'app', 'description': 'Відкрити CRM-додаток'},
            {'command': 'status', 'description': 'Короткий стан CRM'},
            {'command': 'new', 'description': 'Нові непрочитані заявки'},
            {'command': 'today', 'description': 'Заявки за сьогодні'},
            {'command': 'leads', 'description': 'Останні заявки'},
            {'command': 'help', 'description': 'Усі команди'},
        ]
        ok, _, error = telegram_api_call('setMyCommands', {'commands': commands})
        if not ok:
            raise CommandError(error)
        self.stdout.write(self.style.SUCCESS('Bot commands configured.'))

        for chat_id in allowed:
            menu = {'type': 'web_app', 'text': 'Відкрити CRM', 'web_app': {'url': telegram_web_app_url()}}
            ok, _, error = telegram_api_call('setChatMenuButton', {'chat_id': chat_id, 'menu_button': menu})
            if not ok:
                self.stderr.write(self.style.ERROR(f'{chat_id}: {error}'))
                continue
            sent, send_error = send_telegram_message(
                chat_id,
                '<b>CRM Mini App готовий.</b>\nНатисни кнопку нижче або кнопку меню біля поля введення.',
                reply_markup=telegram_web_app_keyboard(),
            )
            if not sent:
                self.stderr.write(self.style.WARNING(f'{chat_id}: {send_error}'))
            self.stdout.write(self.style.SUCCESS(f'Menu button configured for {chat_id}.'))
