from django.db import migrations, models


def map_old_statuses(apps, schema_editor):
    ContactLead = apps.get_model('portfolio', 'ContactLead')
    ContactLead.objects.filter(status='contacted').update(status='in_progress')
    ContactLead.objects.filter(status='closed').update(status='completed')


class Migration(migrations.Migration):
    dependencies = [('portfolio', '0003_aboutpage_final_kicker_aboutpage_journey_heading_and_more')]

    operations = [
        migrations.AddField(model_name='contactlead', name='email_notified_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name='contactlead', name='notification_errors', field=models.TextField(blank=True)),
        migrations.AddField(model_name='contactlead', name='request_fingerprint', field=models.CharField(blank=True, db_index=True, max_length=64)),
        migrations.AddField(model_name='contactlead', name='telegram_notified_at', field=models.DateTimeField(blank=True, null=True)),
        migrations.RunPython(map_old_statuses, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='contactlead',
            name='status',
            field=models.CharField(choices=[('new', 'Нова'), ('viewed', 'Переглянута'), ('in_progress', 'У роботі'), ('completed', 'Завершена')], default='new', max_length=20),
        ),
    ]
