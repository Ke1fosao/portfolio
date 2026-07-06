from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from portfolio.views import AdminTokenObtainPairView, AdminTokenRefreshView

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/token/', AdminTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', AdminTokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('portfolio.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
