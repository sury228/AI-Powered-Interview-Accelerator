"""
Core Gemini API integration.
Reusable prompt builder with structured JSON output, multi-model failover, and retry logic.
"""

import json
import asyncio
import google.generativeai as genai
from backend.config import settings


_configured = False


def configure_api(api_key: str | None = None):
    """Configure the Gemini API with the given key."""
    global _configured
    key = api_key or settings.GEMINI_API_KEY
    if not key:
        raise ValueError("Gemini API key not configured. Set GEMINI_API_KEY in .env or provide via UI.")
    genai.configure(api_key=key)
    _configured = True


def _clean_json_text(text: str) -> str:
    """Strip markdown code blocks and whitespace from JSON response."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


async def generate_json(prompt: str, temperature: float = 0.3) -> dict:
    """
    Send a prompt to Gemini and parse the response as JSON.
    Automatically tries candidate models in order if any model encounters a quota or network error.
    """
    global _configured
    if not _configured:
        configure_api()

    last_error = None

    for model_name in settings.CANDIDATE_MODELS:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    top_p=0.95,
                    max_output_tokens=8192,
                ),
            )
            # Run in executor to avoid blocking event loop
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, model.generate_content, prompt)

            if not response.text:
                continue

            cleaned = _clean_json_text(response.text)
            parsed = json.loads(cleaned)
            return parsed

        except json.JSONDecodeError as e:
            last_error = e
            continue
        except Exception as e:
            # 429 quota, 404 not found, or temporary error -> fail over to next model
            last_error = e
            continue

    raise RuntimeError(f"All available Gemini models failed or hit quota limits: {last_error}")


async def generate_text(prompt: str, temperature: float = 0.7) -> str:
    """
    Send a prompt to Gemini and return the raw text response with model failover.
    Used for conversational interview questions.
    """
    global _configured
    if not _configured:
        configure_api()

    last_error = None

    for model_name in settings.CANDIDATE_MODELS:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    top_p=0.95,
                    max_output_tokens=4096,
                ),
            )
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(None, model.generate_content, prompt)

            if response.text and response.text.strip():
                return response.text.strip()

        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"All Gemini models failed for text generation: {last_error}")
