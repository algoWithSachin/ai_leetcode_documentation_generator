from django.urls import path
from .views import GenerateDocumentationView, HealthCheckView

urlpatterns = [
    path('generate/', GenerateDocumentationView.as_view(), name='generate-documentation'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
]
