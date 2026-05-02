# ===========================================
# SmartProperty AI - Virtual Tour Service
# ===========================================

from __future__ import annotations

import asyncio
import logging
import threading
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional
from urllib.parse import urlparse, urlunparse
from uuid import uuid4

import httpx
import numpy as np

logger = logging.getLogger(__name__)

VirtualTourStatus = Literal["queued", "processing", "completed", "failed"]


class VirtualTourService:
    """Service responsible for virtual tour generation orchestration."""

    MIN_IMAGES = 8

    def __init__(self) -> None:
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    async def request_generation(
        self,
        property_id: str,
        requested_by: str,
        images: List[Dict[str, str]],
        process_now: bool = False,
    ) -> Dict[str, Any]:
        eligible_images = [img for img in images if img.get("url") and img.get("key")]
        
        logger.info(
            f"Virtual tour generation requested for property {property_id} "
            f"with {len(images)} images (eligible: {len(eligible_images)}), "
            f"process_now={process_now}"
        )

        if len(eligible_images) < self.MIN_IMAGES:
            error_msg = (
                f"Virtual tour generation requires at least {self.MIN_IMAGES} images. "
                f"Got {len(eligible_images)} eligible images."
            )
            logger.error(error_msg)
            raise ValueError(error_msg)

        job_id = f"vt_{property_id}_{uuid4().hex[:10]}"
        job: Dict[str, Any] = {
            "jobId": job_id,
            "status": "queued",
            "message": "Virtual tour generation request queued.",
            "acceptedImageCount": len(eligible_images),
            "propertyId": property_id,
            "requestedBy": requested_by,
            "images": eligible_images,
            "panoramaPath": None,
            "error": None,
        }

        with self._lock:
            self._jobs[job_id] = job
            
        logger.info(f"Virtual tour job created: {job_id}")

        if process_now:
            return await self.process_job(job_id)

        return job

    async def process_job(self, job_id: str) -> Dict[str, Any]:
        job = self.get_job(job_id)
        if not job:
            logger.error(f"Virtual tour job {job_id} not found")
            raise KeyError(f"Virtual tour job {job_id} was not found")

        with self._lock:
            if job["status"] == "completed":
                logger.info(f"Job {job_id} already completed, returning cached result")
                return dict(job)
            job["status"] = "processing"
            job["message"] = "Virtual tour generation is processing."
            
        logger.info(f"Starting processing for job {job_id}")

        try:
            logger.info(f"[{job_id}] Starting stitch pipeline for property {job['propertyId']}")
            panorama_path = await self._run_stitch_pipeline(
                property_id=job["propertyId"],
                job_id=job["jobId"],
                images=job["images"],
            )
            with self._lock:
                job["status"] = "completed"
                job["message"] = "Virtual tour generation completed successfully."
                job["panoramaPath"] = panorama_path
                job["error"] = None
            logger.info(f"[{job_id}] Processing completed successfully. Panorama saved to {panorama_path}")
        except Exception as exc:
            with self._lock:
                job["status"] = "failed"
                job["message"] = "Virtual tour generation failed."
                job["error"] = str(exc)
            logger.error(f"[{job_id}] Processing failed: {exc}", exc_info=True)

        return dict(job)

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            job = self._jobs.get(job_id)
            return dict(job) if job else None

    async def _run_stitch_pipeline(
        self,
        property_id: str,
        job_id: str,
        images: List[Dict[str, str]],
    ) -> str:
        downloaded = await self._download_images([img["url"] for img in images])
        panorama = await self._stitch_images(downloaded)
        return self._save_panorama(property_id=property_id, job_id=job_id, panorama=panorama)

    async def _download_images(self, urls: List[str]) -> List[np.ndarray]:
        logger.info(f"Starting to download {len(urls)} images for stitching")
        decoded_images: List[np.ndarray] = []
        timeout = httpx.Timeout(20.0, connect=10.0)

        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            for idx, url in enumerate(urls):
                try:
                    resolved_url = self._resolve_image_url(url)
                    logger.debug(
                        f"Downloading image {idx + 1}/{len(urls)}: {url} -> {resolved_url}"
                    )
                    response = await client.get(resolved_url)
                    response.raise_for_status()
                    buffer = np.frombuffer(response.content, dtype=np.uint8)

                    try:
                        import cv2  # pylint: disable=import-error
                    except ImportError as exc:
                        raise RuntimeError(
                            "OpenCV is required for stitching. Install opencv-python-headless."
                        ) from exc

                    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
                    if image is None:
                        raise RuntimeError(f"Failed to decode image from URL: {url}")
                    
                    decoded_images.append(image)
                    logger.debug(f"Image {idx + 1} decoded successfully. Shape: {image.shape}")
                except Exception as exc:
                    logger.error(f"Failed to download/decode image {idx + 1} from {url}: {exc}", exc_info=True)
                    raise

        logger.info(f"Successfully downloaded and decoded {len(decoded_images)} images")
        return decoded_images

    def _resolve_image_url(self, url: str) -> str:
        """Map host-local URLs to docker-host address so container can fetch MinIO files."""
        parsed = urlparse(url)
        hostname = parsed.hostname or ""

        if hostname in {"localhost", "127.0.0.1"}:
            new_netloc = parsed.netloc.replace(hostname, "host.docker.internal", 1)
            remapped = urlunparse(
                (
                    parsed.scheme,
                    new_netloc,
                    parsed.path,
                    parsed.params,
                    parsed.query,
                    parsed.fragment,
                )
            )
            logger.debug(f"Remapped localhost URL for container access: {url} -> {remapped}")
            return remapped

        return url

    async def _stitch_images(self, images: List[np.ndarray]) -> np.ndarray:
        if len(images) < self.MIN_IMAGES:
            error_msg = (
                f"Need at least {self.MIN_IMAGES} images to stitch a virtual tour. "
                f"Got {len(images)} images."
            )
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        logger.info(f"Starting stitching of {len(images)} images")
        def _run_stitch_internal(imgs: List[np.ndarray]) -> np.ndarray:
            try:
                import cv2  # pylint: disable=import-error
            except ImportError as exc:
                raise RuntimeError(
                    "OpenCV is required for stitching. Install opencv-python-headless."
                ) from exc

            logger.debug("Creating OpenCV stitcher with PANORAMA mode")
            stitcher = cv2.Stitcher_create(cv2.Stitcher_PANORAMA)

            logger.debug("Running stitching algorithm...")
            status, panorama = stitcher.stitch(imgs)

            if status != cv2.Stitcher_OK or panorama is None:
                error_msg = f"OpenCV stitching failed with status code {status}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)

            logger.info(f"Stitching completed successfully. Output shape: {panorama.shape}")
            return panorama

        # First attempt: stitch all images at once
        try:
            return await asyncio.to_thread(lambda: _run_stitch_internal(images))
        except Exception as exc_all:
            logger.warning(
                "Stitching all images failed, attempting hierarchical chunked stitching",
                exc_info=True,
            )

        # Hierarchical approach: stitch overlapping chunks then stitch chunk panoramas together
        panoramas: List[np.ndarray] = []
        total = len(images)
        chunk_size = min(max(self.MIN_IMAGES, 6), total)
        step = max(1, chunk_size - 2)

        logger.info(f"Attempting chunked stitching: chunk_size={chunk_size}, step={step}")

        for start in range(0, total, step):
            chunk = images[start : start + chunk_size]
            if len(chunk) < self.MIN_IMAGES:
                logger.debug(f"Skipping small chunk at {start} with size {len(chunk)}")
                continue
            try:
                pano = await asyncio.to_thread(lambda c=chunk: _run_stitch_internal(c))
                panoramas.append(pano)
                logger.info(f"Chunk stitched successfully for range {start}:{start+len(chunk)}")
            except Exception:
                logger.warning(f"Chunk stitching failed for range {start}:{start+len(chunk)}", exc_info=True)

        if not panoramas:
            error_msg = "All stitching attempts failed (full+chunked)."
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        if len(panoramas) == 1:
            logger.info("Only one chunk panorama produced — using it as final result")
            return panoramas[0]

        logger.info(f"Stitched {len(panoramas)} chunk panoramas; attempting to merge them")
        try:
            return await asyncio.to_thread(lambda: _run_stitch_internal(panoramas))
        except Exception as exc_merge:
            logger.error("Failed to merge chunk panoramas", exc_info=True)
            raise RuntimeError(f"Failed to merge chunk panoramas: {exc_merge}") from exc_merge

    def _save_panorama(self, property_id: str, job_id: str, panorama: np.ndarray) -> str:
        try:
            import cv2  # pylint: disable=import-error
        except ImportError as exc:
            raise RuntimeError(
                "OpenCV is required for stitching. Install opencv-python-headless."
            ) from exc

        base_dir = Path(__file__).resolve().parents[2] / "data" / "virtual_tours" / property_id
        logger.debug(f"Creating base directory for panorama: {base_dir}")
        base_dir.mkdir(parents=True, exist_ok=True)
        
        output_path = base_dir / f"{job_id}.jpg"
        logger.info(f"Saving panorama to {output_path}")

        saved = cv2.imwrite(str(output_path), panorama)
        if not saved:
            error_msg = f"Could not save generated panorama image to {output_path}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        logger.info(f"Panorama successfully saved to {output_path}")
        return str(output_path)

    async def get_panorama_file_path(
        self, property_id: str, job_id: str
    ) -> str:
        """Retrieve the file path for a generated panorama."""
        panorama_dir = Path(__file__).resolve().parents[2] / "data" / "virtual_tours" / property_id
        panorama_file = panorama_dir / f"{job_id}.jpg"

        logger.debug(f"Looking for panorama at: {panorama_file}")
        
        if not panorama_file.exists():
            error_msg = f"Panorama file not found at {panorama_file}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)
        
        logger.debug(f"Panorama file found: {panorama_file}")
        return str(panorama_file)


virtual_tour_service = VirtualTourService()