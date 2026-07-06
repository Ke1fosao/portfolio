from django.core.management.base import BaseCommand

from portfolio.services.admin_system import create_backup


class Command(BaseCommand):
    help = 'Create a portfolio database and media backup without including secrets.'

    def add_arguments(self, parser):
        parser.add_argument('--type', default='scheduled', choices=['manual', 'scheduled', 'pre_restore'])

    def handle(self, *args, **options):
        backup = create_backup(user=None, backup_type=options['type'])
        if backup.status != 'success':
            self.stderr.write(self.style.ERROR(f'Backup failed: {backup.error}'))
            raise SystemExit(1)
        self.stdout.write(self.style.SUCCESS(f'Backup created: {backup.file_path}'))
