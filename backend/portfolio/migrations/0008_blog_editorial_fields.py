from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('portfolio', '0007_adminsecuritysettings_blogpost_deleted_at_and_more')]

    operations = [
        migrations.AddField(model_name='blogpost', name='category', field=models.CharField(default='Практика', max_length=120)),
        migrations.AddField(model_name='blogpost', name='is_featured', field=models.BooleanField(default=False)),
        migrations.AddField(model_name='blogpost', name='seo_description', field=models.CharField(blank=True, max_length=320)),
        migrations.AddField(model_name='blogpost', name='seo_title', field=models.CharField(blank=True, max_length=220)),
        migrations.AlterField(model_name='blogpost', name='status', field=models.CharField(choices=[('draft', 'Чернетка'), ('scheduled', 'Заплановано'), ('published', 'Опубліковано')], default='draft', max_length=20)),
    ]
