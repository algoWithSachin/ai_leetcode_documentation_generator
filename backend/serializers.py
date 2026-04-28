from rest_framework import serializers


class GenerateRequestSerializer(serializers.Serializer):
    code = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            'required': 'Code is required.',
            'blank': 'Code cannot be empty.',
        }
    )
    url = serializers.CharField(required=False, allow_blank=True, default='')
    language = serializers.ChoiceField(
        choices=['auto', 'cpp', 'python', 'java', 'javascript'],
        required=False,
        default='auto'
    )

    def validate_code(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Code is too short to analyze.")
        if len(value) > 50000:
            raise serializers.ValidationError("Code is too long (max 50,000 characters).")
        return value.strip()


class GenerateResponseSerializer(serializers.Serializer):
    formatted_output = serializers.CharField()
    problem = serializers.CharField()
    difficulty = serializers.CharField()
    approach = serializers.ListField(child=serializers.CharField())
    time_complexity = serializers.CharField()
    space_complexity = serializers.CharField()
    language = serializers.CharField()
