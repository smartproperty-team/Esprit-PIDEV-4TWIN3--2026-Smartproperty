# ===========================================
# SmartProperty AI - Virtual Tour Tests
# ===========================================

import importlib

virtual_tour_module = importlib.import_module("app.services.virtual_tour_service")


def test_generate_virtual_tour_success(client):
    payload = {
        "propertyId": "property-1",
        "requestedBy": "owner-1",
        "images": [
            {"url": f"https://cdn.example.com/{i}.jpg", "key": f"k/{i}.jpg"}
            for i in range(8)
        ],
    }

    response = client.post("/api/v1/virtual-tour/generate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"
    assert data["acceptedImageCount"] == 8
    assert data["jobId"].startswith("vt_property-1_")
    assert data["panoramaPath"] is None


def test_generate_virtual_tour_requires_minimum_images(client):
    payload = {
        "propertyId": "property-1",
        "requestedBy": "owner-1",
        "images": [
            {"url": f"https://cdn.example.com/{i}.jpg", "key": f"k/{i}.jpg"}
            for i in range(3)
        ],
    }

    response = client.post("/api/v1/virtual-tour/generate", json=payload)

    assert response.status_code == 400
    assert "at least 8 images" in response.json()["detail"].lower()


def test_get_virtual_tour_job_status(client):
    payload = {
        "propertyId": "property-2",
        "requestedBy": "owner-2",
        "images": [
            {"url": f"https://cdn.example.com/{i}.jpg", "key": f"k/{i}.jpg"}
            for i in range(8)
        ],
    }

    create_response = client.post("/api/v1/virtual-tour/generate", json=payload)
    assert create_response.status_code == 200
    job_id = create_response.json()["jobId"]

    status_response = client.get(f"/api/v1/virtual-tour/jobs/{job_id}")
    assert status_response.status_code == 200
    assert status_response.json()["jobId"] == job_id


def test_get_virtual_tour_missing_job_returns_404(client):
    response = client.get("/api/v1/virtual-tour/jobs/unknown-job")
    assert response.status_code == 404


def test_generate_virtual_tour_processes_immediately(monkeypatch, client):
    payload = {
        "propertyId": "property-3",
        "requestedBy": "owner-3",
        "processNow": True,
        "images": [
            {"url": f"https://cdn.example.com/{i}.jpg", "key": f"k/{i}.jpg"}
            for i in range(8)
        ],
    }

    async def fake_download_images(self, urls):
        return [object() for _ in urls]

    async def fake_stitch_images(self, images):
        return object()

    def fake_save_panorama(self, property_id, job_id, panorama):
        return f"/tmp/{property_id}/{job_id}.jpg"

    monkeypatch.setattr(
        virtual_tour_module.VirtualTourService,
        "_download_images",
        fake_download_images,
    )
    monkeypatch.setattr(
        virtual_tour_module.VirtualTourService,
        "_stitch_images",
        fake_stitch_images,
    )
    monkeypatch.setattr(
        virtual_tour_module.VirtualTourService,
        "_save_panorama",
        fake_save_panorama,
    )

    response = client.post("/api/v1/virtual-tour/generate", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["panoramaPath"] == f"/tmp/{payload['propertyId']}/{data['jobId']}.jpg"
