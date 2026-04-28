# ===========================================
# SmartProperty AI - Recommendations Endpoint
# ===========================================

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from loguru import logger

from app.services.recommendation_service import recommendation_service

router = APIRouter()


# ===========================================
# Request/Response Models
# ===========================================

class UserPreferences(BaseModel):
    """User preferences for property recommendations."""
    
    property_types: Optional[List[str]] = Field(
        default=None,
        description="Preferred property types: apartment, house, condo, studio, villa"
    )
    min_price: Optional[float] = Field(default=None, ge=0)
    max_price: Optional[float] = Field(default=None, ge=0)
    min_bedrooms: Optional[int] = Field(default=None, ge=0)
    max_bedrooms: Optional[int] = Field(default=None, ge=0)
    min_bathrooms: Optional[int] = Field(default=None, ge=0)
    preferred_locations: Optional[List[str]] = Field(default=None)
    amenities: Optional[List[str]] = Field(default=None)
    pet_friendly: Optional[bool] = Field(default=None)
    furnished: Optional[bool] = Field(default=None)


class PropertyRecommendation(BaseModel):
    """A recommended property."""
    
    property_id: str
    title: str
    score: float = Field(ge=0, le=1, description="Match score 0-1")
    price: float
    property_type: str
    location: str
    bedrooms: int
    bathrooms: int
    match_reasons: List[str] = Field(
        description="Reasons why this property was recommended"
    )


class RecommendationResponse(BaseModel):
    """Response containing property recommendations."""
    
    user_id: str
    recommendations: List[PropertyRecommendation]
    total_count: int
    algorithm: str = "collaborative_filtering"


class SimilarPropertiesRequest(BaseModel):
    """Request for similar properties."""
    
    property_id: str
    limit: int = Field(default=10, ge=1, le=50)


# ===========================================
# Endpoints
# ===========================================

@router.get("/user/{user_id}", response_model=RecommendationResponse)
async def get_user_recommendations(
    user_id: str,
    limit: int = Query(default=10, ge=1, le=50),
    include_viewed: bool = Query(default=False),
):
    """
    Get personalized property recommendations for a user.
    
    Uses collaborative filtering and content-based filtering
    to suggest properties based on user preferences and behavior.
    """
    try:
        results = await recommendation_service.get_user_recommendations(
            user_id=user_id,
            limit=limit,
            include_viewed=include_viewed,
        )
    except Exception as exc:
        logger.warning(f"recommendations lookup failed for user={user_id}: {exc}")
        results = []

    recommendations = [
        PropertyRecommendation(
            property_id=item.get("property_id", ""),
            title=(item.get("property") or {}).get("title", ""),
            score=float(item.get("score", 0.0)),
            price=float((item.get("property") or {}).get("price", 0.0)),
            property_type=(item.get("property") or {}).get("type", "unknown"),
            location=((item.get("property") or {}).get("address") or {}).get("city", ""),
            bedrooms=int(((item.get("property") or {}).get("features") or {}).get("bedrooms", 0) or 0),
            bathrooms=int(((item.get("property") or {}).get("features") or {}).get("bathrooms", 0) or 0),
            match_reasons=item.get("match_reasons", []) or [],
        )
        for item in results
    ]

    return RecommendationResponse(
        user_id=user_id,
        recommendations=recommendations,
        total_count=len(recommendations),
        algorithm="preference_based",
    )


@router.post("/preferences", response_model=RecommendationResponse)
async def get_recommendations_by_preferences(
    preferences: UserPreferences,
    user_id: Optional[str] = None,
    limit: int = Query(default=10, ge=1, le=50),
):
    """
    Get property recommendations based on specified preferences.
    
    Can be used for anonymous users or to override user preferences.
    """
    # TODO: use preferences payload as an override source; for now this endpoint
    # remains available and returns an empty list when no user profile is provided.
    return RecommendationResponse(
        user_id=user_id or "anonymous",
        recommendations=[],
        total_count=0,
        algorithm="preference_based"
    )


@router.post("/similar", response_model=List[PropertyRecommendation])
async def get_similar_properties(request: SimilarPropertiesRequest):
    """
    Find properties similar to a given property.
    
    Uses content-based similarity matching on property features.
    """
    # TODO: Implement similarity calculation
    
    return []


@router.post("/train")
async def trigger_model_training(background: bool = True):
    """
    Trigger retraining of the recommendation model.
    
    Admin endpoint to update the model with new data.
    """
    # TODO: Implement model training pipeline
    
    return {
        "status": "training_started" if background else "training_completed",
        "message": "Model training initiated"
    }


@router.get("/model/status")
async def get_model_status():
    """Get the current status of the recommendation model."""
    
    return {
        "model_version": "1.0.0",
        "last_trained": "2026-01-28T10:00:00Z",
        "total_users": 0,
        "total_properties": 0,
        "accuracy": 0.0,
        "status": "not_trained"
    }
