# ===========================================
# SmartProperty AI - Marketing Description Endpoints
# ===========================================
"""Marketing description generation endpoints.

POST /api/v1/marketing/descriptions/generate
GET  /api/v1/marketing/model/status
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from loguru import logger
from pydantic import BaseModel, Field, field_validator

from app.services.marketing_service import (
    LENGTHS,
    TONES,
    get_marketing_service,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class PropertySnapshot(BaseModel):
    """Free-form structured property facts.

    Schema is intentionally permissive so the backend can pass whatever
    fields a property has. Required minimum keys are validated below.
    """

    title: Optional[str] = None
    propertyType: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    neighborhood: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    areaSqft: Optional[float] = None
    yearBuilt: Optional[int] = None
    furnished: Optional[bool] = None
    petFriendly: Optional[bool] = None
    parkingSpaces: Optional[int] = None
    amenities: Optional[List[str]] = None
    nearby: Optional[List[str]] = None
    price: Optional[float] = None
    currency: Optional[str] = None

    model_config = {"extra": "allow"}


class GenerateDescriptionRequest(BaseModel):
    propertyId: Optional[str] = None
    propertySnapshot: Optional[PropertySnapshot] = None
    tone: str = Field(default="professional")
    lengths: List[str] = Field(default_factory=lambda: ["medium"])
    sourceLanguage: str = Field(default="en")
    targetLanguages: List[str] = Field(default_factory=lambda: ["en"])
    hintKeywords: Optional[List[str]] = None

    @field_validator("tone")
    @classmethod
    def _check_tone(cls, v: str) -> str:
        if v not in TONES:
            raise ValueError(f"tone must be one of {TONES}")
        return v

    @field_validator("lengths")
    @classmethod
    def _check_lengths(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("lengths must not be empty")
        for length in v:
            if length not in LENGTHS:
                raise ValueError(f"length must be one of {LENGTHS}")
        return v

    @field_validator("targetLanguages")
    @classmethod
    def _check_targets(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("targetLanguages must not be empty")
        return v


class GeneratedVariant(BaseModel):
    length: str
    tone: str
    language: str
    text: str
    wordCount: int


class GenerationMetadata(BaseModel):
    generationId: str
    modelName: str
    modelVersion: str
    cacheHit: bool
    latencyMs: int
    propertyId: Optional[str] = None


class GenerateDescriptionResponse(BaseModel):
    variants: List[GeneratedVariant]
    metadata: GenerationMetadata


class ModelStatusResponse(BaseModel):
    generation: Dict[str, Any]
    translation: Dict[str, Any]
    device: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/descriptions/generate",
    response_model=GenerateDescriptionResponse,
)
async def generate_description(
    payload: GenerateDescriptionRequest,
) -> GenerateDescriptionResponse:
    """Generate AI marketing descriptions for a property."""

    if not payload.propertyId and not payload.propertySnapshot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="propertySnapshot is required when propertyId is not provided",
        )

    snapshot: Dict[str, Any] = (
        payload.propertySnapshot.model_dump(exclude_none=True)
        if payload.propertySnapshot
        else {}
    )

    request_id = payload.propertyId or "draft"
    logger.info(
        f"[marketing] generate request id={request_id} tone={payload.tone} "
        f"lengths={payload.lengths} src={payload.sourceLanguage} "
        f"targets={payload.targetLanguages}"
    )

    service = get_marketing_service()
    try:
        result = await service.generate(
            snapshot=snapshot,
            tone=payload.tone,
            lengths=payload.lengths,
            source_language=payload.sourceLanguage,
            target_languages=payload.targetLanguages,
            hint_keywords=payload.hintKeywords,
            property_id=payload.propertyId,
        )
    except TimeoutError as exc:
        logger.warning(f"[marketing] generation timeout: {exc}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI generation timed out",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("[marketing] generation failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI generation failed: {exc}",
        ) from exc

    return GenerateDescriptionResponse(**result)


@router.get("/model/status", response_model=ModelStatusResponse)
async def get_model_status() -> ModelStatusResponse:
    """Lightweight status of marketing models (no inference)."""
    service = get_marketing_service()
    return ModelStatusResponse(**service.status())
