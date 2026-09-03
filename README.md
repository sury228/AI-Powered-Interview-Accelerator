#  AI-Powered Interview Accelerator

An intelligent, full-stack interview preparation platform inspired by [StudentCredibility.com](https://studentcredibility.com). It bridges the gap for candidates who are **"under-evidenced, not underqualified"** by analyzing job descriptions against resumes, identifying skill gaps, conducting realistic 3-level adaptive voice & video interviews, and delivering comprehensive, actionable feedback.

---

##  Features

-  Job Description Analysis**: Extracts core responsibilities, required & preferred skills, technical competencies, behavioural expectations, and crucial keywords.
-  Candidate Profile & Fit Scoring**: Cross-references resume evidence against the JD to calculate a Job Fit score and break down matches into Strong, Partial, and Missing skills.
-  3-Level Adaptive Interview**:
  1. **Level 1 — Screening**: Verifies resume background, motivation, role alignment, and core understanding.
  2. **Level 2 — Competency**: Tests technical depth, problem-solving, and practical application with STAR framework behavioral inquiries.
  3. **Level 3 — Deep-Dive**: Probes weak or ambiguous answers, challenges claims, and presents realistic scenarios with progressive difficulty.
-  Browser-Native Voice & Video**:
  - Speech-to-Text with live transcription (Web Speech API).
  - Natural Text-to-Speech question delivery.
  - Video preview with camera feed.
  - Metrics tracking: response time, words per minute (WPM), and filler word detection.
-  Actionable Performance Evaluation**:
  - Detailed score breakdown across 7 competencies (Role Fit, Technical Knowledge, Problem Solving, Communication, Confidence, Depth, Behavioural Fit).
  - Interactive competency radar/spider chart.
  - Question-by-question critique (What Was Good, Could Be Better, Ideal Direction).
  - Priority-ranked preparation plan and study topics.
  - Print & PDF-optimized report export.

---

##  Tech Stack

- **Backend**: Python 3 + [FastAPI](https://fastapi.tiangolo.com/) + Uvicorn
- **LLM Engine**: [Google Gemini API](https://aistudio.google.com/apikey) (`gemini-2.0-flash`)
- **Document Parsers**: PyPDF2, python-docx
- **Frontend**: Vanilla JavaScript SPA, HTML5, Vanilla CSS
- **Design System**: Glassmorphism dark mode with responsive layouts and micro-animations

---

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Gemini API Key
Obtain a free API key from [Google AI Studio](https://aistudio.google.com/apikey).

Option A: Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Option B: Enter your key directly in the web UI when prompted.

### 3. Start the Server
```bash
python main.py
```

### 4. Open in Browser
Visit [http://localhost:8000](http://localhost:8000) (Google Chrome or Microsoft Edge recommended for Web Speech & WebRTC capabilities).

---

## Project Structure

```
assessment 3/
├── main.py                     # FastAPI application entry point & API routes
├── requirements.txt            # Python dependencies
├── .env.example                # API key template
├── README.md                   # Project documentation
├── backend/
│   ├── __init__.py
│   ├── config.py               # Application & model configuration
│   ├── models.py               # Pydantic data schemas & enums
│   ├── ai_engine.py            # Gemini API integration & JSON parsing
│   ├── jd_analyzer.py         # Job description analysis
│   ├── resume_analyzer.py     # Resume analysis & fit scoring
│   ├── interviewer.py         # 3-level adaptive interview engine
│   ├── evaluator.py           # Comprehensive evaluation & scoring
│   └── file_parser.py         # PDF & DOCX text extraction
└── frontend/
    ├── index.html              # SPA container shell
    ├── css/
    │   ├── design-system.css   # Color tokens, typography, glassmorphism
    │   ├── components.css      # Reusable UI component styles
    │   ├── animations.css      # Keyframes, waveform, micro-interactions
    │   └── pages.css           # Screen-specific layouts & print styles
    └── js/
        ├── app.js              # SPA router & global state
        ├── api.js              # Backend REST API client
        ├── components/
        │   ├── navbar.js       # Navigation with step indicators
        │   ├── file-upload.js  # Drag-and-drop file upload
        │   ├── gauge.js        # Canvas/SVG circular score gauge
        │   ├── radar-chart.js  # Canvas spider/radar competency chart
        │   └── voice-controls.js # Mic controls & waveform
        ├── utils/
        │   ├── speech.js       # Web Speech API (STT & TTS)
        │   ├── video.js        # Camera preview (getUserMedia)
        │   └── helpers.js      # Utility helpers & formatting
        └── pages/
            ├── landing.js      # Hero & feature overview
            ├── input.js        # JD & resume input screen
            ├── role-analysis.js # Role breakdown dashboard
            ├── candidate-analysis.js # Fit score & match breakdown
            ├── interview.js    # Adaptive voice interview room
            └── results.js      # Comprehensive evaluation report
```
