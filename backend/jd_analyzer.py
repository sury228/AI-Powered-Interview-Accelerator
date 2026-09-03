"""
JD (Job Description) Analyzer.
Extracts structured information from a job description using Gemini.
"""

from backend.ai_engine import generate_json
from backend.models import JDAnalysis
from backend.config import settings


JD_ANALYSIS_PROMPT = """You are an expert HR analyst and job description parser.

Analyze the following Job Description and extract structured information.
Be thorough and specific. If information is not explicitly stated, infer it from context.

JOB DESCRIPTION:
\"\"\"
{jd_text}
\"\"\"

Return a JSON object with this EXACT structure:
{{
    "role_title": "Exact job title",
    "company": "Company name if mentioned, else empty string",
    "key_responsibilities": ["responsibility 1", "responsibility 2", ...],
    "required_skills": ["skill 1", "skill 2", ...],
    "preferred_skills": ["nice-to-have skill 1", ...],
    "technical_competencies": [
        {{"name": "competency name", "description": "brief description"}},
        ...
    ],
    "behavioural_competencies": ["competency 1", "competency 2", ...],
    "experience_expectations": "e.g., 3-5 years in backend development",
    "important_keywords": ["keyword1", "keyword2", ...],
    "qualifications": ["qualification 1", ...]
}}

Rules:
- Extract ALL skills mentioned (programming languages, frameworks, tools, soft skills)
- Separate required vs preferred skills
- Identify 4-8 technical competencies with descriptions
- Extract 3-5 behavioural competencies (e.g., leadership, teamwork, communication)
- List important keywords that a candidate should know
- Be specific, not generic

Return ONLY valid JSON, no other text."""


async def analyze_jd(jd_text: str) -> JDAnalysis:
    """Analyze a job description and return structured analysis."""
    prompt = JD_ANALYSIS_PROMPT.format(jd_text=jd_text)
    result = await generate_json(prompt, temperature=settings.ANALYSIS_TEMPERATURE)
    return JDAnalysis(**result)
