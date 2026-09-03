"""
Pydantic models for all request/response schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────

class SkillMatchLevel(str, Enum):
    STRONG = "strong"
    PARTIAL = "partial"
    MISSING = "missing"


class AssessmentLevel(str, Enum):
    GOOD = "Good"
    AVERAGE = "Average"
    WEAK = "Weak"


class ReadinessLevel(str, Enum):
    NOT_READY = "Not Ready"
    NEEDS_PREPARATION = "Needs Preparation"
    INTERVIEW_READY = "Interview Ready"
    STRONG_CANDIDATE = "Strong Candidate"


class InterviewLevel(int, Enum):
    SCREENING = 1
    COMPETENCY = 2
    DEEP_DIVE = 3


# ── JD Analysis ───────────────────────────────────────────────────────

class Competency(BaseModel):
    name: str
    description: str = ""


class JDAnalysis(BaseModel):
    role_title: str = ""
    company: str = ""
    key_responsibilities: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    technical_competencies: list[Competency] = Field(default_factory=list)
    behavioural_competencies: list[str] = Field(default_factory=list)
    experience_expectations: str = ""
    important_keywords: list[str] = Field(default_factory=list)
    qualifications: list[str] = Field(default_factory=list)


# ── Resume / Candidate Analysis ──────────────────────────────────────

class SkillMatch(BaseModel):
    skill: str
    level: SkillMatchLevel
    evidence: str = ""


class CandidateProfile(BaseModel):
    skills: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    achievements: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)


class CandidateAnalysis(BaseModel):
    job_fit_score: int = 0
    skill_matches: list[SkillMatch] = Field(default_factory=list)
    profile: CandidateProfile = Field(default_factory=CandidateProfile)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    claims_to_probe: list[str] = Field(default_factory=list)
    resume_improvement_suggestions: list[str] = Field(default_factory=list)


# ── Interview ─────────────────────────────────────────────────────────

class InterviewQuestion(BaseModel):
    question: str
    level: int = 1
    question_number: int = 1
    context_hint: str = ""  # Why the AI asked this


class InterviewExchange(BaseModel):
    question: str
    answer: str
    level: int
    question_number: int
    duration_seconds: float = 0
    word_count: int = 0
    filler_word_count: int = 0


class InterviewStartRequest(BaseModel):
    session_id: str


class InterviewRespondRequest(BaseModel):
    session_id: str
    answer: str
    duration_seconds: float = 0
    word_count: int = 0
    filler_word_count: int = 0


class InterviewResponse(BaseModel):
    assessment: str = ""
    next_question: Optional[InterviewQuestion] = None
    is_complete: bool = False
    current_level: int = 1
    questions_in_level: int = 0
    total_questions_asked: int = 0


# ── Evaluation / Report ──────────────────────────────────────────────

class CompetencyScore(BaseModel):
    name: str
    score: int = 0
    feedback: str = ""


class QuestionFeedback(BaseModel):
    question: str
    answer: str
    level: int = 1
    assessment: AssessmentLevel = AssessmentLevel.AVERAGE
    what_was_good: str = ""
    what_could_be_better: str = ""
    ideal_direction: str = ""


class PreparationGap(BaseModel):
    topic: str
    priority: int = 1  # 1=highest, 3=lowest
    subtopics: list[str] = Field(default_factory=list)
    reason: str = ""


class SpeakingMetrics(BaseModel):
    average_wpm: float = 0
    total_filler_words: int = 0
    average_response_time: float = 0
    filler_words_detail: dict[str, int] = Field(default_factory=dict)


class InterviewReport(BaseModel):
    overall_score: int = 0
    readiness_level: ReadinessLevel = ReadinessLevel.NOT_READY
    competency_scores: list[CompetencyScore] = Field(default_factory=list)
    question_feedback: list[QuestionFeedback] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    preparation_gaps: list[PreparationGap] = Field(default_factory=list)
    speaking_metrics: SpeakingMetrics = Field(default_factory=SpeakingMetrics)
    summary: str = ""


# ── API Request/Response Wrappers ────────────────────────────────────

class AnalyzeJDRequest(BaseModel):
    text: str


class AnalyzeResumeRequest(BaseModel):
    text: str
    jd_analysis: JDAnalysis


class SetApiKeyRequest(BaseModel):
    api_key: str


class SessionData(BaseModel):
    """Server-side session state for an interview."""
    session_id: str
    jd_analysis: Optional[JDAnalysis] = None
    candidate_analysis: Optional[CandidateAnalysis] = None
    jd_text: str = ""
    resume_text: str = ""
    exchanges: list[InterviewExchange] = Field(default_factory=list)
    current_level: int = 1
    current_question_in_level: int = 0
    total_questions_asked: int = 0
    is_active: bool = False
    current_question: str = ""
