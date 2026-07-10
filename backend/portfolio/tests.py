from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import ContactLead


@override_settings(
    ALLOWED_HOSTS=['testserver'],
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    ADMIN_NOTIFICATION_EMAIL='',
    TELEGRAM_BOT_TOKEN='',
    TELEGRAM_ALLOWED_CHAT_IDS='',
    TELEGRAM_CHAT_ID='',
)
class ContactLeadApiTests(APITestCase):
    endpoint = '/api/leads/'

    def setUp(self):
        cache.clear()

    def payload(self, **overrides):
        data = {
            'name': 'Тестовий клієнт',
            'contact_method': 'telegram',
            'contact_value': '@test_user',
            'message': 'Потрібен сайт для бізнесу',
            'website': '',
            'form_elapsed_ms': 3500,
        }
        data.update(overrides)
        return data

    def test_public_form_creates_lead_even_without_notification_credentials(self):
        response = self.client.post(self.endpoint, self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead = ContactLead.objects.get()
        self.assertEqual(lead.status, 'new')
        self.assertEqual(lead.contact_value, '@test_user')
        self.assertIn('Telegram не налаштований', lead.notification_errors)

    def test_honeypot_blocks_submission(self):
        response = self.client.post(self.endpoint, self.payload(website='spam.example'), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(ContactLead.objects.exists())

    def test_contact_validation_depends_on_selected_method(self):
        response = self.client.post(self.endpoint, self.payload(contact_method='email', contact_value='not-an-email'), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('contact_value', response.data)

    def test_duplicate_submission_is_rejected(self):
        first = self.client.post(self.endpoint, self.payload(), format='json')
        second = self.client.post(self.endpoint, self.payload(), format='json')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ContactLead.objects.count(), 1)


import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

from django.test import SimpleTestCase

from .services.telegram_webapp import TelegramWebAppAuthError, validate_telegram_init_data


@override_settings(
    TELEGRAM_BOT_TOKEN='123456:TEST_TOKEN',
    TELEGRAM_ALLOWED_CHAT_IDS='123456789',
    TELEGRAM_INIT_DATA_MAX_AGE=3600,
)
class TelegramMiniAppAuthTests(SimpleTestCase):
    def signed_init_data(self, user_id='123456789', auth_date=None):
        values = {
            'auth_date': str(auth_date or int(time.time())),
            'query_id': 'AAE-test-query',
            'user': json.dumps({'id': int(user_id), 'first_name': 'Dmytro'}, separators=(',', ':')),
        }
        data_check_string = '\n'.join(f'{key}={values[key]}' for key in sorted(values))
        secret = hmac.new(b'WebAppData', b'123456:TEST_TOKEN', hashlib.sha256).digest()
        values['hash'] = hmac.new(secret, data_check_string.encode(), hashlib.sha256).hexdigest()
        return urlencode(values)

    def test_valid_owner_session_is_accepted(self):
        session = validate_telegram_init_data(self.signed_init_data())
        self.assertEqual(session.user_id, '123456789')

    def test_other_telegram_user_is_rejected(self):
        with self.assertRaises(TelegramWebAppAuthError):
            validate_telegram_init_data(self.signed_init_data(user_id='111111111'))

    def test_expired_session_is_rejected(self):
        with self.assertRaises(TelegramWebAppAuthError):
            validate_telegram_init_data(self.signed_init_data(auth_date=int(time.time()) - 7200))

from unittest.mock import patch

from django.contrib.auth import get_user_model

from .models import TelegramBotUser


@override_settings(
    TELEGRAM_BOT_TOKEN='123456:TEST_TOKEN',
    TELEGRAM_ALLOWED_CHAT_IDS='912880272',
    TELEGRAM_CHAT_ID='',
    TELEGRAM_WEBAPP_URL='http://127.0.0.1:5173/telegram-app',
)
class TelegramNotificationAdminApiTests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(username='telegram-admin', password='test-pass')
        self.client.force_authenticate(self.admin)

    @staticmethod
    def fake_api(method, payload=None, timeout=8):
        if method == 'getMe':
            return True, {'id': 77, 'username': 'portfolio_test_bot', 'first_name': 'Portfolio'}, ''
        if method == 'getWebhookInfo':
            return True, {'url': '', 'pending_update_count': 0}, ''
        if method == 'getMyCommands':
            return True, {'value': [{'command': 'status', 'description': 'CRM'}]}, ''
        if method == 'getChatMenuButton':
            return True, {'type': 'commands'}, ''
        if method == 'getChat':
            return True, {
                'id': int((payload or {}).get('chat_id')),
                'username': 'dmytro_owner',
                'first_name': 'Дмитро',
                'last_name': 'Ковтунович',
            }, ''
        if method in {'setMyCommands', 'setChatMenuButton'}:
            return True, {}, ''
        return False, {}, f'Unexpected method: {method}'

    @patch('portfolio.views.telegram_api_call')
    def test_status_syncs_allowed_owner_into_user_list(self, telegram_api):
        telegram_api.side_effect = self.fake_api
        response = self.client.get('/api/telegram-users/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['bot_reachable'])
        self.assertEqual(response.data['users'], 1)
        self.assertFalse(response.data['mini_app_enabled'])
        owner = TelegramBotUser.objects.get(chat_id='912880272')
        self.assertEqual(owner.username, 'dmytro_owner')
        self.assertTrue(owner.is_notification_recipient)

    @patch('portfolio.views.send_telegram_message', return_value=(True, ''))
    @patch('portfolio.views.telegram_api_call')
    def test_local_setup_succeeds_without_https_domain(self, telegram_api, _send_message):
        telegram_api.side_effect = self.fake_api
        response = self.client.post('/api/telegram-users/setup/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['configured'])
        self.assertEqual(response.data['mode'], 'local')
        self.assertFalse(response.data['mini_app_configured'])
        self.assertTrue(TelegramBotUser.objects.get(chat_id='912880272').is_notification_recipient)
