import os
from django.core.wsgi import get_wsgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'leetcode_ai.settings.prod')
application = get_wsgi_application()
