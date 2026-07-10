from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    SiteSettingsViewSet, ServiceViewSet, ProjectViewSet, TestimonialViewSet,
    PricingPlanViewSet, FAQViewSet, BlogPostViewSet, ContactLeadViewSet,
    TelegramBotUserViewSet, PageSectionViewSet, MediaAssetViewSet,
    SeoMetadataViewSet, EditorDraftViewSet, CertificateViewSet, AboutPageViewSet,
    ContentVersionViewSet, TrashViewSet, AnalyticsViewSet, AdminBackupViewSet,
    AdminActionLogViewSet, AdminSecurityViewSet,
    search, editor_preview, dashboard_stats,
    telegram_mini_app_bootstrap, telegram_mini_app_leads, telegram_mini_app_lead_detail,
)

router = DefaultRouter()
router.register('settings', SiteSettingsViewSet, basename='settings')
router.register('services', ServiceViewSet)
router.register('projects', ProjectViewSet)
router.register('testimonials', TestimonialViewSet)
router.register('pricing', PricingPlanViewSet)
router.register('faqs', FAQViewSet)
router.register('posts', BlogPostViewSet)
router.register('leads', ContactLeadViewSet)
router.register('telegram-users', TelegramBotUserViewSet)
router.register('page-sections', PageSectionViewSet)
router.register('media-assets', MediaAssetViewSet)
router.register('seo-metadata', SeoMetadataViewSet)
router.register('editor-drafts', EditorDraftViewSet)
router.register('certificates', CertificateViewSet)
router.register('about-page', AboutPageViewSet, basename='about-page')
router.register('versions', ContentVersionViewSet)
router.register('trash', TrashViewSet, basename='trash')
router.register('analytics', AnalyticsViewSet, basename='analytics')
router.register('backups', AdminBackupViewSet)
router.register('audit-log', AdminActionLogViewSet, basename='audit-log')
router.register('security', AdminSecurityViewSet, basename='security')

urlpatterns = [
    path('', include(router.urls)),
    path('search/', search, name='search'),
    path('editor-preview/', editor_preview, name='editor-preview'),
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
    path('telegram-mini-app/bootstrap/', telegram_mini_app_bootstrap, name='telegram-mini-app-bootstrap'),
    path('telegram-mini-app/leads/', telegram_mini_app_leads, name='telegram-mini-app-leads'),
    path('telegram-mini-app/leads/<int:pk>/', telegram_mini_app_lead_detail, name='telegram-mini-app-lead-detail'),
]
