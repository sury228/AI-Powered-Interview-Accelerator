"""
AI-Powered Interview Accelerator — FastAPI Entry Point.
Serves the SPA frontend and provides REST API endpoints.
"""

import uuid
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.models import (
    AnalyzeJDRequest, AnalyzeResumeRequest, SetApiKeyRequest,
    InterviewStartRequest, InterviewRespondRequest,
)
from backend.ai_engine import configure_api
from backend.jd_analyzer import analyze_jd
from backend.resume_analyzer import analyze_resume
from backend.file_parser import extract_text_from_file
from backend.interviewer import (
    create_session, get_session, start_interview, process_answer, sessions
)
from backend.evaluator import evaluate_interview

# ── App setup ─────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Interview Accelerator",
    description="AI-powered interview preparation platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend static files
FRONTEND_DIR = Path(__file__).parent / "frontend"
app.mount("/frontend", StaticFiles(directory=str(FRONTEND_DIR)), name="frontend")


# ── API Routes ────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "has_api_key": settings.has_api_key}


@app.post("/api/set-api-key")
async def set_api_key(request: SetApiKeyRequest):
    """Set the Gemini API key at runtime."""
    try:
        settings.GEMINI_API_KEY = request.api_key
        configure_api(request.api_key)
        return {"status": "ok", "message": "API key configured successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """Upload a PDF/DOCX/TXT file and extract text."""
    try:
        contents = await file.read()
        text = extract_text_from_file(contents, file.filename or "unknown.txt")
        return {"text": text, "filename": file.filename}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {e}")


@app.post("/api/analyze-jd")
async def api_analyze_jd(request: AnalyzeJDRequest):
    """Analyze a job description."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Job description text is required.")
    try:
        result = await analyze_jd(request.text)
        return result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD analysis failed: {e}")


@app.post("/api/analyze-resume")
async def api_analyze_resume(request: AnalyzeResumeRequest):
    """Analyze a resume against a JD analysis."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Resume text is required.")
    try:
        result = await analyze_resume(request.text, request.jd_analysis)
        return result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {e}")


@app.post("/api/interview/create-session")
async def api_create_session(
    jd_text: str = Form(...),
    resume_text: str = Form(...),
    jd_analysis: str = Form(...),
    candidate_analysis: str = Form(...),
):
    """Create an interview session with all context."""
    import json
    try:
        session_id = str(uuid.uuid4())
        jd_data = json.loads(jd_analysis)
        ca_data = json.loads(candidate_analysis)

        from backend.models import JDAnalysis, CandidateAnalysis
        jd = JDAnalysis(**jd_data)
        ca = CandidateAnalysis(**ca_data)

        create_session(session_id, jd, ca, jd_text, resume_text)
        return {"session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session creation failed: {e}")


@app.post("/api/interview/start")
async def api_start_interview(request: InterviewStartRequest):
    """Start the interview and get the first question."""
    try:
        result = await start_interview(request.session_id)
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview start failed: {e}")


@app.post("/api/interview/respond")
async def api_respond(request: InterviewRespondRequest):
    """Submit an answer and get the next question."""
    if not request.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")
    try:
        result = await process_answer(
            request.session_id,
            request.answer,
            request.duration_seconds,
            request.word_count,
            request.filler_word_count,
        )
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing answer failed: {e}")


@app.post("/api/interview/evaluate")
async def api_evaluate(request: InterviewStartRequest):
    """Generate the final evaluation report."""
    try:
        session = get_session(request.session_id)
        report = await evaluate_interview(session)
        return report.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {e}")


# ── SPA fallback — serve index.html for all non-API routes ───────────

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve the SPA index.html for all non-API routes."""
    file_path = FRONTEND_DIR / full_path
    if full_path and file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    return FileResponse(FRONTEND_DIR / "index.html")


# ── Entry point ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 AI Interview Accelerator starting...")
    print("   Open http://localhost:8000 in your browser\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
