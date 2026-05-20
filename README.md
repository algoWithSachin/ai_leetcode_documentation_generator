# LeetCode AI Documentation Generator

A production-ready Django application that uses Google Gemini 2.5 to generate
structured, professional documentation for your LeetCode solutions.

---

## 🚀 Quick Start

### 1. Clone / place the project

```bash
cd leetcode_ai
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and set your Gemini API key:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

Get a free API key at: https://aistudio.google.com/app/apikey

### 5. Run migrations

```bash
python manage.py migrate
```

### 6. Collect static files (optional for dev)

```bash
python manage.py collectstatic --noinput
```

### 7. Start the development server

```bash
python manage.py runserver
```

Open your browser at: **http://127.0.0.1:8000**

---

## 📁 Project Structure

```
leetcode_ai/
├── manage.py
├── requirements.txt
├── .env.example
├── .env                        ← create this (gitignored)
│
├── leetcode_ai/                ← Django project package
│   ├── __init__.py
│   ├── settings/
│       ├── dev.py
│       ├── prod.py
│       ├── base.py
│   ├── urls.py
│   └── wsgi.py
│
├── backend/                    ← DRF API app
│   ├── __init__.py
│   ├── apps.py
│   ├── urls.py
│   ├── views.py
│   ├── serializers.py
│   └── gemini_service.py       ← Gemini 2.5 integration
│
└── frontend/                   ← UI app
    ├── __init__.py
    ├── apps.py
    ├── views.py
    ├── urls.py
    ├── templates/
    │   └── index.html
    └── static/
        ├── style.css
        └── app.js
```

---

## 🔌 API Reference

### `POST /api/generate/`

**Request body:**
```json
{
  "code":     "your solution code here",
  "url":      "https://leetcode.com/problems/two-sum/",   // optional
  "language": "cpp"   // auto | cpp | python | java | javascript
}
```

**Success response (200):**
```json
{
  "formatted_output": "\"\"\"...\"\"\"\n\n```cpp\n...\n```",
  "problem":          "#1 Two Sum",
  "difficulty":       "Easy",
  "approach":         ["Use hash map", "Store complements"],
  "time_complexity":  "O(n)",
  "space_complexity": "O(n)",
  "language":         "cpp"
}
```

### `GET /api/health/`

Returns API health and whether Gemini is configured.

---

## ✨ Features

- **AI-powered analysis** — Gemini 2.5 detects problem, difficulty, approach, complexities
- **Auto language detection** — no need to specify if code is clear
- **Exact doc format** — `Problem / Platform / Difficulty / Approach / Complexity`
- **Copy to clipboard** — one click
- **Download as .md** — save your documentation
- **Syntax highlighted output** — beautiful code rendering
- **Line numbers** — real editor feel in textarea
- **Ctrl+Enter** shortcut — generate without mouse

---
