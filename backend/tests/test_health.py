"""Tests de santé.

Propriétaire : TSEFACK CALVIN KLEIN


TODO : maintenir les healthchecks et la couverture.
"""


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_api_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_readiness(client):
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert response.json()["database"] == "ok"
