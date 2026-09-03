"""
Evaluation Engine.
Generates comprehensive post-interview performance reports.
"""

from backend.ai_engine import generate_json
from backend.models import (
    SessionData, InterviewReport, CompetencyScore, QuestionFeedback,
    PreparationGap, SpeakingMetrics, ReadinessLevel
)
from backend.config import settings


EVALUATION_PROMPT = """You are an expert interview evaluator and career coach.

Evaluate the candidate's interview performance based on the full context below.
Be specific, evidence-based, and actionable in your feedback.

=== JOB ROLE ===
{role_title} at {company}
Required Skills: {required_skills}
Technical Competencies: {tech_competencies}

=== CANDIDATE BACKGROUND ===
Job Fit Score (pre-interview): {fit_score}%
Strengths: {strengths}
Weaknesses: {weaknesses}

=== FULL INTERVIEW TRANSCRIPT ===
{transcript}

=== YOUR TASK ===
Provide a comprehensive evaluation. Return a JSON object:

{{
    "overall_score": 72,
    "summary": "2-3 sentence overall assessment",
    "competency_scores": [
        {{"name": "Role Fit", "score": 75, "feedback": "Specific feedback"}},
        {{"name": "Technical Knowledge", "score": 68, "feedback": "Specific feedback"}},
        {{"name": "Problem Solving", "score": 70, "feedback": "Specific feedback"}},
        {{"name": "Communication", "score": 80, "feedback": "Specific feedback"}},
        {{"name": "Confidence", "score": 65, "feedback": "Specific feedback"}},
        {{"name": "Depth of Understanding", "score": 60, "feedback": "Specific feedback"}},
        {{"name": "Behavioural Fit", "score": 72, "feedback": "Specific feedback"}}
    ],
    "question_feedback": [
        {{
            "question": "The actual question asked",
            "answer": "Brief summary of candidate's answer",
            "level": 1,
            "assessment": "Good",
            "what_was_good": "Specific positive aspects",
            "what_could_be_better": "Specific actionable improvements",
            "ideal_direction": "What a strong answer would cover"
        }},
        ...
    ],
    "strengths": [
        "Specific strength demonstrated in interview with evidence",
        ...
    ],
    "weaknesses": [
        "Specific weakness demonstrated with evidence",
        ...
    ],
    "preparation_gaps": [
        {{
            "topic": "Topic area to improve",
            "priority": 1,
            "subtopics": ["Specific subtopic 1", "Specific subtopic 2"],
            "reason": "Why this matters for the role"
        }},
        ...
    ]
}}

Rules:
- overall_score: 0-100, weighted across all competencies
- Each competency_score: 0-100 with specific feedback referencing actual answers
- question_feedback: One entry per question asked. assessment must be "Good", "Average", or "Weak"
- strengths/weaknesses: 3-5 each, evidence-based from actual interview answers
- preparation_gaps: 3-5, ordered by priority (1=highest). Include specific subtopics to study
- Be honest but constructive. Don't sugarcoat but be encouraging
- Reference specific answers to justify scores

Return ONLY valid JSON."""


def _build_transcript(session: SessionData) -> str:
    """Build the full interview transcript."""
    if not session.exchanges:
        return "No exchanges recorded."

    lines = []
    for ex in session.exchanges:
        level_name = {1: "Screening", 2: "Competency", 3: "Deep-Dive"}.get(ex.level, "")
        lines.append(
            f"--- Level {ex.level} ({level_name}), Question {ex.question_number} ---\n"
            f"Interviewer: {ex.question}\n"
            f"Candidate: {ex.answer}\n"
            f"(Duration: {ex.duration_seconds:.0f}s, Words: {ex.word_count}, Fillers: {ex.filler_word_count})\n"
        )
    return "\n".join(lines)


def _calculate_speaking_metrics(session: SessionData) -> SpeakingMetrics:
    """Calculate speaking performance metrics from interview exchanges."""
    if not session.exchanges:
        return SpeakingMetrics()

    total_words = sum(ex.word_count for ex in session.exchanges)
    total_duration = sum(ex.duration_seconds for ex in session.exchanges)
    total_fillers = sum(ex.filler_word_count for ex in session.exchanges)
    num_exchanges = len(session.exchanges)

    avg_wpm = (total_words / (total_duration / 60)) if total_duration > 0 else 0
    avg_response = total_duration / num_exchanges if num_exchanges > 0 else 0

    return SpeakingMetrics(
        average_wpm=round(avg_wpm, 1),
        total_filler_words=total_fillers,
        average_response_time=round(avg_response, 1),
    )


def _determine_readiness(score: int) -> ReadinessLevel:
    """Map overall score to readiness level."""
    if score >= 80:
        return ReadinessLevel.STRONG_CANDIDATE
    elif score >= 61:
        return ReadinessLevel.INTERVIEW_READY
    elif score >= 41:
        return ReadinessLevel.NEEDS_PREPARATION
    else:
        return ReadinessLevel.NOT_READY


async def evaluate_interview(session: SessionData) -> InterviewReport:
    """Generate a comprehensive evaluation report for the interview."""
    jd = session.jd_analysis
    ca = session.candidate_analysis

    prompt = EVALUATION_PROMPT.format(
        role_title=jd.role_title,
        company=jd.company or "the company",
        required_skills=", ".join(jd.required_skills),
        tech_competencies=", ".join(c.name for c in jd.technical_competencies),
        fit_score=ca.job_fit_score,
        strengths=", ".join(ca.strengths[:3]),
        weaknesses=", ".join(ca.weaknesses[:3]),
        transcript=_build_transcript(session),
    )

    result = await generate_json(prompt, temperature=settings.EVALUATION_TEMPERATURE)

    # Build the report
    overall_score = result.get("overall_score", 50)

    competency_scores = [
        CompetencyScore(**cs)
        for cs in result.get("competency_scores", [])
    ]

    question_feedback = [
        QuestionFeedback(**qf)
        for qf in result.get("question_feedback", [])
    ]

    preparation_gaps = [
        PreparationGap(**pg)
        for pg in result.get("preparation_gaps", [])
    ]

    return InterviewReport(
        overall_score=overall_score,
        readiness_level=_determine_readiness(overall_score),
        competency_scores=competency_scores,
        question_feedback=question_feedback,
        strengths=result.get("strengths", []),
        weaknesses=result.get("weaknesses", []),
        preparation_gaps=preparation_gaps,
        speaking_metrics=_calculate_speaking_metrics(session),
        summary=result.get("summary", ""),
    )
