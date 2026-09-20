"""Groq provider — free tier, 30 RPM."""
from __future__ import annotations
from typing import Any
from .base import LLMProvider


class GroqProvider(LLMProvider):
    name = "groq"

    def __init__(self, api_key: str, model: str | None = None, **kwargs: Any):
        try:
            from groq import Groq
        except ImportError:
            raise ImportError("pip install groq")
        self.client = Groq(api_key=api_key)
        self.model = model or "llama-3.3-70b-versatile"

    def chat(self, prompt: str, system: str = "", temperature: float = 0.3, max_tokens: int = 4096) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        response = self.client.chat.completions.create(
            model=self.model, messages=messages, temperature=temperature, max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
