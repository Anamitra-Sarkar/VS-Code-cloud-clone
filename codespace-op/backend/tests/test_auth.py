"""Tests for auth endpoints – mocking Firebase Admin SDK."""

from unittest.mock import patch, MagicMock, AsyncMock

import pytest

from tests.conftest import MOCK_USER, MOCK_FIREBASE_DECODED


class TestVerifyEndpoint:
    """POST /auth/verify"""

    def test_verify_valid_token(self, app_client, auth_headers):
        response = app_client.post(
            "/auth/verify",
            json={"token": "valid-firebase-token"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == MOCK_USER["uid"]
        assert data["email"] == MOCK_USER["email"]
        assert data["name"] == MOCK_USER["name"]

    def test_verify_invalid_token(self, app_client):
        from firebase_admin import auth as fb_auth

        with patch(
            "app.core.firebase_auth.firebase_auth.verify_id_token",
            side_effect=fb_auth.InvalidIdTokenError("bad token"),
        ):
            response = app_client.post(
                "/auth/verify",
                json={"token": "invalid-token"},
            )
            assert response.status_code == 401

    def test_verify_expired_token(self, app_client):
        from firebase_admin import auth as fb_auth

        with patch(
            "app.core.firebase_auth.firebase_auth.verify_id_token",
            side_effect=fb_auth.ExpiredIdTokenError("expired", MagicMock()),
        ):
            response = app_client.post(
                "/auth/verify",
                json={"token": "expired-token"},
            )
            assert response.status_code == 401


class TestMeEndpoint:
    """GET /auth/me"""

    def test_me_authenticated(self, app_client, auth_headers, fake_db):
        # First create the user via verify
        app_client.post("/auth/verify", json={"token": "valid-firebase-token"})

        response = app_client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == MOCK_USER["uid"]

    def test_me_no_auth(self, app_client):
        response = app_client.get("/auth/me")
        assert response.status_code == 401


class TestLogoutEndpoint:
    """POST /auth/logout"""

    def test_logout(self, app_client, auth_headers):
        response = app_client.post("/auth/logout", headers=auth_headers)
        assert response.status_code == 200
        assert "Logged out" in response.json()["message"]

    def test_logout_no_auth(self, app_client):
        response = app_client.post("/auth/logout")
        assert response.status_code == 401
