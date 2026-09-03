"""
Adaptive Interview Engine.
3-level interview with full context awareness and adaptive difficulty.
"""

from backend.ai_engine import generate_json
from backend.models import (
    SessionData, InterviewQuestion, InterviewExchange, InterviewResponse,
    JDAnalysis, CandidateAnalysis
)
from backend.config import settings


# ── Session storage ───────────────────────────────────────────────────

sessions: dict[str, SessionData] = {}


def get_session(session_id: str) -> SessionData:
    """Get a session by ID."""
    if session_id not in sessions:
        raise ValueError(f"Session '{session_id}' not found.")
    return sessions[session_id]


def create_session(session_id: str, jd_analysis: JDAnalysis,
                   candidate_analysis: CandidateAnalysis,
                   jd_text: str, resume_text: str) -> SessionData:
    """Create a new interview session."""
    session = SessionData(
        session_id=session_id,
        jd_analysis=jd_analysis,
        candidate_analysis=candidate_analysis,
        jd_text=jd_text,
        resume_text=resume_text,
        is_active=True,
    )
    sessions[session_id] = session
    return session


# ── Prompt builders ──────────────────────────────────────────────────

def _build_context(session: SessionData) -> str:
    """Build the full context string for the AI interviewer."""
    jd = session.jd_analysis
    ca = session.candidate_analysis

    context = f"""=== INTERVIEW CONTEXT ===

JOB ROLE: {jd.role_title} at {jd.company}
REQUIRED SKILLS: {', '.join(jd.required_skills)}
KEY RESPONSIBILITIES: {', '.join(jd.key_responsibilities[:5])}
TECHNICAL COMPETENCIES: {', '.join(c.name for c in jd.technical_competencies)}

CANDIDATE PROFILE:
- Job Fit Score: {ca.job_fit_score}%
- Strengths: {', '.join(ca.strengths[:3])}
- Weaknesses: {', '.join(ca.weaknesses[:3])}
- Claims to Probe: {', '.join(ca.claims_to_probe[:3])}
- Skills: {', '.join(ca.profile.skills[:10])}
- Projects: {', '.join(ca.profile.projects[:5])}
"""
    return context


def _build_conversation_history(session: SessionData) -> str:
    """Build the conversation history for context-aware follow-ups."""
    if not session.exchanges:
        return "No previous exchanges yet."

    history = []
    for ex in session.exchanges:
        level_name = {1: "Screening", 2: "Competency", 3: "Deep-Dive"}.get(ex.level, "Unknown")
        history.append(
            f"[Level {ex.level} - {level_name}, Q{ex.question_number}]\n"
            f"Interviewer: {ex.question}\n"
            f"Candidate: {ex.answer}\n"
        )
    return "\n".join(history)


LEVEL_DESCRIPTIONS = {
    1: {
        "name": "Screening Interview",
        "instruction": """You are conducting a SCREENING interview (Level 1).
Focus on:
- Verifying resume claims and background
- Understanding motivation for this specific role
- Assessing basic understanding of the domain
- Evaluating culture fit and communication

Ask conversational but insightful questions. Reference specific items from their resume.
Start with a warm opener like "Tell me about your experience with [specific project/skill from resume]."
""",
    },
    2: {
        "name": "Competency Interview",
        "instruction": """You are conducting a COMPETENCY interview (Level 2).
Focus on:
- Technical depth in job-relevant skills
- Problem-solving approach and methodology
- Real-world application of knowledge
- Behavioural questions using STAR framework

Increase difficulty from Level 1. Ask about specific technologies, methodologies, and challenges.
Reference their projects and ask how they solved specific problems.
""",
    },
    3: {
        "name": "Deep-Dive Interview",
        "instruction": """You are conducting a DEEP-DIVE interview (Level 3).
Focus on:
- Challenging follow-up questions on previous answers
- Probing vague or incomplete answers from earlier
- Testing reasoning with "why" and "how" questions
- Realistic scenarios and counter-questions
- Areas where the candidate showed weakness

This is the most challenging level. Push the candidate to demonstrate real depth.
If they gave a weak answer earlier, probe that area further.
If they were strong somewhere, increase complexity.
""",
    },
}


QUESTION_PROMPT = """You are an expert interviewer for the position described below.

{context}

=== CONVERSATION HISTORY ===
{history}

=== CURRENT LEVEL ===
Level: {level} — {level_name}
Question number in this level: {q_in_level}
Total questions asked: {total_q}

{level_instruction}

=== YOUR TASK ===
Generate the NEXT interview question. Consider the full conversation history.
{adaptive_instruction}

Return a JSON object:
{{
    "question": "Your interview question here",
    "context_hint": "Brief note on why you chose this question (e.g., 'Following up on weak answer about databases')"
}}

Rules:
- Ask ONE clear question at a time
- Be specific, not generic
- Reference the candidate's actual background
- Adapt based on previous answer quality
- Keep a professional, encouraging tone
- Do NOT repeat questions already asked

Return ONLY valid JSON."""


async def generate_question(session: SessionData) -> InterviewQuestion:
    """Generate the next adaptive interview question."""
    level = session.current_level
    level_info = LEVEL_DESCRIPTIONS[level]

    # Build adaptive instruction based on previous answers
    adaptive = ""
    if session.exchanges:
        last = session.exchanges[-1]
        adaptive = f"""
The candidate's last answer was: "{last.answer[:300]}..."
Assess whether it was strong or weak, and adapt accordingly:
- If weak/vague: probe deeper on the same topic or related weakness
- If strong: increase complexity or move to a new competency area
"""

    prompt = QUESTION_PROMPT.format(
        context=_build_context(session),
        history=_build_conversation_history(session),
        level=level,
        level_name=level_info["name"],
        q_in_level=session.current_question_in_level + 1,
        total_q=session.total_questions_asked + 1,
        level_instruction=level_info["instruction"],
        adaptive_instruction=adaptive,
    )

    result = await generate_json(prompt, temperature=settings.INTERVIEW_TEMPERATURE)

    return InterviewQuestion(
        question=result.get("question", ""),
        level=level,
        question_number=session.current_question_in_level + 1,
        context_hint=result.get("context_hint", ""),
    )


async def start_interview(session_id: str) -> InterviewResponse:
    """Start the interview and return the first question."""
    session = get_session(session_id)
    session.is_active = True
    session.current_level = 1
    session.current_question_in_level = 0
    session.total_questions_asked = 0
    session.exchanges = []

    first_question = await generate_question(session)
    session.current_question = first_question.question

    return InterviewResponse(
        next_question=first_question,
        is_complete=False,
        current_level=1,
        questions_in_level=0,
        total_questions_asked=0,
    )


async def process_answer(session_id: str, answer: str,
                         duration_seconds: float = 0,
                         word_count: int = 0,
                         filler_word_count: int = 0) -> InterviewResponse:
    """Process a candidate's answer and generate the next question or end the interview."""
    session = get_session(session_id)

    if not session.is_active:
        raise ValueError("Interview is not active.")

    # Record the exchange
    exchange = InterviewExchange(
        question=session.current_question,
        answer=answer,
        level=session.current_level,
        question_number=session.current_question_in_level + 1,
        duration_seconds=duration_seconds,
        word_count=word_count or len(answer.split()),
        filler_word_count=filler_word_count,
    )
    session.exchanges.append(exchange)
    session.current_question_in_level += 1
    session.total_questions_asked += 1

    # Check if level is complete
    qpl = settings.QUESTIONS_PER_LEVEL
    if session.current_question_in_level >= qpl:
        if session.current_level < settings.TOTAL_LEVELS:
            # Move to next level
            session.current_level += 1
            session.current_question_in_level = 0
        else:
            # Interview complete
            session.is_active = False
            return InterviewResponse(
                assessment="Interview complete. Generating your performance report...",
                is_complete=True,
                current_level=session.current_level,
                questions_in_level=session.current_question_in_level,
                total_questions_asked=session.total_questions_asked,
            )

    # Generate next question
    next_question = await generate_question(session)
    session.current_question = next_question.question

    return InterviewResponse(
        assessment="",
        next_question=next_question,
        is_complete=False,
        current_level=session.current_level,
        questions_in_level=session.current_question_in_level,
        total_questions_asked=session.total_questions_asked,
    )
