from django.contrib import admin
from .models import (
    SiteSettings, Service, Project, Testimonial, PricingPlan, FAQ, BlogPost,
    ContactLead, TelegramBotUser, PageSection, MediaAsset, SeoMetadata,
    EditorDraft, Certificate, AboutPage, AdminProfile, ContentVersion,
    AdminActionLog, AdminBackup, AdminSecuritySettings,
)

admin.site.site_header = 'Dmytro Portfolio — резервна адмінка'
admin.site.site_title = 'Dmytro Portfolio'
admin.site.index_title = 'Керування контентом'


@admin.register(ContactLead)
class ContactLeadAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_method', 'contact_value', 'status', 'is_read', 'telegram_sent', 'email_sent', 'created_at')
    list_filter = ('status', 'is_read', 'contact_method', 'created_at')
    search_fields = ('name', 'contact_value', 'telegram', 'message', 'notes', 'internal_notes')
    readonly_fields = ('created_at', 'updated_at', 'viewed_at', 'telegram_notified_at', 'email_notified_at', 'notification_errors', 'request_fingerprint')
    list_editable = ('status',)
    date_hierarchy = 'created_at'

    @admin.display(boolean=True, description='Telegram')
    def telegram_sent(self, obj):
        return bool(obj.telegram_notified_at)

    @admin.display(boolean=True, description='Email')
    def email_sent(self, obj):
        return bool(obj.email_notified_at)


@admin.register(TelegramBotUser)
class TelegramBotUserAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'chat_id', 'is_notification_recipient', 'is_blocked', 'last_command', 'last_seen_at')
    list_filter = ('is_notification_recipient', 'is_blocked', 'last_seen_at')
    search_fields = ('chat_id', 'user_id', 'username', 'first_name', 'last_name')
    list_editable = ('is_notification_recipient', 'is_blocked')
    readonly_fields = ('created_at', 'updated_at', 'last_seen_at')


for model in [SiteSettings, Service, Project, Testimonial, PricingPlan, FAQ, BlogPost, Certificate, AboutPage]:
    admin.site.register(model)


for model in [PageSection, MediaAsset, SeoMetadata, EditorDraft]:
    admin.site.register(model)


for model in [AdminProfile, ContentVersion, AdminActionLog, AdminBackup, AdminSecuritySettings]:
    admin.site.register(model)
