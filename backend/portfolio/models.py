from django.conf import settings as django_settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class OrderedModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(
        django_settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ['order', 'id']


class SiteSettings(models.Model):
    full_name = models.CharField(max_length=160, default='Ковтунович Дмитро Валерійович')
    role = models.CharField(max_length=120, default='Full-stack developer')
    city = models.CharField(max_length=120, default='Рівне, Україна')
    age = models.PositiveIntegerField(default=18)
    years_experience = models.PositiveIntegerField(default=4)
    availability = models.CharField(max_length=160, default='Відкритий до нових проєктів')
    logo_text = models.CharField(max_length=40, default='DK.')
    hero_title = models.CharField(max_length=280)
    hero_subtitle = models.TextField()
    about_short = models.TextField()
    about_full = models.TextField()
    email = models.EmailField()
    phone = models.CharField(max_length=40)
    telegram = models.CharField(max_length=80)
    instagram = models.URLField(blank=True)
    github = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    facebook = models.URLField(blank=True)
    working_hours = models.CharField(max_length=80, default='Щодня, 10:00–22:00')
    resume_url = models.URLField(blank=True)
    socials = models.JSONField(default=dict, blank=True)
    currency_rates = models.JSONField(default=dict, blank=True)
    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return 'Налаштування сайту'


class Service(OrderedModel):
    title = models.CharField(max_length=160)
    slug = models.SlugField(unique=True, blank=True)
    summary = models.CharField(max_length=260)
    description = models.TextField()
    icon = models.CharField(max_length=40, default='sparkles')
    price_from_uah = models.PositiveIntegerField(default=5000)
    duration = models.CharField(max_length=120, blank=True)
    complexity = models.CharField(max_length=80, default='Стандартна')
    features = models.JSONField(default=list, blank=True)
    premium_note = models.CharField(max_length=240, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Project(OrderedModel):
    STATUS_CHOICES = [('published', 'Опубліковано'), ('draft', 'Чернетка'), ('concept', 'Концепт')]
    title = models.CharField(max_length=180)
    slug = models.SlugField(unique=True, blank=True)
    category = models.CharField(max_length=120)
    client = models.CharField(max_length=180, blank=True)
    summary = models.CharField(max_length=320)
    challenge = models.TextField()
    solution = models.TextField()
    result_text = models.TextField()
    live_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    duration = models.CharField(max_length=120, blank=True)
    technologies = models.JSONField(default=list, blank=True)
    features = models.JSONField(default=list, blank=True)
    metrics = models.JSONField(default=list, blank=True)
    cover_image_url = models.CharField(max_length=500, blank=True)
    cover_image = models.ImageField(upload_to='projects/covers/', blank=True, null=True)
    gallery = models.JSONField(default=list, blank=True)
    featured = models.BooleanField(default=False)
    ai_integration = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    is_verified_case = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Testimonial(OrderedModel):
    author = models.CharField(max_length=160)
    role = models.CharField(max_length=160, blank=True)
    company = models.CharField(max_length=160, blank=True)
    text = models.TextField()
    photo_url = models.CharField(max_length=500, blank=True)
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='testimonials')
    is_verified = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.author} — {self.company}'


class PricingPlan(OrderedModel):
    title = models.CharField(max_length=120)
    tagline = models.CharField(max_length=240)
    price_uah = models.PositiveIntegerField()
    duration = models.CharField(max_length=120, blank=True)
    features = models.JSONField(default=list, blank=True)
    highlighted = models.BooleanField(default=False)
    complexity_note = models.TextField(blank=True)

    def __str__(self):
        return self.title


class FAQ(OrderedModel):
    question = models.CharField(max_length=300)
    answer = models.TextField()
    category = models.CharField(max_length=120, default='Загальне')

    def __str__(self):
        return self.question


class BlogPost(models.Model):
    STATUS_CHOICES = [('draft', 'Чернетка'), ('scheduled', 'Заплановано'), ('published', 'Опубліковано')]
    title = models.CharField(max_length=220)
    slug = models.SlugField(unique=True, blank=True)
    excerpt = models.CharField(max_length=320)
    category = models.CharField(max_length=120, default='Практика')
    content = models.TextField()
    seo_title = models.CharField(max_length=220, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    is_featured = models.BooleanField(default=False)
    cover_image_url = models.CharField(max_length=500, blank=True)
    cover_image = models.ImageField(upload_to='blog/covers/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class ContactLead(models.Model):
    STATUS_CHOICES = [
        ('new', 'Нова'),
        ('viewed', 'Переглянута'),
        ('in_progress', 'У роботі'),
        ('waiting_client', 'Очікує відповіді клієнта'),
        ('completed', 'Завершена'),
        ('rejected', 'Відхилена'),
        ('spam', 'Спам'),
    ]
    METHOD_CHOICES = [('telegram', 'Telegram'), ('phone', 'Телефон'), ('email', 'Email')]
    name = models.CharField(max_length=160)
    contact_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    contact_value = models.CharField(max_length=180)
    message = models.TextField(blank=True)
    source = models.CharField(max_length=120, default='portfolio')
    service = models.CharField(max_length=160, blank=True)
    budget = models.CharField(max_length=120, blank=True)
    telegram = models.CharField(max_length=120, blank=True)
    page_url = models.CharField(max_length=500, blank=True)
    utm_source = models.CharField(max_length=160, blank=True)
    utm_medium = models.CharField(max_length=160, blank=True)
    utm_campaign = models.CharField(max_length=160, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    is_read = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    first_response_at = models.DateTimeField(null=True, blank=True)
    last_contact_at = models.DateTimeField(null=True, blank=True)
    next_action_at = models.DateTimeField(null=True, blank=True)
    internal_notes = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    telegram_notified_at = models.DateTimeField(null=True, blank=True)
    email_notified_at = models.DateTimeField(null=True, blank=True)
    notification_errors = models.TextField(blank=True)
    request_fingerprint = models.CharField(max_length=64, blank=True, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} — {self.get_contact_method_display()}'


class TelegramBotUser(models.Model):
    chat_id = models.CharField(max_length=64, unique=True)
    user_id = models.CharField(max_length=64, blank=True)
    username = models.CharField(max_length=120, blank=True)
    first_name = models.CharField(max_length=160, blank=True)
    last_name = models.CharField(max_length=160, blank=True)
    language_code = models.CharField(max_length=16, blank=True)
    is_notification_recipient = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    last_command = models.CharField(max_length=120, blank=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_notification_recipient', '-last_seen_at', 'username', 'first_name']

    @property
    def display_name(self):
        handle = f'@{self.username}' if self.username else ''
        full_name = ' '.join(part for part in [self.first_name, self.last_name] if part).strip()
        return handle or full_name or self.chat_id

    def __str__(self):
        return self.display_name


class PageSection(models.Model):
    PAGE_CHOICES = [
        ('home', 'Головна'),
        ('about', 'Про мене'),
        ('projects', 'Проєкти'),
        ('project_detail', 'Детальна сторінка проєкту'),
        ('services', 'Послуги'),
        ('pricing', 'Ціни'),
        ('blog', 'Блог'),
        ('blog_detail', 'Детальна сторінка статті'),
        ('contact', 'Контакти'),
    ]
    page = models.CharField(max_length=60, choices=PAGE_CHOICES, db_index=True)
    section_type = models.CharField(max_length=80)
    title = models.CharField(max_length=180)
    icon = models.CharField(max_length=40, default='layout')
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_system = models.BooleanField(default=False)
    settings = models.JSONField(default=dict, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page', 'order', 'id']
        unique_together = [('page', 'section_type')]

    def __str__(self):
        return f'{self.get_page_display()} · {self.title}'


class MediaAsset(models.Model):
    SAFE_CONTENT_TYPES = {
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    file = models.FileField(upload_to='media-library/%Y/%m/')
    thumbnail = models.ImageField(upload_to='media-library/thumbnails/%Y/%m/', blank=True, null=True)
    title = models.CharField(max_length=220)
    original_name = models.CharField(max_length=260, blank=True)
    alt_text = models.CharField(max_length=220, blank=True)
    description = models.TextField(blank=True)
    caption = models.CharField(max_length=260, blank=True)
    category = models.CharField(max_length=120, blank=True)
    mime_type = models.CharField(max_length=120, blank=True)
    size = models.PositiveIntegerField(default=0)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    uploaded_by = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title or self.original_name or str(self.file)


class SeoMetadata(models.Model):
    page_key = models.CharField(max_length=120, db_index=True)
    content_type = models.CharField(max_length=80, default='page')
    object_id = models.CharField(max_length=80, blank=True)
    path = models.CharField(max_length=260, blank=True)
    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.TextField(blank=True)
    slug = models.SlugField(max_length=180, blank=True, allow_unicode=True)
    canonical_url = models.CharField(max_length=300, blank=True)
    og_title = models.CharField(max_length=180, blank=True)
    og_description = models.TextField(blank=True)
    og_image = models.ForeignKey(MediaAsset, on_delete=models.SET_NULL, null=True, blank=True, related_name='og_entries')
    og_image_url = models.CharField(max_length=500, blank=True)
    index = models.BooleanField(default=True)
    follow = models.BooleanField(default=True)
    focus_keyword = models.CharField(max_length=160, blank=True)
    structured_data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page_key']
        unique_together = [('content_type', 'page_key', 'object_id')]

    def __str__(self):
        return self.page_key


class EditorDraft(models.Model):
    entity_type = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=80, blank=True)
    page_key = models.CharField(max_length=120, blank=True)
    user = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    payload = models.JSONField(default=dict, blank=True)
    server_updated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = [('entity_type', 'entity_id', 'page_key', 'user')]

    def __str__(self):
        return f'{self.entity_type}:{self.entity_id or self.page_key}'


class AdminProfile(models.Model):
    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_EDITOR = 'editor'
    ROLE_LEAD_MANAGER = 'lead_manager'
    ROLE_ANALYTICS = 'analytics'
    ROLE_CHOICES = [
        (ROLE_OWNER, 'Owner'),
        (ROLE_ADMIN, 'Administrator'),
        (ROLE_EDITOR, 'Editor'),
        (ROLE_LEAD_MANAGER, 'Lead manager'),
        (ROLE_ANALYTICS, 'Analytics viewer'),
    ]
    user = models.OneToOneField(django_settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='portfolio_admin_profile')
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default=ROLE_ADMIN, db_index=True)
    totp_secret_encrypted = models.TextField(blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    backup_codes_hashes = models.JSONField(default=list, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    last_login_ip_hash = models.CharField(max_length=64, blank=True)
    locked_until = models.DateTimeField(null=True, blank=True)
    failed_login_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user} ({self.role})'


class ContentVersion(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('publish', 'Publish'),
        ('restore', 'Restore'),
        ('delete', 'Delete'),
        ('reorder', 'Reorder'),
        ('backup', 'Backup'),
    ]
    entity_type = models.CharField(max_length=80, db_index=True)
    entity_id = models.CharField(max_length=80, db_index=True)
    version_number = models.PositiveIntegerField(default=1)
    snapshot = models.JSONField(default=dict, blank=True)
    author = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=40, choices=ACTION_CHOICES, default='update', db_index=True)
    description = models.CharField(max_length=260, blank=True)
    previous_version = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    changed_fields = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=40, default='saved', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id', '-created_at']),
            models.Index(fields=['entity_type', 'entity_id', 'version_number']),
        ]

    def __str__(self):
        return f'{self.entity_type}:{self.entity_id} v{self.version_number}'


class AdminActionLog(models.Model):
    RESULT_CHOICES = [('success', 'Success'), ('failed', 'Failed'), ('blocked', 'Blocked')]
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=80, db_index=True)
    entity_type = models.CharField(max_length=80, blank=True, db_index=True)
    entity_id = models.CharField(max_length=80, blank=True)
    description = models.CharField(max_length=320, blank=True)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='success', db_index=True)
    ip_hash = models.CharField(max_length=64, blank=True)
    user_agent = models.CharField(max_length=220, blank=True)
    request_id = models.CharField(max_length=80, blank=True, db_index=True)
    changed_fields = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at', 'action']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['result', '-created_at']),
        ]

    def __str__(self):
        return f'{self.created_at:%Y-%m-%d %H:%M} {self.action}'


class AdminBackup(models.Model):
    STATUS_CHOICES = [('running', 'Running'), ('success', 'Success'), ('failed', 'Failed'), ('deleted', 'Deleted')]
    TYPE_CHOICES = [('manual', 'Manual'), ('scheduled', 'Scheduled'), ('pre_restore', 'Pre-restore')]
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    created_by = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    backup_type = models.CharField(max_length=24, choices=TYPE_CHOICES, default='manual', db_index=True)
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default='running', db_index=True)
    file_path = models.CharField(max_length=500, blank=True)
    file_name = models.CharField(max_length=220, blank=True)
    size = models.PositiveBigIntegerField(default=0)
    checksum_sha256 = models.CharField(max_length=64, blank=True)
    includes_database = models.BooleanField(default=True)
    includes_media = models.BooleanField(default=True)
    error = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    restored_at = models.DateTimeField(null=True, blank=True)
    restored_by = models.ForeignKey(django_settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.file_name or f'Backup #{self.pk}'


class AdminSecuritySettings(models.Model):
    auto_backup_frequency = models.CharField(max_length=20, default='off')
    backup_retention_days = models.PositiveIntegerField(default=30)
    max_backup_count = models.PositiveIntegerField(default=20)
    trash_retention_days = models.PositiveIntegerField(default=30)
    auto_trash_cleanup_enabled = models.BooleanField(default=False)
    login_lockout_attempts = models.PositiveIntegerField(default=5)
    login_lockout_minutes = models.PositiveIntegerField(default=15)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'Admin security settings'


class Certificate(OrderedModel):
    title = models.CharField(max_length=220)
    issuer = models.CharField(max_length=180, blank=True)
    description = models.TextField(blank=True)
    file_url = models.CharField(max_length=500, blank=True)
    expected_date = models.DateField(null=True, blank=True)
    is_ready = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class AboutPage(models.Model):
    hero_kicker = models.CharField(max_length=180, default='Моя історія · Full-stack developer')
    hero_title = models.CharField(max_length=320, default='Чотири роки тому — лише мрія. Сьогодні — продукти для реального бізнесу.')
    hero_text = models.TextField(default='Я Дмитро, мені 18. Самостійно створюю сучасні сайти, вебсистеми та AI-інтеграції — від першої ідеї до запуску й подальшого розвитку.')
    hero_photo = models.ImageField(upload_to='about/portrait/', blank=True, null=True)
    hero_photo_original = models.ImageField(upload_to='about/portrait/originals/', blank=True, null=True)
    hero_photo_crop = models.JSONField(default=dict, blank=True)
    hero_photo_alt = models.CharField(max_length=220, default='Портрет Дмитра Ковтуновича')
    story_title = models.CharField(max_length=320, default='Я не прокинувся програмістом за одну ніч. Я поступово ним став.')
    story_text = models.TextField(default='Мій шлях почався з мрії стати програмістом і перших невеликих програм. Чотири роки навчання перетворили окремі знання на вміння створювати повноцінні цифрові продукти.')
    story_support_text = models.TextField(default='Мій головний принцип простий: продукт має не лише красиво виглядати, а й вирішувати конкретну задачу — приносити заявки, структурувати дані, економити час або автоматизувати рутинний процес.')
    journey_heading = models.CharField(max_length=320, default='Від першого рядка коду до продукту, яким користується бізнес.')
    journey_intro = models.TextField(default='Не ідеальна пряма лінія, а послідовність складних задач, помилок, рішень і відчутного прогресу.')
    journey = models.JSONField(default=list, blank=True)
    stats = models.JSONField(default=list, blank=True)
    babyland_title = models.CharField(max_length=320, default='Диплом був фіналом навчання. BABY LAND став початком професійної роботи.')
    babyland_text = models.TextField(default='За два тижні я самостійно створив повноцінний продукт для приватного дитячого садка: дизайн, frontend, backend, базу даних, форми та кастомну адмінпанель.')
    project_facts = models.JSONField(default=list, blank=True)
    ai_title = models.CharField(max_length=320, default='Я не зупиняюся на звичайній веброзробці.')
    ai_text = models.TextField(default='Наступна ціль — системи, які не просто показують інформацію, а самі виконують частину роботи бізнесу.')
    ai_items = models.JSONField(default=list, blank=True)
    principles_title = models.CharField(max_length=320, default='Дизайн привертає увагу. Система утримує цінність.')
    principles = models.JSONField(default=list, blank=True)
    education_title = models.CharField(max_length=320, default='Диплом на відмінно — не фінальна точка, а підтвердження фундаменту.')
    education_text = models.TextField(default='Чотири роки навчання дали мені базу, а реальні проєкти навчили відповідати за результат.')
    college_name = models.CharField(max_length=260, default='ВСП «Рівненський фаховий коледж НУБіП України»')
    diploma_title = models.CharField(max_length=220, default='Захищено на відмінно')
    diploma_description = models.TextField(default='Диплом підтверджує фундамент, на якому я продовжую будувати реальні продукти.')
    diploma_file = models.FileField(upload_to='about/documents/', blank=True, null=True)
    resume_file = models.FileField(upload_to='about/documents/', blank=True, null=True)
    final_kicker = models.CharField(max_length=180, default='Зараз я відкритий до нових проєктів')
    final_title = models.CharField(max_length=320, default='Мені 18. Я вже створюю продукти. І це лише початок.')
    final_text = models.TextField(default='Потрібен сучасний сайт, продумана вебсистема або автоматизація процесів? Розкажіть про задачу — я запропоную реалістичний шлях від ідеї до запуску.')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return 'Сторінка «Про мене»'
