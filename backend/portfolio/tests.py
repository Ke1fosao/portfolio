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
