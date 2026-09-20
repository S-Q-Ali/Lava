"""Provider factory — auto-select best available."""
from __future__ import annotations
import os
from typing import Literal
from .base import LLMProvider


def create_provider(provider: Literal["groq", "cerebras", "mistral", "deepseek", "auto"] = "auto", api_key: str = "", model: str | None = None) -> LLMProvider:
    if provider == "auto":
        for name in ("groq", "cerebras", "mistral"):
            key = api_key or os.environ.get(f"{name.upper()}_API_KEY", "")
            if key:
                return _create(name, key, model)
        raise RuntimeError("No LLM provider configured. Set --api-key or GROQ_API_KEY env var.\nGet a free key at https://console.groq.com/keys")
    else:
        key = api_key or os.environ.get(f"{provider.upper()}_API_KEY", "")
        if not key:
            raise RuntimeError(f"No API key for {provider}. Set --api-key or {provider.upper()}_API_KEY env var.")
        return _create(provider, key, model)


def _create(name: str, key: str, model: str | None) -> LLMProvider:
    if name == "groq":
        from .groq import GroqProvider
        return GroqProvider(api_key=key, model=model)
    elif name == "cerebras":
        from .cerebras import CerebrasProvider
        return CerebrasProvider(api_key=key, model=model)
    elif name == "mistral":
        from .mistral import MistralProvider
        return MistralProvider(api_key=key, model=model)
    raise ValueError(f"Unknown provider: {name}")
