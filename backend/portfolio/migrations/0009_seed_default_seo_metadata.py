from django.db import migrations


def seed_default_seo(apps, schema_editor):
    SeoMetadata = apps.get_model('portfolio', 'SeoMetadata')
    defaults = [
        ('home', '/', 'Головна', 'Full-stack developer: сайти, вебсистеми та AI', 'Розробка сучасних сайтів, вебсистем та AI-автоматизації для бізнесу в Рівному та по Україні.', 'розробка сайтів Рівне', '/assets/og-image.png'),
        ('about', '/about', 'Про мене', 'Про Дмитра Ковтуновича — Full-stack developer', 'Дмитро Ковтунович — full-stack developer із Рівного. Python, Django, React, бази даних та AI-інтеграції.', 'full-stack developer Рівне', '/assets/og-image.png'),
        ('projects', '/projects', 'Проєкти', 'Роботи та кейси з веброзробки', 'Портфоліо Дмитра Ковтуновича: сайти, вебсистеми, кастомні адмінпанелі та AI-рішення для бізнесу.', 'портфоліо веброзробника', '/assets/og-image.png'),
        ('services', '/services', 'Послуги', 'Послуги з веброзробки та AI-автоматизації', 'Сайти для бізнесу, вебсистеми, особисті кабінети, інтернет-магазини та AI-автоматизація під конкретні задачі.', 'послуги веброзробки', '/assets/og-image.png'),
        ('pricing', '/pricing', 'Ціни', 'Вартість розробки сайтів і вебсистем', 'Орієнтовна вартість сайтів, вебсистем і AI-рішень. Прозорий склад робіт та індивідуальна оцінка проєкту.', 'ціна розробки сайту', '/assets/og-image.png'),
        ('blog', '/blog', 'Блог', 'Блог про сайти, автоматизацію та AI', 'Практичні матеріали про веброзробку, автоматизацію бізнесу, заявки, AI та створення цифрових продуктів.', 'блог про веброзробку', '/assets/blog-automation.svg'),
        ('contact', '/contact', 'Контакти', 'Контакти веброзробника Дмитра Ковтуновича', 'Зв’яжіться з Дмитром Ковтуновичем у Telegram, телефоном або email та залиште заявку на розробку сайту чи вебсистеми.', 'веброзробник контакти', '/assets/og-image.png'),
        ('work-terms', '/work-terms', 'Умови роботи', 'Умови роботи над сайтом або вебсистемою', 'Як проходить старт розробки, передоплата, правки, передача проєкту, підтримка та погодження результату.', 'умови розробки сайту', '/assets/og-image.png'),
        ('privacy', '/privacy', 'Конфіденційність', 'Політика конфіденційності сайту', 'Правила збору, використання, зберігання та захисту персональних даних користувачів сайту портфоліо.', 'політика конфіденційності', '/assets/og-image.png'),
        ('terms', '/terms', 'Умови використання', 'Умови використання сайту', 'Правила користування сайтом, надсилання заявок, авторські права та обмеження відповідальності.', 'умови використання сайту', '/assets/og-image.png'),
    ]
    for page_key, path, label, title, description, keyword, image in defaults:
        record, created = SeoMetadata.objects.get_or_create(
            page_key=page_key,
            content_type='page',
            object_id='',
            defaults={
                'path': path,
                'seo_title': title,
                'seo_description': description,
                'slug': page_key,
                'canonical_url': path,
                'og_title': title,
                'og_description': description,
                'og_image_url': image,
                'focus_keyword': keyword,
                'index': True,
                'follow': True,
            },
        )
        if not created:
            changed = []
            if not record.seo_title or record.seo_title == label:
                record.seo_title = title
                changed.append('seo_title')
            values = {
                'path': path,
                'seo_description': description,
                'slug': page_key,
                'canonical_url': path,
                'og_title': title,
                'og_description': description,
                'og_image_url': image,
                'focus_keyword': keyword,
            }
            for field, value in values.items():
                if not getattr(record, field):
                    setattr(record, field, value)
                    changed.append(field)
            if changed:
                record.save(update_fields=changed)


def reverse_seed(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [('portfolio', '0008_blog_editorial_fields')]
    operations = [migrations.RunPython(seed_default_seo, reverse_seed)]
