from .base import *
from dotenv import load_dotenv
import os
load_dotenv()


SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "default secret key")

DEBUG = True

ALLOWED_HOSTS = ['*']