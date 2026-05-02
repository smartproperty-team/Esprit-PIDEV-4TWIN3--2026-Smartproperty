# ===========================================
# SmartProperty AI - Virtual Tour Endpoints
# ===========================================

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.services.virtual_tour_service import virtual_tour_service

router = APIRouter()


class VirtualTourImagePayload(BaseModel):
    url: str
    key: str


class GenerateVirtualTourRequest(BaseModel):
    propertyId: str = Field(min_length=1)
    requestedBy: str = Field(min_length=1)
    images: List[VirtualTourImagePayload] = Field(default_factory=list)
    processNow: bool = False


class GenerateVirtualTourResponse(BaseModel):
    jobId: str
    status: str
    message: str
    acceptedImageCount: int
    panoramaPath: str | None = None
    error: str | None = None


class VirtualTourJobResponse(BaseModel):
    jobId: str
    status: str
    message: str
    acceptedImageCount: int
    panoramaPath: str | None = None
    error: str | None = None


@router.post(
    "/generate",
    response_model=GenerateVirtualTourResponse,
)
async def generate_virtual_tour(
    payload: GenerateVirtualTourRequest,
) -> GenerateVirtualTourResponse:
    """Queue a virtual tour generation request from property photos."""

    try:
        result = await virtual_tour_service.request_generation(
            property_id=payload.propertyId,
            requested_by=payload.requestedBy,
            images=[image.model_dump() for image in payload.images],
            process_now=payload.processNow,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Virtual tour generation failed: {exc}",
        ) from exc

    return GenerateVirtualTourResponse(
        jobId=result["jobId"],
        status=result["status"],
        message=result["message"],
        acceptedImageCount=result["acceptedImageCount"],
        panoramaPath=result.get("panoramaPath"),
        error=result.get("error"),
    )


@router.get("/jobs/{job_id}", response_model=VirtualTourJobResponse)
async def get_virtual_tour_job(job_id: str) -> VirtualTourJobResponse:
    result = virtual_tour_service.get_job(job_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Virtual tour job {job_id} not found",
        )

    return VirtualTourJobResponse(
        jobId=result["jobId"],
        status=result["status"],
        message=result["message"],
        acceptedImageCount=result["acceptedImageCount"],
        panoramaPath=result.get("panoramaPath"),
        error=result.get("error"),
    )


@router.post("/jobs/{job_id}/process", response_model=VirtualTourJobResponse)
async def process_virtual_tour_job(job_id: str) -> VirtualTourJobResponse:
    try:
        result = await virtual_tour_service.process_job(job_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return VirtualTourJobResponse(
        jobId=result["jobId"],
        status=result["status"],
        message=result["message"],
        acceptedImageCount=result["acceptedImageCount"],
        panoramaPath=result.get("panoramaPath"),
        error=result.get("error"),
    )


@router.get("/panoramas/{property_id}/{job_id}")
async def get_panorama(property_id: str, job_id: str) -> FileResponse:
    """Serve the generated panorama image (public endpoint)."""
    try:
        panorama_path = await virtual_tour_service.get_panorama_file_path(
            property_id, job_id
        )
        return FileResponse(
            path=panorama_path,
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=86400"},  # 24h cache
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Panorama not found: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve panorama: {exc}",
        ) from exc


@router.get("/health", tags=["diagnostics"])
async def health_check() -> dict:
    """Health check endpoint and job diagnostics."""
    return {
        "status": "healthy",
        "service": "virtual-tour",
        "jobs_total": len(virtual_tour_service._jobs),
        "jobs": {
            job_id: {
                "status": job["status"],
                "message": job["message"],
                "error": job.get("error"),
                "propertyId": job["propertyId"],
                "acceptedImageCount": job["acceptedImageCount"],
                "panoramaPath": job.get("panoramaPath"),
            }
            for job_id, job in virtual_tour_service._jobs.items()
        },
    }