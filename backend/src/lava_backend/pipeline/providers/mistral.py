"""Mistral provider — free tier."""
from __future__ import annotations
from typing import Any
from .base import LLMProvider


class MistralProvider(LLMProvider):
    name = "mistral"

    def __init__(self, api_key: str, model: str | None = None, **kwargs: Any):
        try:
            from mistralai import Mistral
        except ImportError:
            raise ImportError("pip install mistralai")
        self.client = Mistral(api_key=api_key)
        self.model = model or "mistral-large-latest"

    def chat(self, prompt: str, system: str = "", temperature: float = 0.3, max_tokens: int = 4096) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        response = self.client.chat.complete(model=self.model, messages=messages, temperature=temperature, max_tokens=max_tokens)
        return response.choices[0].message.content or ""
