"""Voice Library — browse, filter, and preview edge-tts voices.

Provides a comprehensive voice catalog with search, filter, and favorites.
"""
from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Optional

import edge_tts
from fastapi import APIRouter
from pydantic import BaseModel, Field

from .errors import ApiError

router = APIRouter(prefix="/voices", tags=["voices"])

VOICE_CACHE_FILE = Path("voice_cache.json")

# Language groupings for filtering
LANGUAGE_GROUPS = {
    "English": ["en-US", "en-GB", "en-AU", "en-IN", "en-IE", "en-ZA"],
    "Urdu": ["ur-PK", "ur-IN"],
    "Arabic": ["ar-SA", "ar-AE", "ar-EG", "ar-JO"],
    "Hindi": ["hi-IN"],
    "French": ["fr-FR", "fr-CA", "fr-BE"],
    "German": ["de-DE", "de-AT"],
    "Spanish": ["es-ES", "es-MX", "es-AR"],
    "Portuguese": ["pt-BR", "pt-PT"],
    "Japanese": ["ja-JP"],
    "Korean": ["ko-KR"],
    "Chinese": ["zh-CN", "zh-TW"],
    "Italian": ["it-IT"],
    "Russian": ["ru-RU"],
    "Turkish": ["tr-TR"],
    "Polish": ["pl-PL"],
    "Dutch": ["nl-NL", "nl-BE"],
    "Thai": ["th-TH"],
    "Vietnamese": ["vi-VN"],
    "Indonesian": ["id-ID"],
    "Malay": ["ms-MY"],
    "Swedish": ["sv-SE"],
    "Norwegian": ["nb-NO"],
    "Danish": ["da-DK"],
    "Finnish": ["fi-FI"],
    "Czech": ["cs-CZ"],
    "Romanian": ["ro-RO"],
    "Greek": ["el-GR"],
    "Hebrew": ["he-IL"],
    "Filipino": ["fil-PH"],
    "Tamil": ["ta-IN"],
    "Telugu": ["te-IN"],
    "Bengali": ["bn-IN"],
    "Gujarati": ["gu-IN"],
    "Kannada": ["kn-IN"],
    "Malayalam": ["ml-IN"],
    "Marathi": ["mr-IN"],
    "Punjabi": ["pa-IN"],
    "Sinhala": ["si-LK"],
    "Khmer": ["km-KH"],
    "Lao": ["lo-LA"],
    "Nepali": ["ne-NP"],
    "Burmese": ["my-MM"],
    "Croatian": ["hr-HR"],
    "Slovak": ["sk-SK"],
    "Slovenian": ["sl-SI"],
    "Hungarian": ["hu-HU"],
    "Bulgarian": ["bg-BG"],
    "Ukrainian": ["uk-UA"],
    "Estonian": ["et-EE"],
    "Latvian": ["lv-LV"],
    "Lithuanian": ["lt-LT"],
    "Catalan": ["ca-ES"],
    "Basque": ["eu-ES"],
    "Galician": ["gl-ES"],
    "Swahili": ["sw-KE"],
    "Amharic": ["am-ET"],
    "Afrikaans": ["af-ZA"],
    "Icelandic": ["is-IS"],
    "Ireland": ["ga-IE"],
    "Luxembourg": ["lb-LU"],
    "Maltese": ["mt-MT"],
    "Somali": ["so-SO"],
    "Yoruba": ["yo-NG"],
    "Igbo": ["ig-NG"],
    "Chichewa": ["ny-MW"],
    "Sesotho": ["st-ZA"],
    "Tswana": ["tn-ZA"],
    "Uzbek": ["uz-UZ"],
    "Kazakh": ["kk-KZ"],
    "Georgian": ["ka-GE"],
    "Armenian": ["hy-AM"],
    "Azerbaijani": ["az-AZ"],
    "Tajik": ["tg-TJ"],
    "Pashto": ["ps-AF"],
    "Sindhi": ["sd-PK"],
}


class VoiceInfo(BaseModel):
    id: str
    name: str
    locale: str
    gender: str
    language: str = ""
    preview_url: str = ""


class VoiceLibraryResponse(BaseModel):
    voices: list[VoiceInfo]
    languages: list[str]
    total: int


async def _fetch_all_voices() -> list[dict]:
    """Fetch all edge-tts voices, with caching."""
    if VOICE_CACHE_FILE.exists():
        try:
            data = json.loads(VOICE_CACHE_FILE.read_text(encoding="utf-8"))
            return data
        except Exception:
            pass

    voices = await edge_tts.list_voices()
    VOICE_CACHE_FILE.write_text(json.dumps(voices, ensure_ascii=False), encoding="utf-8")
    return voices


def _extract_language(locale: str) -> str:
    """Extract language name from locale code."""
    lang_code = locale.split("-")[0] if "-" in locale else locale
    for lang, codes in LANGUAGE_GROUPS.items():
        if locale in codes or lang_code in [c.split("-")[0] for c in codes]:
            return lang
    return lang_code.upper()


@router.get("", response_model=VoiceLibraryResponse)
async def list_voices(
    language: str = "",
    gender: str = "",
    search: str = "",
):
    """List all available TTS voices with optional filters."""
    raw_voices = await _fetch_all_voices()

    voices = []
    for v in raw_voices:
        info = VoiceInfo(
            id=v.get("ShortName", ""),
            name=v.get("FriendlyName", v.get("ShortName", "")),
            locale=v.get("Locale", ""),
            gender=v.get("Gender", "Unknown"),
            language=_extract_language(v.get("Locale", "")),
        )

        # Apply filters
        if language and info.language.lower() != language.lower():
            continue
        if gender and info.gender.lower() != gender.lower():
            continue
        if search and search.lower() not in info.name.lower() and search.lower() not in info.id.lower():
            continue

        voices.append(info)

    languages = sorted(set(v.language for v in voices))

    return VoiceLibraryResponse(
        voices=voices,
        languages=languages,
        total=len(voices),
    )


@router.get("/preview/{voice_id}")
async def preview_voice(voice_id: str, text: str = "Hello, this is a preview of this voice."):
    """Generate a short preview audio for a voice."""
    import tempfile

    tmp = Path(tempfile.gettempdir()) / f"preview_{voice_id}.mp3"
    try:
        communicate = edge_tts.Communicate(text, voice_id, rate="+0%")
        await communicate.save(str(tmp))
        from fastapi.responses import FileResponse
        return FileResponse(path=str(tmp), media_type="audio/mpeg", filename=f"{voice_id}_preview.mp3")
    except Exception as exc:
        raise ApiError(400, "PREVIEW_FAILED", f"Failed to generate preview: {exc}")
