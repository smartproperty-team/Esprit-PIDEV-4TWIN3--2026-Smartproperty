"""Service exports.

Keep imports resilient so optional ML dependencies do not block
virtual tour endpoints in local/dev environments.
"""

from app.services.virtual_tour_service import virtual_tour_service

try:
	from app.services.recommendation_service import recommendation_service
except Exception:  # pragma: no cover - optional service
	recommendation_service = None

try:
	from app.services.pricing_service import price_service
except Exception:  # pragma: no cover - optional service
	price_service = None
