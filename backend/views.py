"""
DRF Views for LeetCode AI Documentation Generator.
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import GenerateRequestSerializer, GenerateResponseSerializer
from .gemini_service import analyze_code, format_documentation

logger = logging.getLogger(__name__)


class GenerateDocumentationView(APIView):
    """
    POST /api/generate/
    
    Accepts LeetCode solution code and returns structured AI-generated documentation.
    """

    def post(self, request, *args, **kwargs):
        # Validate input
        serializer = GenerateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'Invalid input.',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        code = serializer.validated_data['code']
        url = serializer.validated_data.get('url', '')
        language = serializer.validated_data.get('language', 'auto')

        try:
            # Call Gemini AI
            analysis = analyze_code(code=code, url=url, language=language)

            # Format documentation
            formatted_output = format_documentation(analysis=analysis, code=code)

            # Build response
            problem_num = analysis.get('problem_number', 'Unknown')
            problem_name = analysis.get('problem_name', 'Unknown')
            if problem_num and problem_num != 'Unknown':
                problem_label = f"#{problem_num} {problem_name}"
            else:
                problem_label = problem_name

            response_data = {
                'formatted_output': formatted_output,
                'problem': problem_label,
                'difficulty': analysis.get('difficulty', 'Unknown'),
                'approach': analysis.get('approach', []),
                'time_complexity': analysis.get('time_complexity', 'Unknown'),
                'space_complexity': analysis.get('space_complexity', 'Unknown'),
                'language': analysis.get('language', 'unknown'),
            }

            response_serializer = GenerateResponseSerializer(data=response_data)
            if response_serializer.is_valid():
                return Response(response_serializer.validated_data, status=status.HTTP_200_OK)
            else:
                return Response(response_data, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.error(f"Validation error in generate view: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in generate view: {e}", exc_info=True)
            error_msg = str(e)
            if 'API_KEY' in error_msg.upper() or 'api key' in error_msg.lower():
                return Response(
                    {'error': 'Gemini API key is missing or invalid. Please check your .env file.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            return Response(
                {'error': f'AI analysis failed: {error_msg}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HealthCheckView(APIView):
    """GET /api/health/ - Simple health check endpoint."""

    def get(self, request, *args, **kwargs):
        from django.conf import settings
        has_key = bool(settings.GEMINI_API_KEY)
        return Response({
            'status': 'ok',
            'gemini_configured': has_key,
            'message': 'Gemini API key is set.' if has_key else 'WARNING: GEMINI_API_KEY is not set!'
        })
