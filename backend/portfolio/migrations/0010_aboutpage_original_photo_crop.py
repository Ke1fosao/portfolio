from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0009_seed_default_seo_metadata'),
    ]

    operations = [
        migrations.AddField(
            model_name='aboutpage',
            name='hero_photo_crop',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='aboutpage',
            name='hero_photo_original',
            field=models.ImageField(blank=True, null=True, upload_to='about/portrait/originals/'),
        ),
    ]
