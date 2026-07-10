import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from urllib.parse import parse_qsl

from django.conf import settings

from .notifications import allowed_telegram_chat_ids


class TelegramWebAppAuthError(ValueError):
    pass


@dataclass(frozen=True)
class TelegramWebAppSession:
    user: dict
    auth_date: int
    query_id: str
    raw: dict

    @property
    def user_id(self) -> str:
        return str(self.user.get('id') or '')


def validate_telegram_init_data(init_data: str) -> TelegramWebAppSession:
    token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '').strip()
    if not token:
        raise TelegramWebAppAuthError('Telegram bot token is not configured.')
    if not init_data:
        raise TelegramWebAppAuthError('Telegram initData is missing.')

    values = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = values.pop('hash', '')
    if not received_hash:
        raise TelegramWebAppAuthError('Telegram signature is missing.')

    data_check_string = '\n'.join(f'{key}={values[key]}' for key in sorted(values))
    secret_key = hmac.new(b'WebAppData', token.encode('utf-8'), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode('utf-8'), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calculated_hash, received_hash):
        raise TelegramWebAppAuthError('Telegram signature is invalid.')

    try:
        auth_date = int(values.get('auth_date') or 0)
    except (TypeError, ValueError):
        raise TelegramWebAppAuthError('Telegram auth_date is invalid.')

    max_age = int(getattr(settings, 'TELEGRAM_INIT_DATA_MAX_AGE', 3600))
    now = int(time.time())
    if auth_date <= 0 or now - auth_date > max_age or auth_date > now + 60:
        raise TelegramWebAppAuthError('Telegram session has expired.')

    try:
        user = json.loads(values.get('user') or '{}')
    except json.JSONDecodeError:
        raise TelegramWebAppAuthError('Telegram user payload is invalid.')
    user_id = str(user.get('id') or '')
    if not user_id:
        raise TelegramWebAppAuthError('Telegram user ID is missing.')

    allowed_ids = allowed_telegram_chat_ids()
    if not allowed_ids:
        raise TelegramWebAppAuthError('No owner ID is configured for the Telegram Mini App.')
    if user_id not in allowed_ids:
        raise TelegramWebAppAuthError('This Telegram account is not allowed.')

    return TelegramWebAppSession(
        user=user,
        auth_date=auth_date,
        query_id=values.get('query_id', ''),
        raw=values,
    )
