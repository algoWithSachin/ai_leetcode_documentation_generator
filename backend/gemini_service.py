"""
Gemini AI Service for LeetCode Documentation Generator.
Handles all interactions with the Google Gemini 2.5 API.
"""
import json
import re
import os
import google.generativeai as genai
from django.conf import settings


def get_gemini_client():
    """Initialize and return the Gemini client."""
    api_key = settings.GEMINI_API_KEY or os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not set. Please add it to your .env file."
        )
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-flash')


def analyze_code(code: str, url: str = '', language: str = 'auto') -> dict:
    """
    Analyze LeetCode solution code using Gemini AI.

    Args:
        code: The source code to analyze
        url: Optional LeetCode problem URL
        language: Programming language (auto/cpp/python/java/javascript)

    Returns:
        Dictionary with problem analysis results
    """
    model = get_gemini_client()

    url_context = ""
    if url and url.strip():
        url_context = f"\nProblem URL: {url.strip()}"
        # Try to extract problem info from URL
        # e.g. https://leetcode.com/problems/two-sum/
        match = re.search(r'/problems/([^/]+)', url)
        if match:
            slug = match.group(1).replace('-', ' ').title()
            url_context += f"\nProblem slug from URL: {slug}"

    lang_context = ""
    if language and language.lower() not in ('auto', 'autodetect', ''):
        lang_context = f"\nSpecified language: {language}"

    prompt = f"""You are an expert competitive programmer and documentation specialist.
Analyze the following LeetCode solution code and extract structured information.

{url_context}
{lang_context}

Code to analyze:
```
{code}
```

Your task:
1. Identify the LeetCode problem number (look for comments, variable names, or infer from the algorithm; if URL is provided use it).
2. Identify the exact problem name (e.g., "Two Sum", "Longest Substring Without Repeating Characters").
3. Detect the programming language if not specified.
4. Assess the difficulty: Easy, Medium, or Hard.
5. List the algorithmic approach steps (be specific and technical, 2-5 bullet points).
6. Calculate the time complexity in Big-O notation.
7. Calculate the space complexity in Big-O notation.

CRITICAL: Respond with ONLY valid JSON. No markdown, no backticks, no explanation. Exactly this structure:
{{
  "problem_number": "1",
  "problem_name": "Two Sum",
  "language": "cpp",
  "difficulty": "Easy",
  "approach": [
    "Use a hash map to store each element and its index",
    "For each element, check if its complement exists in the map",
    "Return indices when complement is found"
  ],
  "time_complexity": "O(n)",
  "space_complexity": "O(n)"
}}

Rules:
- problem_number: just the number as string (e.g., "1"), or "Unknown" if can't determine
- problem_name: the problem title (e.g., "Two Sum"), or "Unknown" if can't determine
- language: lowercase (cpp, python, java, javascript, c, go, rust, etc.)
- difficulty: exactly "Easy", "Medium", or "Hard"
- approach: array of 2-5 specific, technical strings describing the algorithm
- time_complexity: Big-O notation string
- space_complexity: Big-O notation string
"""

    response = model.generate_content(prompt)
    response_text = response.text.strip()

    # Strip markdown code fences if present
    response_text = re.sub(r'^```(?:json)?\s*', '', response_text, flags=re.MULTILINE)
    response_text = re.sub(r'\s*```$', '', response_text, flags=re.MULTILINE)
    response_text = response_text.strip()

    try:
        data = json.loads(response_text)
    except json.JSONDecodeError:
        # Attempt to extract JSON object from the response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            data = json.loads(json_match.group())
        else:
            raise ValueError(f"Gemini returned invalid JSON: {response_text[:300]}")

    # Normalize and validate fields
    data['problem_number'] = str(data.get('problem_number', 'Unknown')).strip()
    data['problem_name'] = str(data.get('problem_name', 'Unknown')).strip()
    data['language'] = str(data.get('language', 'unknown')).strip().lower()
    data['difficulty'] = str(data.get('difficulty', 'Unknown')).strip()
    data['approach'] = data.get('approach', [])
    if not isinstance(data['approach'], list):
        data['approach'] = [str(data['approach'])]
    data['time_complexity'] = str(data.get('time_complexity', 'Unknown')).strip()
    data['space_complexity'] = str(data.get('space_complexity', 'Unknown')).strip()

    return data


COMMENT_STYLES = {
    'cpp':        ('/*', ' * ', ' */'),
    'java':       ('/*', ' * ', ' */'),
    'javascript': ('/*', ' * ', ' */'),
    'python':     ('"""', '',    '"""'),
    'c':          ('/*', ' * ', ' */'),
    'go':         ('/*', ' * ', ' */'),
    'rust':       ('/*', ' * ', ' */'),
}

def format_documentation(analysis: dict, code: str) -> str:
    language = analysis.get('language', 'unknown').lower()
    open_c, line_c, close_c = COMMENT_STYLES.get(language, ('/*', ' * ', ' */'))

    problem_num  = analysis.get('problem_number', 'Unknown')
    problem_name = analysis.get('problem_name', 'Unknown')
    difficulty   = analysis.get('difficulty', 'Unknown')
    approach     = analysis.get('approach', [])
    time_c       = analysis.get('time_complexity', 'Unknown')
    space_c      = analysis.get('space_complexity', 'Unknown')

    label = f"#{problem_num} {problem_name}" if problem_num != 'Unknown' else problem_name

    approach_lines = '\n'.join(f'{line_c}  • {step}' for step in approach)

    if language == 'python':
        doc = f'''\"\"\"\nProblem:          {label}\nPlatform:         LeetCode\nDifficulty:       {difficulty}\n\nApproach:\n{approach_lines}\n\nTime Complexity:  {time_c}\nSpace Complexity: {space_c}\n\"\"\"'''
    else:
        doc = f'''{open_c}\n{line_c} Problem:          {label}\n{line_c} Platform:         LeetCode\n{line_c} Difficulty:       {difficulty}\n{line_c}\n{line_c} Approach:\n{approach_lines}\n{line_c}\n{line_c} Time Complexity:  {time_c}\n{line_c} Space Complexity: {space_c}\n{close_c}'''

    lang_tag = language if language != 'unknown' else ''
    return f"{doc}\n\n{code.strip()}"