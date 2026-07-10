from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0010_aboutpage_original_photo_crop'),
    ]

    operations = [
        migrations.CreateModel(
            name='NotificationDelivery',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('channel', models.CharField(choices=[('telegram', 'Telegram'), ('email', 'Email')], max_length=20)),
                ('event', models.CharField(default='lead_created', max_length=60)),
                ('recipient', models.CharField(blank=True, max_length=180)),
                ('status', models.CharField(choices=[('pending', 'Очікує'), ('sent', 'Надіслано'), ('failed', 'Помилка')], default='pending', max_length=20)),
                ('message_preview', models.CharField(blank=True, max_length=280)),
                ('error', models.TextField(blank=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('lead', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='notification_deliveries', to='portfolio.contactlead')),
            ],
            options={
                'ordering': ['-created_at', '-id'],
            },
        ),
        migrations.AddIndex(
            model_name='notificationdelivery',
            index=models.Index(fields=['channel', 'status', '-created_at'], name='notify_channel_status_idx'),
        ),
    ]
