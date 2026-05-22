from .base import *
from dotenv import load_dotenv
import os
load_dotenv()


SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

DEBUG = False

ALLOWED_HOSTS = ["https://leetcode-ai-197h.onrender.com"]