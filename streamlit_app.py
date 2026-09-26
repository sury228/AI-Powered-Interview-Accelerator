"""
AI-Powered Interview Accelerator — Streamlit Cloud & Local Deployment App.
Complete end-to-end interactive web application for interview preparation.
"""

import os
import asyncio
import uuid
import json
import time
import nest_asyncio
import streamlit as st

# Apply nest_asyncio for smooth nested event loop execution in Streamlit
nest_asyncio.apply()

# Configure page
st.set_page_config(
    page_title="AI Interview Accelerator",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Import backend modules
from backend.config import settings
from backend.models import JDAnalysis, CandidateAnalysis, SessionData
from backend.ai_engine import configure_api
from backend.jd_analyzer import analyze_jd
from backend.resume_analyzer import analyze_resume
from backend.file_parser import extract_text_from_file
from backend.interviewer import (
    create_session, get_session, start_interview, process_answer, sessions
)
from backend.evaluator import evaluate_interview

# Helper for running async backend functions
def run_async(coroutine):
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coroutine)
    except RuntimeError:
        return asyncio.run(coroutine)


# ── Custom Theme CSS ──────────────────────────────────────────────────
st.markdown("""
<style>
    .stApp {
        background: linear-gradient(135deg, #06060f 0%, #0d0d21 50%, #120d2b 100%);
        color: #f8fafc;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    
    .hero-title {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    
    .hero-subtitle {
        color: #94a3b8;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    
    .custom-card {
        background: rgba(30, 30, 56, 0.55);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }
    
    .card-success { border-left: 4px solid #22c55e; }
    .card-warning { border-left: 4px solid #f59e0b; }
    .card-error { border-left: 4px solid #ef4444; }
    .card-info { border-left: 4px solid #6366f1; }

    .chip {
        display: inline-block;
        padding: 0.25rem 0.65rem;
        background: rgba(99, 102, 241, 0.15);
        color: #c7d2fe;
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 500;
        margin: 0.2rem;
    }
    
    .stButton>button {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1.25rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }
    .stButton>button:hover {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        transform: translateY(-1px);
    }
</style>
""", unsafe_allow_html=True)


# ── Secret & Config Resolution ────────────────────────────────────────
default_key = ""
try:
    if "GEMINI_API_KEY" in st.secrets:
        default_key = st.secrets["GEMINI_API_KEY"]
except Exception:
    pass

if not default_key:
    default_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or settings.GEMINI_API_KEY or ""


# ── State Initialization ──────────────────────────────────────────────
if "active_step" not in st.session_state:
    st.session_state.active_step = "input"
if "api_key" not in st.session_state:
    st.session_state.api_key = default_key
if "jd_text" not in st.session_state:
    st.session_state.jd_text = ""
if "resume_text" not in st.session_state:
    st.session_state.resume_text = ""
if "jd_analysis" not in st.session_state:
    st.session_state.jd_analysis = None
if "candidate_analysis" not in st.session_state:
    st.session_state.candidate_analysis = None
if "session_id" not in st.session_state:
    st.session_state.session_id = None
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "current_question" not in st.session_state:
    st.session_state.current_question = ""
if "current_level" not in st.session_state:
    st.session_state.current_level = 1
if "questions_in_level" not in st.session_state:
    st.session_state.questions_in_level = 0
if "total_questions" not in st.session_state:
    st.session_state.total_questions = 0
if "report" not in st.session_state:
    st.session_state.report = None
if "answer_start_time" not in st.session_state:
    st.session_state.answer_start_time = time.time()


# ── Sidebar ───────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### Interview Accelerator")
    st.caption("AI-powered adaptive preparation platform")
    
    st.divider()
    st.markdown("#### Gemini API Key")
    key_input = st.text_input(
        "API Key",
        value=st.session_state.api_key,
        type="password",
        placeholder="Enter your Gemini API key",
        help="Get a free key from https://aistudio.google.com/apikey"
    )
    if key_input != st.session_state.api_key:
        st.session_state.api_key = key_input
        settings.GEMINI_API_KEY = key_input
        if key_input:
            configure_api(key_input)
            st.success("API key updated")

    # Step Navigation
    st.divider()
    st.markdown("#### Steps")
    steps = [
        ("input", "1. Details Input"),
        ("role", "2. Role Analysis"),
        ("candidate", "3. Candidate Fit"),
        ("interview", "4. AI Interview"),
        ("results", "5. Evaluation Report"),
    ]
    
    for step_id, step_label in steps:
        is_current = st.session_state.active_step == step_id
        disabled = False
        if step_id in ["role", "candidate"] and not st.session_state.jd_analysis:
            disabled = True
        if step_id == "interview" and not st.session_state.session_id:
            disabled = True
        if step_id == "results" and not st.session_state.report:
            disabled = True
            
        if st.button(f"{'▶ ' if is_current else ''}{step_label}", key=f"nav_{step_id}", disabled=disabled, use_container_width=True):
            st.session_state.active_step = step_id
            st.rerun()

    st.divider()
    if st.button("Reset / Start Over", use_container_width=True):
        st.session_state.active_step = "input"
        st.session_state.jd_text = ""
        st.session_state.resume_text = ""
        st.session_state.jd_analysis = None
        st.session_state.candidate_analysis = None
        st.session_state.session_id = None
        st.session_state.chat_history = []
        st.session_state.report = None
        st.rerun()


# ── Page 1: Input ─────────────────────────────────────────────────────
if st.session_state.active_step == "input":
    st.markdown('<div class="hero-title">Provide Your Details</div>', unsafe_allow_html=True)
    st.markdown('<div class="hero-subtitle">Paste or upload your target job description and resume to begin your personalized prep.</div>', unsafe_allow_html=True)

    if not st.session_state.api_key:
        st.warning("Please configure your Gemini API Key in the sidebar or via secrets to analyze documents.")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### Job Description")
        jd_tab1, jd_tab2 = st.tabs(["Paste Text", "Upload File"])
        with jd_tab1:
            jd_text_val = st.text_area(
                "Job Description Text",
                value=st.session_state.jd_text,
                height=260,
                placeholder="Paste the job description here...",
                label_visibility="collapsed"
            )
            if jd_text_val:
                st.session_state.jd_text = jd_text_val
        with jd_tab2:
            jd_file = st.file_uploader("Upload JD (.pdf, .docx, .txt)", type=["pdf", "docx", "doc", "txt"], key="jd_file_upload")
            if jd_file is not None:
                try:
                    bytes_data = jd_file.read()
                    extracted = extract_text_from_file(bytes_data, jd_file.name)
                    st.session_state.jd_text = extracted
                    st.success(f"Extracted text from {jd_file.name}")
                except Exception as e:
                    st.error(f"Failed to parse file: {e}")

    with col2:
        st.markdown("#### Your Resume")
        res_tab1, res_tab2 = st.tabs(["Paste Text", "Upload File"])
        with res_tab1:
            res_text_val = st.text_area(
                "Resume Text",
                value=st.session_state.resume_text,
                height=260,
                placeholder="Paste your resume content here...",
                label_visibility="collapsed"
            )
            if res_text_val:
                st.session_state.resume_text = res_text_val
        with res_tab2:
            res_file = st.file_uploader("Upload Resume (.pdf, .docx, .txt)", type=["pdf", "docx", "doc", "txt"], key="res_file_upload")
            if res_file is not None:
                try:
                    bytes_data = res_file.read()
                    extracted = extract_text_from_file(bytes_data, res_file.name)
                    st.session_state.resume_text = extracted
                    st.success(f"Extracted text from {res_file.name}")
                except Exception as e:
                    st.error(f"Failed to parse file: {e}")

    st.markdown("<br>", unsafe_allow_html=True)
    
    if st.button("Analyse with AI →", type="primary", use_container_width=True):
        if not st.session_state.api_key:
            st.error("Please provide a valid Gemini API Key in the sidebar.")
        elif not st.session_state.jd_text.strip():
            st.error("Please provide a job description.")
        elif not st.session_state.resume_text.strip():
            st.error("Please provide your resume.")
        else:
            with st.spinner("Extracting skills, competencies, and match insights..."):
                try:
                    configure_api(st.session_state.api_key)
                    # Step 1: JD Analysis
                    jd_res = run_async(analyze_jd(st.session_state.jd_text))
                    st.session_state.jd_analysis = jd_res
                    
                    # Step 2: Resume Analysis
                    cand_res = run_async(analyze_resume(st.session_state.resume_text, jd_res))
                    st.session_state.candidate_analysis = cand_res
                    
                    st.session_state.active_step = "role"
                    st.rerun()
                except Exception as e:
                    st.error(f"Analysis failed: {e}")


# ── Page 2: Role Analysis ─────────────────────────────────────────────
elif st.session_state.active_step == "role":
    jd = st.session_state.jd_analysis
    st.markdown('<div class="hero-title">Role Analysis</div>', unsafe_allow_html=True)
    st.markdown(f"### {jd.role_title} {f'at {jd.company}' if jd.company else ''}")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("#### Required Skills")
        chips_html = "".join([f'<span class="chip">{skill}</span>' for skill in jd.required_skills])
        st.markdown(chips_html or "None specified", unsafe_allow_html=True)
        
        if jd.preferred_skills:
            st.markdown("<br>#### Preferred Skills", unsafe_allow_html=True)
            pref_html = "".join([f'<span class="chip">{skill}</span>' for skill in jd.preferred_skills])
            st.markdown(pref_html, unsafe_allow_html=True)
            
        st.markdown("<br>#### Technical Competencies", unsafe_allow_html=True)
        for comp in jd.technical_competencies:
            st.markdown(f"""
            <div class="custom-card card-info">
                <strong>{comp.name}</strong>
                <p style="font-size: 0.85rem; color: #94a3b8; margin: 4px 0 0 0;">{comp.description}</p>
            </div>
            """, unsafe_allow_html=True)

    with col2:
        st.markdown("#### Key Responsibilities")
        for i, resp in enumerate(jd.key_responsibilities, 1):
            st.markdown(f"**{i}.** {resp}")
            
        if jd.behavioural_competencies:
            st.markdown("<br>#### Behavioural Competencies", unsafe_allow_html=True)
            beh_html = "".join([f'<span class="chip">{b}</span>' for b in jd.behavioural_competencies])
            st.markdown(beh_html, unsafe_allow_html=True)
            
        if jd.experience_expectations or jd.qualifications:
            st.markdown("<br>#### Experience & Qualifications", unsafe_allow_html=True)
            if jd.experience_expectations:
                st.write(f"• **Experience**: {jd.experience_expectations}")
            for q in jd.qualifications:
                st.write(f"• **Qualification**: {q}")

    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("Continue to Candidate Fit Analysis →", type="primary", use_container_width=True):
        st.session_state.active_step = "candidate"
        st.rerun()


# ── Page 3: Candidate Fit Analysis ────────────────────────────────────
elif st.session_state.active_step == "candidate":
    ca = st.session_state.candidate_analysis
    jd = st.session_state.jd_analysis
    
    st.markdown('<div class="hero-title">Candidate Analysis</div>', unsafe_allow_html=True)
    st.markdown(f"### Profile Fit for **{jd.role_title}**")
    
    # Fit score banner
    st.metric(label="Calculated Job Fit Score", value=f"{ca.job_fit_score}%")
    st.progress(ca.job_fit_score / 100)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Match Breakdown
    strong = [m for m in ca.skill_matches if m.level == "strong"]
    partial = [m for m in ca.skill_matches if m.level == "partial"]
    missing = [m for m in ca.skill_matches if m.level == "missing"]
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(f"#### Strong Match ({len(strong)})")
        for m in strong:
            st.markdown(f"""
            <div class="custom-card card-success">
                <strong>{m.skill}</strong>
                {f'<p style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px">{m.evidence}</p>' if m.evidence else ''}
            </div>
            """, unsafe_allow_html=True)
    with col2:
        st.markdown(f"#### Partial Match ({len(partial)})")
        for m in partial:
            st.markdown(f"""
            <div class="custom-card card-warning">
                <strong>{m.skill}</strong>
                {f'<p style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px">{m.evidence}</p>' if m.evidence else ''}
            </div>
            """, unsafe_allow_html=True)
    with col3:
        st.markdown(f"#### Missing Skills ({len(missing)})")
        for m in missing:
            st.markdown(f"""
            <div class="custom-card card-error">
                <strong>{m.skill}</strong>
                {f'<p style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px">{m.evidence}</p>' if m.evidence else ''}
            </div>
            """, unsafe_allow_html=True)
            
    # Strengths & Weaknesses
    st.markdown("<br>", unsafe_allow_html=True)
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("#### Strengths")
        for s in ca.strengths:
            st.markdown(f"• {s}")
    with c2:
        st.markdown("#### Areas to Improve")
        for w in ca.weaknesses:
            st.markdown(f"• {w}")
            
    if ca.claims_to_probe:
        st.markdown("<br>#### Items the AI Will Probe in the Interview", unsafe_allow_html=True)
        for c in ca.claims_to_probe:
            st.markdown(f"• {c}")

    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("Start Personalised AI Interview →", type="primary", use_container_width=True):
        with st.spinner("Preparing 3-level adaptive interview session..."):
            session_id = str(uuid.uuid4())
            create_session(session_id, jd, ca, st.session_state.jd_text, st.session_state.resume_text)
            st.session_state.session_id = session_id
            
            # Start interview
            resp = run_async(start_interview(session_id))
            st.session_state.current_question = resp.next_question.question
            st.session_state.current_level = resp.current_level
            st.session_state.chat_history = [{"role": "ai", "content": resp.next_question.question}]
            st.session_state.answer_start_time = time.time()
            st.session_state.active_step = "interview"
            st.rerun()


# ── Page 4: AI Adaptive Interview ─────────────────────────────────────
elif st.session_state.active_step == "interview":
    st.markdown('<div class="hero-title">Adaptive AI Interview</div>', unsafe_allow_html=True)
    
    level_names = {1: "Screening", 2: "Competency", 3: "Deep-Dive"}
    cur_lvl = st.session_state.current_level
    lvl_name = level_names.get(cur_lvl, "Interview")
    
    st.markdown(f"**Level {cur_lvl}: {lvl_name}** — Total Questions Answered: `{st.session_state.total_questions}`")
    
    # Render chat conversation
    chat_container = st.container()
    with chat_container:
        for msg in st.session_state.chat_history:
            if msg["role"] == "ai":
                with st.chat_message("assistant"):
                    st.write(msg["content"])
            else:
                with st.chat_message("user"):
                    st.write(msg["content"])

    # User input
    user_answer = st.chat_input("Type your answer and press Enter...")
    
    if user_answer:
        duration = time.time() - st.session_state.answer_start_time
        words = len(user_answer.split())
        
        st.session_state.chat_history.append({"role": "user", "content": user_answer})
        
        with st.spinner("AI is evaluating your response and preparing the next question..."):
            try:
                resp = run_async(process_answer(
                    st.session_state.session_id,
                    user_answer,
                    duration_seconds=duration,
                    word_count=words
                ))
                
                st.session_state.total_questions = resp.total_questions_asked
                st.session_state.current_level = resp.current_level
                
                if resp.is_complete:
                    st.session_state.chat_history.append({
                        "role": "ai",
                        "content": "Thank you! You have completed all questions. Generating your evaluation report..."
                    })
                    
                    session_obj = get_session(st.session_state.session_id)
                    rep = run_async(evaluate_interview(session_obj))
                    st.session_state.report = rep
                    st.session_state.active_step = "results"
                    st.rerun()
                else:
                    st.session_state.current_question = resp.next_question.question
                    st.session_state.chat_history.append({"role": "ai", "content": resp.next_question.question})
                    st.session_state.answer_start_time = time.time()
                    st.rerun()
            except Exception as e:
                st.error(f"Error processing answer: {e}")
                
    st.markdown("<br>", unsafe_allow_html=True)
    col1, col2 = st.columns([4, 1])
    with col2:
        if st.button("End Interview & Get Report", use_container_width=True):
            with st.spinner("Evaluating interview performance..."):
                session_obj = get_session(st.session_state.session_id)
                rep = run_async(evaluate_interview(session_obj))
                st.session_state.report = rep
                st.session_state.active_step = "results"
                st.rerun()


# ── Page 5: Evaluation & Performance Report ───────────────────────────
elif st.session_state.active_step == "results":
    report = st.session_state.report
    st.markdown('<div class="hero-title">Performance Report</div>', unsafe_allow_html=True)
    
    # Overall score & summary
    c1, c2 = st.columns([1, 2])
    with c1:
        st.metric("Overall Score", f"{report.overall_score}/100")
        st.write(f"**Readiness Level**: `{report.readiness_level.value}`")
    with c2:
        st.markdown(f"**Summary**: {report.summary}")
        
    st.divider()
    
    # Competency scores
    st.markdown("#### Competency Scores")
    for cs in report.competency_scores:
        col_name, col_bar = st.columns([1, 3])
        with col_name:
            st.write(f"**{cs.name}** (`{cs.score}%`)")
        with col_bar:
            st.progress(cs.score / 100)
            if cs.feedback:
                st.caption(cs.feedback)
                
    st.divider()
    
    # Question-by-Question Feedback
    st.markdown("#### Question-by-Question Feedback")
    for i, qf in enumerate(report.question_feedback, 1):
        with st.expander(f"Question {i}: {qf.question[:75]}... [{qf.assessment.value}]"):
            st.markdown(f"**Question**: {qf.question}")
            st.markdown(f"**Your Answer**: {qf.answer}")
            st.markdown(f"• **What Was Good**: {qf.what_was_good}")
            st.markdown(f"• **Could Be Better**: {qf.what_could_be_better}")
            st.markdown(f"• **Ideal Direction**: {qf.ideal_direction}")

    st.divider()
    
    # Strengths & Weaknesses
    col_str, col_weak = st.columns(2)
    with col_str:
        st.markdown("#### Strengths")
        for s in report.strengths:
            st.markdown(f"• {s}")
    with col_weak:
        st.markdown("#### Weaknesses")
        for w in report.weaknesses:
            st.markdown(f"• {w}")
            
    # Preparation Plan
    if report.preparation_gaps:
        st.divider()
        st.markdown("#### Preparation Plan")
        for pg in report.preparation_gaps:
            st.markdown(f"""
            <div class="custom-card card-warning">
                <strong>Priority {pg.priority}: {pg.topic}</strong>
                <p style="font-size: 0.85rem; color: #94a3b8; margin: 4px 0;">{pg.reason}</p>
                <div>{"".join([f'<span class="chip">{st_item}</span>' for st_item in pg.subtopics])}</div>
            </div>
            """, unsafe_allow_html=True)
            
    # Download report
    st.divider()
    report_json = json.dumps(report.model_dump(), indent=2)
    st.download_button(
        "Download Full Report (JSON)",
        data=report_json,
        file_name="interview_report.json",
        mime="application/json",
        use_container_width=True
    )
