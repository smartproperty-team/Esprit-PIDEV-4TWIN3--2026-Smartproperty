# ===========================================
# SmartProperty AI - Recommendation Service
# ===========================================

from typing import Any, List, Optional
import hashlib
import json
import numpy as np
from loguru import logger
from bson import ObjectId

from app.core.database import get_collection
from app.core.redis import cache_get, cache_set


class RecommendationService:
    """
    Property recommendation service using collaborative and content-based filtering.
    """
    
    def __init__(self):
        self.model = None
        self.is_trained = False
    
    async def get_user_recommendations(
        self,
        user_id: str,
        limit: int = 10,
        include_viewed: bool = False,
    ) -> List[dict]:
        """
        Get personalized recommendations for a user.
        
        Uses:
        1. User's explicit preferences
        2. User's viewing history
        3. Similar users' preferences (collaborative filtering)
        4. Property features (content-based filtering)
        """
        user_profile = await self._get_user_profile(user_id)
        profile_fingerprint = self._build_profile_fingerprint(user_profile)

        cache_key = (
            f"recommendations:{user_id}:{limit}:{int(include_viewed)}:"
            f"{profile_fingerprint}"
        )
        cached = await cache_get(cache_key)
        if cached:
            try:
                parsed = json.loads(cached)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                # Ignore cache parsing issues and recompute.
                pass
        
        interactions = await self._get_user_interactions(user_id)
        
        properties = await self._get_candidate_properties(
            user_profile,
            exclude_viewed=not include_viewed,
            viewed_ids=interactions.get("viewed", [])
        )
        
        scored_properties = await self._score_properties(
            user_profile,
            interactions,
            properties
        )
        
        recommendations = sorted(
            scored_properties,
            key=lambda x: x["score"],
            reverse=True
        )[:limit]
        
        try:
            await cache_set(cache_key, json.dumps(recommendations), expire=3600)
        except Exception:
            pass
        
        return recommendations

    def _build_profile_fingerprint(self, user_profile: dict) -> str:
        """Build a stable hash for preference-aware cache keys."""
        preferences = user_profile.get("preferences") or {}
        payload = json.dumps(preferences, sort_keys=True, default=str)
        return hashlib.sha1(payload.encode("utf-8")).hexdigest()[:12]
    
    async def get_similar_properties(
        self,
        property_id: str,
        limit: int = 10,
    ) -> List[dict]:
        """
        Find properties similar to a given property.
        
        Uses content-based similarity on:
        - Property type
        - Price range
        - Location
        - Features and amenities
        - Size (bedrooms, bathrooms, area)
        """
        # Get the reference property
        properties_col = get_collection("properties")
        reference = await properties_col.find_one({"_id": property_id})
        
        if not reference:
            return []
        
        # Find similar properties
        similar = await properties_col.find({
            "_id": {"$ne": property_id},
            "status": "available",
            "type": reference.get("type"),
            "price": {
                "$gte": reference.get("price", 0) * 0.7,
                "$lte": reference.get("price", 0) * 1.3
            }
        }).limit(limit * 3).to_list(length=limit * 3)
        
        # Calculate similarity scores
        scored = []
        for prop in similar:
            score = self._calculate_similarity(reference, prop)
            scored.append({
                "property_id": str(prop["_id"]),
                "score": score,
                "property": prop
            })
        
        # Sort by similarity
        scored.sort(key=lambda x: x["score"], reverse=True)
        
        return scored[:limit]
    
    def _calculate_similarity(self, prop1: dict, prop2: dict) -> float:
        """Calculate cosine similarity between two properties."""
        # Feature vector extraction
        features1 = self._extract_features(prop1)
        features2 = self._extract_features(prop2)
        
        # Cosine similarity
        dot_product = np.dot(features1, features2)
        norm1 = np.linalg.norm(features1)
        norm2 = np.linalg.norm(features2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
    
    def _extract_features(self, prop: dict) -> np.ndarray:
        """Extract numerical feature vector from property."""
        features = prop.get("features", {})
        
        return np.array([
            features.get("bedrooms", 0) / 10,
            features.get("bathrooms", 0) / 5,
            features.get("area", 0) / 5000,
            prop.get("price", 0) / 10000,
            1.0 if features.get("furnished") else 0.0,
            1.0 if features.get("petFriendly") else 0.0,
            len(features.get("amenities", [])) / 20,
        ])
    
    async def _get_user_profile(self, user_id: str) -> dict:
        """Get user profile with preferences from users collection."""
        users_col = get_collection("users")

        lookup_ids: list[Any] = [user_id]
        try:
            lookup_ids.append(ObjectId(user_id))
        except Exception:
            pass

        user = await users_col.find_one({"$or": [{"_id": {"$in": lookup_ids}}, {"id": user_id}]})
        if not user:
            return {}

        return {
            "userId": str(user.get("_id") or user.get("id") or user_id),
            "preferences": user.get("preferences") or {},
        }
    
    async def _get_user_interactions(self, user_id: str) -> dict:
        """Get user's interaction history."""
        # TODO: Implement interaction tracking
        return {
            "viewed": [],
            "favorited": [],
            "applied": [],
        }
    
    async def _get_candidate_properties(
        self,
        user_profile: dict,
        exclude_viewed: bool = True,
        viewed_ids: List[str] = None,
    ) -> List[dict]:
        """Get candidate properties based on user preferences."""
        properties_col = get_collection("properties")
        
        query = {
            "status": "available",
            "category": "rental",
        }
        
        # Apply user preferences
        preferences = user_profile.get("preferences", {})
        
        property_types = [
            p.strip().lower()
            for p in preferences.get("propertyTypes", [])
            if isinstance(p, str) and p.strip()
        ]
        if property_types:
            query["type"] = {"$in": property_types}

        min_budget = None
        max_budget = None
        budget_range = preferences.get("budgetRange")
        if isinstance(budget_range, list) and len(budget_range) == 2:
            min_budget, max_budget = budget_range

        if isinstance(max_budget, (int, float)):
            query["price"] = {"$lte": max_budget}

        if isinstance(min_budget, (int, float)):
            query.setdefault("price", {})["$gte"] = min_budget
        
        if exclude_viewed and viewed_ids:
            query["_id"] = {"$nin": viewed_ids}
        
        properties = await properties_col.find(query).limit(100).to_list(length=100)
        
        return properties
    
    async def _score_properties(
        self,
        user_profile: dict,
        interactions: dict,
        properties: List[dict],
    ) -> List[dict]:
        """Score properties based on explicit user preferences only."""
        scored = []
        preferences = user_profile.get("preferences", {})

        budget_range = preferences.get("budgetRange") or [0, 0]
        min_budget = float(budget_range[0]) if len(budget_range) == 2 else 0.0
        max_budget = float(budget_range[1]) if len(budget_range) == 2 else 0.0
        preferred_types = {
            p.strip().lower()
            for p in (preferences.get("propertyTypes") or [])
            if isinstance(p, str) and p.strip()
        }
        preferred_locations = self._extract_preferred_locations(preferences)
        
        for prop in properties:
            score = 0.0
            reasons = []
            
            price = prop.get("price", 0)
            price_score = self._compute_price_score(price, min_budget, max_budget)
            score += 0.45 * price_score
            if price_score >= 0.8:
                reasons.append("Within your budget")
            
            prop_type = str(prop.get("type", "")).lower()
            type_score = 1.0 if preferred_types and prop_type in preferred_types else (0.4 if not preferred_types else 0.0)
            score += 0.2 * type_score
            if preferred_types and type_score == 1.0:
                reasons.append("Preferred property type")
            
            city = str(prop.get("address", {}).get("city", "")).strip().lower()
            location_score = self._compute_location_score(city, preferred_locations)
            score += 0.3 * location_score
            if location_score >= 0.8:
                reasons.append("In your preferred location")

            feature_score = self._compute_feature_score(preferences, prop)
            score += 0.05 * feature_score
            if feature_score > 0.8:
                reasons.append("Matches your feature preferences")

            if not reasons:
                reasons.append("Recommended based on your preferences")
            
            scored.append({
                "property_id": str(prop["_id"]),
                "score": min(score, 1.0),
                "match_reasons": reasons,
                "property": prop,
            })
        
        return scored

    def _extract_preferred_locations(self, preferences: dict) -> set[str]:
        locations: set[str] = set()

        raw_locations = preferences.get("locations")
        if isinstance(raw_locations, str) and raw_locations.strip():
            for token in raw_locations.split(","):
                clean = token.strip().lower()
                if clean:
                    locations.add(clean)

        location_pref = preferences.get("locationPreference") or {}
        label = location_pref.get("label")
        if isinstance(label, str) and label.strip():
            locations.add(label.strip().lower())

        return locations

    def _compute_price_score(self, price: float, min_budget: float, max_budget: float) -> float:
        if price <= 0:
            return 0.0

        if min_budget <= 0 and max_budget <= 0:
            return 0.5

        if min_budget <= price <= max_budget:
            return 1.0

        # Soft penalty outside range to avoid empty recommendation sets.
        if price < min_budget:
            gap = min_budget - price
            return max(0.0, 1.0 - (gap / max(min_budget, 1.0)))

        gap = price - max_budget
        return max(0.0, 1.0 - (gap / max(max_budget, 1.0)))

    def _compute_location_score(self, city: str, preferred_locations: set[str]) -> float:
        if not preferred_locations:
            return 0.4

        if city in preferred_locations:
            return 1.0

        for pref in preferred_locations:
            if pref in city or city in pref:
                return 0.6

        return 0.0

    def _compute_feature_score(self, preferences: dict, prop: dict) -> float:
        features = prop.get("features") or {}
        score = 0.0
        checks = 0

        preferred_furnished = preferences.get("furnished")
        if isinstance(preferred_furnished, bool):
            checks += 1
            if bool(features.get("furnished")) == preferred_furnished:
                score += 1

        preferred_pet_friendly = preferences.get("petFriendly")
        if isinstance(preferred_pet_friendly, bool):
            checks += 1
            if bool(features.get("petFriendly")) == preferred_pet_friendly:
                score += 1

        preferred_amenities = set(
            a.strip().lower()
            for a in (preferences.get("amenities") or [])
            if isinstance(a, str) and a.strip()
        )
        if preferred_amenities:
            checks += 1
            prop_amenities = set(
                a.strip().lower()
                for a in (features.get("amenities") or [])
                if isinstance(a, str) and a.strip()
            )
            overlap = len(preferred_amenities & prop_amenities)
            score += overlap / len(preferred_amenities)

        if checks == 0:
            return 0.4

        return min(score / checks, 1.0)
    
    async def train_model(self):
        """Train the recommendation model."""
        logger.info("Starting recommendation model training...")
        
        # TODO: Implement actual model training
        # 1. Load user interactions
        # 2. Build user-item matrix
        # 3. Train collaborative filtering model
        # 4. Save model
        
        self.is_trained = True
        logger.info("Recommendation model training completed")


# Singleton instance
recommendation_service = RecommendationService()
