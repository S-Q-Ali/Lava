"""Base LLM provider abstraction."""
from __future__ import annotations
import abc
from typing import Any


class LLMProvider(abc.ABC):
    name: str

    @abc.abstractmethod
    def __init__(self, api_key: str, model: str | None = None, **kwargs: Any): ...

    @abc.abstractmethod
    def chat(self, prompt: str, system: str = "", temperature: float = 0.3, max_tokens: int = 4096) -> str: ...

    def chat_json(self, prompt: str, system: str = "", temperature: float = 0.3, max_tokens: int = 4096) -> dict:
        import json
        response = self.chat(prompt, system=system, temperature=temperature, max_tokens=max_tokens)
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]
        return json.loads(response.strip())
