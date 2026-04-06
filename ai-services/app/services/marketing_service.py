# ===========================================
# SmartProperty AI - Marketing Description Service
# ===========================================
"""Real-ML marketing description generation and translation.

Loads google/flan-t5-base for English generation and
facebook/nllb-200-distilled-600M for translation. Models are loaded lazily
once and reused (singleton pattern).
"""

from __future__ import annotations

import asyncio
import json
import re
import time
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from loguru import logger

from app.core.config import settings
from app.core.redis import cache_get, cache_set


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TONES = ("professional", "warm", "luxury")
LENGTHS = ("short", "medium", "long")

LENGTH_TARGETS: Dict[str, Dict[str, int]] = {
    "short": {"min": 40, "max": 70, "max_new_tokens": 140},
    "medium": {"min": 90, "max": 140, "max_new_tokens": 260},
    "long": {"min": 170, "max": 240, "max_new_tokens": 420},
}

TONE_PARAMS: Dict[str, Dict[str, float]] = {
    "professional": {"temperature": 0.55, "top_p": 0.9, "repetition_penalty": 1.15},
    "warm": {"temperature": 0.85, "top_p": 0.92, "repetition_penalty": 1.1},
    "luxury": {"temperature": 0.95, "top_p": 0.95, "repetition_penalty": 1.05},
}

TONE_STYLES: Dict[str, str] = {
    "professional": (
        "in a precise, factual, professional real-estate listing voice"
    ),
    "warm": (
        "in a friendly, welcoming, warm tone that helps the reader picture "
        "themselves living there"
    ),
    "luxury": (
        "in a refined, premium, evocative tone using rich vocabulary that "
        "highlights elegance and exclusivity"
    ),
}

# Mapping ISO-639-1 -> NLLB Flores codes
NLLB_LANG_MAP: Dict[str, str] = {
    "en": "eng_Latn",
    "fr": "fra_Latn",
    "es": "spa_Latn",
    "de": "deu_Latn",
    "it": "ita_Latn",
    "pt": "por_Latn",
    "ar": "arb_Arab",
    "nl": "nld_Latn",
    "zh": "zho_Hans",
    "ja": "jpn_Jpan",
    "ru": "rus_Cyrl",
}

# Patterns/words we strip or veto for content safety
PROHIBITED_PATTERNS = [
    r"\b(no\s+(kids|children|disabled|blacks?|whites?|hispanics?|jews?|muslims?))\b",
    r"\b(christians?\s+only|whites?\s+only|men\s+only|women\s+only)\b",
    r"\b(guaranteed?\s+(roi|return|appreciation|profit))\b",
    r"\b(100%\s+safe|absolutely\s+safe|crime[- ]free)\b",
    r"\b(best\s+investment\s+ever)\b",
]
PROHIBITED_REGEX = re.compile("|".join(PROHIBITED_PATTERNS), re.IGNORECASE)


# ---------------------------------------------------------------------------
# Singleton service
# ---------------------------------------------------------------------------


@dataclass
class _ModelHandles:
    gen_tokenizer: Any = None
    gen_model: Any = None
    tr_tokenizer: Any = None
    tr_model: Any = None
    gen_loaded: bool = False
    tr_loaded: bool = False
    gen_load_error: Optional[str] = None
    tr_load_error: Optional[str] = None


class MarketingService:
    """Singleton service that lazily loads ML pipelines and generates copy."""

    _instance: Optional["MarketingService"] = None

    def __init__(self) -> None:
        self._handles = _ModelHandles()
        self._load_lock = asyncio.Lock()

    @classmethod
    def instance(cls) -> "MarketingService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ---- Model loading -------------------------------------------------

    async def _ensure_generation_model(self) -> None:
        if self._handles.gen_loaded:
            return
        async with self._load_lock:
            if self._handles.gen_loaded:
                return
            try:
                # Import lazily so the rest of the app keeps booting if torch is
                # missing or slow to import.
                from transformers import (
                    AutoTokenizer,
                    AutoModelForSeq2SeqLM,
                )

                model_name = settings.marketing_generation_model_name
                logger.info(f"[marketing] Loading generation model: {model_name}")
                tokenizer = await asyncio.to_thread(
                    AutoTokenizer.from_pretrained, model_name
                )
                model = await asyncio.to_thread(
                    AutoModelForSeq2SeqLM.from_pretrained, model_name
                )
                device = settings.marketing_model_device
                if device and device != "cpu":
                    try:
                        model = model.to(device)
                    except Exception as exc:  # pragma: no cover - hw dependent
                        logger.warning(
                            f"[marketing] Could not move gen model to "
                            f"{device}: {exc}; falling back to cpu"
                        )
                self._handles.gen_tokenizer = tokenizer
                self._handles.gen_model = model
                self._handles.gen_loaded = True
                logger.info("[marketing] Generation model ready")
            except Exception as exc:  # pragma: no cover - environment dep
                self._handles.gen_load_error = str(exc)
                logger.error(f"[marketing] Failed to load generation model: {exc}")
                raise

    async def _ensure_translation_model(self) -> None:
        if self._handles.tr_loaded:
            return
        async with self._load_lock:
            if self._handles.tr_loaded:
                return
            try:
                from transformers import (
                    AutoTokenizer,
                    AutoModelForSeq2SeqLM,
                )

                model_name = settings.marketing_translation_model_name
                logger.info(f"[marketing] Loading translation model: {model_name}")
                tokenizer = await asyncio.to_thread(
                    AutoTokenizer.from_pretrained, model_name
                )
                model = await asyncio.to_thread(
                    AutoModelForSeq2SeqLM.from_pretrained, model_name
                )
                device = settings.marketing_model_device
                if device and device != "cpu":
                    try:
                        model = model.to(device)
                    except Exception as exc:  # pragma: no cover
                        logger.warning(
                            f"[marketing] Could not move tr model to "
                            f"{device}: {exc}; falling back to cpu"
                        )
                self._handles.tr_tokenizer = tokenizer
                self._handles.tr_model = model
                self._handles.tr_loaded = True
                logger.info("[marketing] Translation model ready")
            except Exception as exc:  # pragma: no cover
                self._handles.tr_load_error = str(exc)
                logger.error(
                    f"[marketing] Failed to load translation model: {exc}"
                )
                raise

    def status(self) -> Dict[str, Any]:
        return {
            "generation": {
                "model_name": settings.marketing_generation_model_name,
                "loaded": self._handles.gen_loaded,
                "error": self._handles.gen_load_error,
            },
            "translation": {
                "model_name": settings.marketing_translation_model_name,
                "loaded": self._handles.tr_loaded,
                "error": self._handles.tr_load_error,
            },
            "device": settings.marketing_model_device,
        }

    # ---- Prompt building -----------------------------------------------

    @staticmethod
    def _facts_block(snapshot: Dict[str, Any]) -> str:
        ordered_keys = [
            "title",
            "propertyType",
            "city",
            "state",
            "country",
            "neighborhood",
            "bedrooms",
            "bathrooms",
            "areaSqft",
            "yearBuilt",
            "furnished",
            "petFriendly",
            "parkingSpaces",
            "amenities",
            "nearby",
            "price",
            "currency",
        ]
        lines: List[str] = []
        for key in ordered_keys:
            if key not in snapshot or snapshot[key] in (None, "", []):
                continue
            value = snapshot[key]
            if isinstance(value, (list, tuple)):
                value = ", ".join(str(v) for v in value)
            lines.append(f"- {key}: {value}")
        # Append any extras not in ordered list (best effort)
        for key, value in snapshot.items():
            if key in ordered_keys or value in (None, "", []):
                continue
            if isinstance(value, (list, tuple)):
                value = ", ".join(str(v) for v in value)
            if isinstance(value, dict):
                value = json.dumps(value, ensure_ascii=False)
            lines.append(f"- {key}: {value}")
        return "\n".join(lines) if lines else "- (no structured facts provided)"

    @staticmethod
    def _build_prompt(
        snapshot: Dict[str, Any],
        tone: str,
        length: str,
        hint_keywords: Optional[List[str]],
    ) -> str:
        target = LENGTH_TARGETS[length]
        style = TONE_STYLES[tone]
        keywords = ""
        if hint_keywords:
            keywords = (
                "\nIncorporate naturally if relevant: "
                + ", ".join(str(k) for k in hint_keywords)
            )
        facts = MarketingService._facts_block(snapshot)
        return (
            "You are a professional real-estate copywriter. Write a property "
            f"listing description {style}. The description must be between "
            f"{target['min']} and {target['max']} words. Use only the facts "
            "provided; do not invent amenities, neighborhoods, prices, "
            "guarantees, or demographic restrictions. Do not use "
            "discriminatory language. Avoid superlatives that cannot be "
            "verified. Write in fluent English.\n\n"
            f"Property facts:\n{facts}{keywords}\n\nDescription:"
        )

    # ---- Generation ----------------------------------------------------

    async def _generate_one(
        self,
        snapshot: Dict[str, Any],
        tone: str,
        length: str,
        hint_keywords: Optional[List[str]],
    ) -> str:
        await self._ensure_generation_model()
        tokenizer = self._handles.gen_tokenizer
        model = self._handles.gen_model

        prompt = self._build_prompt(snapshot, tone, length, hint_keywords)
        params = TONE_PARAMS[tone]
        target = LENGTH_TARGETS[length]

        def _run() -> str:
            inputs = tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=1024,
            )
            try:
                device = next(model.parameters()).device
                inputs = {k: v.to(device) for k, v in inputs.items()}
            except Exception:
                pass
            outputs = model.generate(
                **inputs,
                max_new_tokens=target["max_new_tokens"],
                min_new_tokens=max(32, target["max_new_tokens"] // 4),
                do_sample=True,
                temperature=float(params["temperature"]),
                top_p=float(params["top_p"]),
                repetition_penalty=float(params["repetition_penalty"]),
                num_return_sequences=1,
            )
            return tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        return await asyncio.to_thread(_run)

    async def _translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if source_lang == target_lang:
            return text
        await self._ensure_translation_model()
        tokenizer = self._handles.tr_tokenizer
        model = self._handles.tr_model

        src_code = NLLB_LANG_MAP.get(source_lang, "eng_Latn")
        tgt_code = NLLB_LANG_MAP.get(target_lang)
        if not tgt_code:
            raise ValueError(f"Unsupported target language: {target_lang}")

        def _run() -> str:
            tokenizer.src_lang = src_code
            inputs = tokenizer(
                text, return_tensors="pt", truncation=True, max_length=1024
            )
            try:
                device = next(model.parameters()).device
                inputs = {k: v.to(device) for k, v in inputs.items()}
            except Exception:
                pass
            forced_bos = tokenizer.convert_tokens_to_ids(tgt_code)
            outputs = model.generate(
                **inputs,
                forced_bos_token_id=forced_bos,
                max_new_tokens=512,
                num_beams=4,
            )
            return tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        return await asyncio.to_thread(_run)

    # ---- Safety + post-processing -------------------------------------

    @staticmethod
    def _enforce_length(text: str, length: str) -> str:
        target = LENGTH_TARGETS[length]
        words = text.split()
        if len(words) > target["max"]:
            words = words[: target["max"]]
            # try to end on a sentence boundary
            joined = " ".join(words)
            last_period = max(
                joined.rfind("."), joined.rfind("!"), joined.rfind("?")
            )
            if last_period > 0 and last_period > len(joined) * 0.6:
                joined = joined[: last_period + 1]
            return joined.strip()
        return text.strip()

    @staticmethod
    def _safety_check(text: str) -> str:
        if PROHIBITED_REGEX.search(text or ""):
            # Strip offending sentences
            cleaned = PROHIBITED_REGEX.sub("", text).strip()
            cleaned = re.sub(r"\s{2,}", " ", cleaned)
            return cleaned
        return text

    # ---- Public API ----------------------------------------------------

    async def generate(
        self,
        snapshot: Dict[str, Any],
        tone: str,
        lengths: List[str],
        source_language: str,
        target_languages: List[str],
        hint_keywords: Optional[List[str]] = None,
        property_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if tone not in TONES:
            raise ValueError(f"Invalid tone: {tone}")
        for length in lengths:
            if length not in LENGTHS:
                raise ValueError(f"Invalid length: {length}")
        if not target_languages:
            raise ValueError("At least one target language is required")

        cache_key = self._cache_key(
            snapshot, tone, lengths, source_language, target_languages, hint_keywords
        )
        cached_raw = await cache_get(cache_key)
        if cached_raw:
            try:
                cached = json.loads(cached_raw)
                cached["metadata"]["cacheHit"] = True
                return cached
            except Exception:
                pass  # corrupted cache - regenerate

        started = time.perf_counter()
        timeout_s = max(5.0, settings.marketing_generation_timeout_ms / 1000)

        try:
            result = await asyncio.wait_for(
                self._generate_all(
                    snapshot,
                    tone,
                    lengths,
                    source_language,
                    target_languages,
                    hint_keywords,
                ),
                timeout=timeout_s,
            )
        except asyncio.TimeoutError as exc:
            logger.warning("[marketing] Generation timed out")
            raise TimeoutError("Generation timed out") from exc

        latency_ms = int((time.perf_counter() - started) * 1000)
        response = {
            "variants": result,
            "metadata": {
                "generationId": str(uuid.uuid4()),
                "modelName": settings.marketing_generation_model_name,
                "modelVersion": "transformers",
                "cacheHit": False,
                "latencyMs": latency_ms,
                "propertyId": property_id,
            },
        }

        try:
            await cache_set(
                cache_key,
                json.dumps(response, ensure_ascii=False),
                expire=settings.marketing_cache_ttl_seconds,
            )
        except Exception as exc:  # pragma: no cover
            logger.warning(f"[marketing] cache_set failed: {exc}")

        return response

    async def _generate_all(
        self,
        snapshot: Dict[str, Any],
        tone: str,
        lengths: List[str],
        source_language: str,
        target_languages: List[str],
        hint_keywords: Optional[List[str]],
    ) -> List[Dict[str, Any]]:
        # Generate base English variant per length, then translate.
        variants: List[Dict[str, Any]] = []
        base_texts: Dict[str, str] = {}
        for length in lengths:
            raw = await self._generate_one(snapshot, tone, length, hint_keywords)
            cleaned = self._safety_check(raw)
            cleaned = self._enforce_length(cleaned, length)
            base_texts[length] = cleaned

        for length, base_text in base_texts.items():
            for target_lang in target_languages:
                if target_lang == source_language:
                    final = base_text
                else:
                    try:
                        final = await self._translate(
                            base_text, source_language, target_lang
                        )
                    except Exception as exc:
                        logger.error(f"[marketing] translation failed: {exc}")
                        raise
                final = self._safety_check(final)
                variants.append(
                    {
                        "length": length,
                        "tone": tone,
                        "language": target_lang,
                        "text": final,
                        "wordCount": len(final.split()),
                    }
                )
        return variants

    @staticmethod
    def _cache_key(
        snapshot: Dict[str, Any],
        tone: str,
        lengths: List[str],
        source_language: str,
        target_languages: List[str],
        hint_keywords: Optional[List[str]],
    ) -> str:
        import hashlib

        payload = json.dumps(
            {
                "snapshot": snapshot,
                "tone": tone,
                "lengths": sorted(lengths),
                "source": source_language,
                "targets": sorted(target_languages),
                "hints": sorted(hint_keywords or []),
            },
            sort_keys=True,
            ensure_ascii=False,
        )
        digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:32]
        return f"marketing:desc:{digest}"


def get_marketing_service() -> MarketingService:
    return MarketingService.instance()
