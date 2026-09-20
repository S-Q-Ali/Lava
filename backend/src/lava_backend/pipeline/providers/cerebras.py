"""Cerebras provider — free tier."""
from __future__ import annotations
from typing import Any
from .base import LLMProvider


class CerebrasProvider(LLMProvider):
    name = "cerebras"

    def __init__(self, api_key: str, model: str | None = None, **kwargs: Any):
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError("pip install openai")
        self.client = OpenAI(api_key=api_key, base_url="https://api.cerebras.ai/v1")
        self.model = model or "llama-3.3-70b"

    def chat(self, prompt: str, system: str = "", temperature: float = 0.3, max_tokens: int = 4096) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        response = self.client.chat.completions.create(
            model=self.model, messages=messages, temperature=temperature, max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
