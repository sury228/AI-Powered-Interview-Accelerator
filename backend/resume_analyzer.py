"""
Resume Analyzer.
Extracts candidate profile, cross-references with JD, and generates fit analysis.
"""

from backend.ai_engine import generate_json
from backend.models import CandidateAnalysis, JDAnalysis
from backend.config import settings


RESUME_ANALYSIS_PROMPT = """You are an expert recruiter and resume analyst.

Analyze the candidate's resume against the job description analysis provided.
Be thorough, specific, and evidence-based. Reference actual items from the resume.

JOB DESCRIPTION ANALYSIS:
\"\"\"
Role: {role_title}
Required Skills: {required_skills}
Preferred Skills: {preferred_skills}
Key Responsibilities: {responsibilities}
Technical Competencies: {tech_competencies}
Behavioural Competencies: {behavioural_competencies}
Experience Expected: {experience}
\"\"\"

CANDIDATE'S RESUME:
\"\"\"
{resume_text}
\"\"\"

Return a JSON object with this EXACT structure:
{{
    "job_fit_score": 72,
    "skill_matches": [
        {{"skill": "Python", "level": "strong", "evidence": "3 years experience, multiple projects"}},
        {{"skill": "AWS", "level": "partial", "evidence": "Used EC2 in one project"}},
        {{"skill": "Kubernetes", "level": "missing", "evidence": "Not mentioned in resume"}},
        ...
    ],
    "profile": {{
        "skills": ["skill1", "skill2", ...],
        "experience": ["Experience item 1", "Experience item 2", ...],
        "projects": ["Project 1 - brief description", ...],
        "achievements": ["Achievement 1", ...],
        "education": ["Degree - University - Year", ...]
    }},
    "strengths": [
        "Specific strength 1 with evidence",
        "Specific strength 2 with evidence",
        ...
    ],
    "weaknesses": [
        "Specific weakness/gap 1",
        ...
    ],
    "claims_to_probe": [
        "Vague claim or impressive item to verify in interview",
        ...
    ],
    "resume_improvement_suggestions": [
        "Specific suggestion 1",
        ...
    ]
}}

Rules:
- job_fit_score: 0-100, based on skill match percentage and experience alignment
- skill_matches: Cover ALL required and preferred skills from the JD
- level must be exactly "strong", "partial", or "missing"
- strengths/weaknesses: Be specific, reference actual resume items
- claims_to_probe: Identify 3-5 items an interviewer should dig into
- resume_improvement_suggestions: 3-5 actionable suggestions

Return ONLY valid JSON, no other text."""


async def analyze_resume(resume_text: str, jd_analysis: JDAnalysis) -> CandidateAnalysis:
    """Analyze a resume against a JD analysis and return candidate assessment."""
    prompt = RESUME_ANALYSIS_PROMPT.format(
        role_title=jd_analysis.role_title,
        required_skills=", ".join(jd_analysis.required_skills),
        preferred_skills=", ".join(jd_analysis.preferred_skills),
        responsibilities="\n".join(f"- {r}" for r in jd_analysis.key_responsibilities),
        tech_competencies=", ".join(c.name for c in jd_analysis.technical_competencies),
        behavioural_competencies=", ".join(jd_analysis.behavioural_competencies),
        experience=jd_analysis.experience_expectations,
        resume_text=resume_text,
    )
    result = await generate_json(prompt, temperature=settings.ANALYSIS_TEMPERATURE)
    return CandidateAnalysis(**result)
