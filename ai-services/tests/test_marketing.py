# ===========================================
# SmartProperty AI - Marketing endpoint tests
# ===========================================
"""Tests for marketing description generation.

Heavyweight HF models are mocked at the service-method level so CI never
downloads or runs flan-t5 / nllb.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from unittest.mock import patch

import pytest

from app.services.marketing_service import MarketingService


SAMPLE_SNAPSHOT = {
    "title": "Sunny 2BR with balcony",
    "propertyType": "apartment",
    "city": "Paris",
    "country": "France",
    "bedrooms": 2,
    "bathrooms": 1,
    "areaSqft": 850,
    "amenities": ["elevator", "balcony", "gym"],
}


@pytest.fixture(autouse=True)
def _reset_singleton():
    """Reset the marketing singleton between tests."""
    MarketingService._instance = None
    yield
    MarketingService._instance = None


async def _fake_generate_one(
    self: MarketingService,
    snapshot: Dict[str, Any],
    tone: str,
    length: str,
    hint_keywords: Optional[List[str]],
) -> str:
    base = (
        "This bright apartment offers a comfortable layout with two bedrooms "
        "and a balcony. The building features an elevator and a gym, and the "
        "neighborhood is well connected with shops and transport nearby."
    )
    if length == "long":
        return (base + " ") * 4
    if length == "short":
        return base
    return base + " " + base


async def _fake_translate(
    self: MarketingService, text: str, source_lang: str, target_lang: str
) -> str:
    if source_lang == target_lang:
        return text
    return f"[{target_lang}] {text}"


def test_model_status_endpoint(client):
    response = client.get("/api/v1/marketing/model/status")
    assert response.status_code == 200
    body = response.json()
    assert "generation" in body
    assert "translation" in body
    assert body["generation"]["loaded"] is False
    assert "model_name" in body["generation"]


def test_generate_requires_snapshot_or_id(client):
    response = client.post(
        "/api/v1/marketing/descriptions/generate",
        json={
            "tone": "professional",
            "lengths": ["short"],
            "sourceLanguage": "en",
            "targetLanguages": ["en"],
        },
    )
    assert response.status_code == 400


def test_generate_rejects_invalid_tone(client):
    response = client.post(
        "/api/v1/marketing/descriptions/generate",
        json={
            "propertySnapshot": SAMPLE_SNAPSHOT,
            "tone": "snarky",
            "lengths": ["short"],
            "sourceLanguage": "en",
            "targetLanguages": ["en"],
        },
    )
    assert response.status_code == 422


def test_generate_returns_variants(client):
    with patch.object(
        MarketingService, "_generate_one", _fake_generate_one
    ), patch.object(MarketingService, "_translate", _fake_translate):
        response = client.post(
            "/api/v1/marketing/descriptions/generate",
            json={
                "propertySnapshot": SAMPLE_SNAPSHOT,
                "tone": "warm",
                "lengths": ["short", "medium"],
                "sourceLanguage": "en",
                "targetLanguages": ["en", "fr"],
                "hintKeywords": ["cozy", "bright"],
            },
        )
    assert response.status_code == 200, response.text
    body = response.json()
    assert "variants" in body
    assert "metadata" in body
    assert body["metadata"]["modelName"]
    # 2 lengths x 2 languages = 4 variants
    assert len(body["variants"]) == 4

    languages = {v["language"] for v in body["variants"]}
    assert languages == {"en", "fr"}

    fr_variant = next(v for v in body["variants"] if v["language"] == "fr")
    assert fr_variant["text"].startswith("[fr]")

    short_variants = [v for v in body["variants"] if v["length"] == "short"]
    for v in short_variants:
        assert v["wordCount"] <= 70


def test_generate_length_truncation():
    """The post-processor must clamp word count to the configured maximum."""
    huge = "word " * 500
    truncated = MarketingService._enforce_length(huge, "medium")
    assert len(truncated.split()) <= 140


def test_safety_filter_strips_prohibited_phrases():
    text = "Lovely home. No kids allowed. Guaranteed ROI for investors."
    cleaned = MarketingService._safety_check(text)
    assert "no kids" not in cleaned.lower()
    assert "guaranteed roi" not in cleaned.lower()
