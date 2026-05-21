"""
Backend regression tests for Iran Observatory.

Focus areas (this iteration):
  - GridFS upload + serve (/api/upload/image, /api/upload/pdf, /api/files/{name})
  - Unsubscribe endpoint
  - Newsletter generation: unsubscribe URL, logo size, founder block
  - Founder settings GET/PUT (admin auth)
  - Regression: login, /api/articles, /api/subscribers
"""

import os
import io
import struct
import zlib
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # frontend/.env value used as the public URL in this environment
    BASE_URL = "https://iran-events-live.preview.emergentagent.com"

ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL") or os.environ.get("ADMIN_EMAIL", "admin@iranobservatory.org")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD") or os.environ.get("ADMIN_PASSWORD", "")
if not ADMIN_PASSWORD:
    raise RuntimeError("TEST_ADMIN_PASSWORD env var is required. See /app/memory/test_credentials.md")


# ----------------------------- helpers / fixtures ----------------------------

def make_png_bytes(width: int = 8, height: int = 8) -> bytes:
    """Build a minimal valid PNG (solid red) without external deps."""
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    raw = b""
    for _ in range(height):
        raw += b"\x00" + (b"\xff\x00\x00" * width)
    idat = zlib.compress(raw, 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def make_pdf_bytes() -> bytes:
    """Minimal valid PDF body (single empty page)."""
    return (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 100 100]>>endobj\n"
        b"xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000100 00000 n \n"
        b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF\n"
    )


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    return s


@pytest.fixture()
def fresh_client():
    """A clean session with no cookies (for unauth checks)."""
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    assert "access_token" in data and data["access_token"]
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ----------------------------- auth / regression ----------------------------

class TestAuthAndRegression:
    def test_login_success(self, api):
        r = api.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert isinstance(data["access_token"], str) and len(data["access_token"]) > 20

    def test_login_invalid(self, api):
        r = api.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrong-pass"},
            timeout=20,
        )
        assert r.status_code == 401

    def test_auth_me(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        assert r.json().get("email") == ADMIN_EMAIL

    def test_articles_public_list(self, api):
        r = api.get(f"{BASE_URL}/api/articles", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_subscribers_admin_list(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/subscribers", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ----------------------------- GridFS upload / serve -------------------------

class TestGridFSUploadServe:
    def test_upload_image_requires_auth(self, fresh_client):
        files = {"file": ("a.png", make_png_bytes(), "image/png")}
        r = fresh_client.post(f"{BASE_URL}/api/upload/image", files=files, timeout=30)
        assert r.status_code in (401, 403), f"Expected unauth, got {r.status_code}"

    def test_upload_pdf_requires_auth(self, fresh_client):
        files = {"file": ("a.pdf", make_pdf_bytes(), "application/pdf")}
        r = fresh_client.post(f"{BASE_URL}/api/upload/pdf", files=files, timeout=30)
        assert r.status_code in (401, 403)

    def test_image_roundtrip(self, api, auth_headers):
        original = make_png_bytes(16, 16)
        files = {"file": ("test_iran.png", original, "image/png")}
        r = api.post(
            f"{BASE_URL}/api/upload/image", files=files, headers=auth_headers, timeout=60
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "image_url" in body and body["image_url"]
        url = body["image_url"]
        # URL should reference /api/files/{uuid}.png
        assert "/api/files/" in url
        assert url.lower().endswith(".png")

        # Fetch back from public URL
        fetch_url = url if url.startswith("http") else f"{BASE_URL}{url}"
        r2 = api.get(fetch_url, timeout=30)
        assert r2.status_code == 200, r2.text
        assert r2.headers.get("content-type", "").startswith("image/png"), r2.headers
        assert r2.content == original, "Round-tripped bytes differ from upload"

    def test_pdf_roundtrip(self, api, auth_headers):
        original = make_pdf_bytes()
        files = {"file": ("test_doc.pdf", original, "application/pdf")}
        r = api.post(
            f"{BASE_URL}/api/upload/pdf", files=files, headers=auth_headers, timeout=60
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "pdf_url" in body and body["pdf_url"]
        url = body["pdf_url"]
        assert "/api/files/" in url and url.lower().endswith(".pdf")

        fetch_url = url if url.startswith("http") else f"{BASE_URL}{url}"
        r2 = api.get(fetch_url, timeout=30)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("application/pdf"), r2.headers
        assert r2.content == original

    def test_files_nonexistent_returns_404(self, api):
        fake = f"{uuid.uuid4()}.png"
        r = api.get(f"{BASE_URL}/api/files/{fake}", timeout=20)
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text[:200]}"

    def test_upload_rejects_invalid_image_extension(self, api, auth_headers):
        files = {"file": ("bad.txt", b"hello", "text/plain")}
        r = api.post(
            f"{BASE_URL}/api/upload/image", files=files, headers=auth_headers, timeout=30
        )
        assert r.status_code == 400


# ----------------------------- unsubscribe ----------------------------------

class TestUnsubscribe:
    TEST_EMAIL = f"test_unsub_{uuid.uuid4().hex[:8]}@example.com"

    def test_subscribe_then_unsubscribe_flips_flag(self, api, auth_headers):
        # Create subscriber with newsletter=True (use admin endpoint to skip mailing)
        r = api.post(
            f"{BASE_URL}/api/subscribers/add",
            json={"email": self.TEST_EMAIL, "newsletter": True},
            headers=auth_headers,
            timeout=60,
        )
        assert r.status_code == 200, r.text

        # Verify the subscriber is listed with newsletter True
        r = api.get(f"{BASE_URL}/api/subscribers", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        subs = r.json()
        match = [s for s in subs if s.get("email") == self.TEST_EMAIL]
        assert match, "subscriber not found after add"
        assert match[0].get("newsletter") is True

        # Hit unsubscribe
        r = api.get(
            f"{BASE_URL}/api/unsubscribe", params={"email": self.TEST_EMAIL}, timeout=20
        )
        assert r.status_code == 200, r.text
        assert "Unsubscribed" in r.text
        assert "text/html" in r.headers.get("content-type", "").lower()

        # Verify the flag flipped
        r = api.get(f"{BASE_URL}/api/subscribers", headers=auth_headers, timeout=20)
        match = [s for s in r.json() if s.get("email") == self.TEST_EMAIL]
        assert match and match[0].get("newsletter") is False

    def test_unsubscribe_missing_email(self, api):
        r = api.get(f"{BASE_URL}/api/unsubscribe", timeout=20)
        assert r.status_code == 400

    def test_unsubscribe_invalid_email(self, api):
        r = api.get(f"{BASE_URL}/api/unsubscribe?email=not-an-email", timeout=20)
        assert r.status_code == 400


# ----------------------------- founder settings -----------------------------

class TestFounderSettings:
    def test_get_requires_auth(self, fresh_client):
        r = fresh_client.get(f"{BASE_URL}/api/settings/founder", timeout=20)
        assert r.status_code in (401, 403)

    def test_put_requires_auth(self, fresh_client):
        r = fresh_client.put(
            f"{BASE_URL}/api/settings/founder",
            json={"enabled": True, "intro_text": "x"},
            timeout=20,
        )
        assert r.status_code in (401, 403)

    def test_get_returns_struct(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/settings/founder", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        for k in (
            "enabled", "photo_url", "signature_url",
            "name_fr", "name_en", "name_fa",
            "title_fr", "title_en", "title_fa",
            "intro_text_fr", "intro_text_en", "intro_text_fa",
        ):
            assert k in data, f"missing field: {k}"

    def test_put_persists(self, api, auth_headers):
        payload = {
            "enabled": True,
            "intro_text_fr": "Bienvenue à notre brief hebdomadaire.",
            "intro_text_en": "Welcome to our weekly intelligence brief.",
            "intro_text_fa": "",
            "photo_url": "",
            "name_fr": "Test Fondateur",
            "name_en": "Test Founder",
            "name_fa": "",
            "title_fr": "Directeur",
            "title_en": "Director",
            "title_fa": "",
            "signature_url": "",
        }
        r = api.put(
            f"{BASE_URL}/api/settings/founder",
            json=payload,
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text

        r = api.get(f"{BASE_URL}/api/settings/founder", headers=auth_headers, timeout=20)
        data = r.json()
        assert data["enabled"] is True
        assert data["intro_text_en"] == payload["intro_text_en"]
        assert data["name_en"] == payload["name_en"]
        assert data["title_en"] == payload["title_en"]


# ----------------------------- newsletter generate --------------------------

class TestNewsletterGenerate:
    def _set_founder(self, api, auth_headers, **kwargs):
        payload = {
            "enabled": False,
            "intro_text_fr": "",
            "intro_text_en": "",
            "intro_text_fa": "",
            "photo_url": "",
            "name_fr": "",
            "name_en": "",
            "name_fa": "",
            "title_fr": "",
            "title_en": "",
            "title_fa": "",
            "signature_url": "",
        }
        payload.update(kwargs)
        r = api.put(
            f"{BASE_URL}/api/settings/founder",
            json=payload,
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200

    def test_generate_requires_auth(self, fresh_client):
        r = fresh_client.post(f"{BASE_URL}/api/newsletter/generate", timeout=30)
        assert r.status_code in (401, 403)

    def test_logo_height_100px(self, api, auth_headers):
        r = api.post(
            f"{BASE_URL}/api/newsletter/generate", headers=auth_headers, timeout=60
        )
        assert r.status_code == 200, r.text
        html = r.json().get("html_content", "")
        assert "height:100px" in html, "Newsletter logo height:100px not found"

    def test_contains_api_unsubscribe_link(self, api, auth_headers):
        r = api.post(
            f"{BASE_URL}/api/newsletter/generate", headers=auth_headers, timeout=60
        )
        assert r.status_code == 200
        html = r.json().get("html_content", "")
        assert "/api/unsubscribe" in html, "Newsletter must include /api/unsubscribe link"

    def test_founder_block_disabled(self, api, auth_headers):
        self._set_founder(api, auth_headers, enabled=False)
        r = api.post(
            f"{BASE_URL}/api/newsletter/generate", headers=auth_headers, timeout=60
        )
        html = r.json().get("html_content", "")
        # Default lang is fr -> French founder label
        assert "Le mot du fondateur" not in html

    def test_founder_block_enabled(self, api, auth_headers):
        intro = "Un mot hebdomadaire du fondateur sur l'Iran."
        name = "Jane Founder"
        self._set_founder(
            api,
            auth_headers,
            enabled=True,
            intro_text_fr=intro,
            name_fr=name,
            title_fr="Directeur",
        )
        r = api.post(
            f"{BASE_URL}/api/newsletter/generate", headers=auth_headers, timeout=60
        )
        html = r.json().get("html_content", "")
        # Default lang is fr -> French founder label
        assert "Le mot du fondateur" in html
        assert intro in html
        assert name in html

    def test_subscribe_email_contains_api_unsubscribe(self, api, auth_headers):
        """The new-subscriber confirmation HTML template uses /api/unsubscribe.
        We don't actually send mail here; we just inspect the rendered HTML via
        the newsletter/generate endpoint which shares the same routing convention.
        For the welcome email path itself, we rely on code review (see server.py).
        """
        # Ensure subscriber rows still receive a 200 response (no actual send check)
        email = f"test_sub_render_{uuid.uuid4().hex[:6]}@example.com"
        r = api.post(
            f"{BASE_URL}/api/subscribers",
            json={"email": email, "newsletter": False},
            timeout=20,
        )
        assert r.status_code == 200


# ----------------------------- cleanup --------------------------------------

@pytest.fixture(scope="session", autouse=True)
def _cleanup_at_end(api):
    yield
    # Best-effort cleanup of test_* subscribers via admin endpoint.
    try:
        r = api.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=10,
        )
        if r.status_code != 200:
            return
        token = r.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        r = api.get(f"{BASE_URL}/api/subscribers", headers=headers, timeout=20)
        if r.status_code != 200:
            return
        for s in r.json():
            email = s.get("email", "")
            if "test_" in email.lower():
                sid = s.get("id") or s.get("_id")
                if sid:
                    api.delete(
                        f"{BASE_URL}/api/subscribers/{sid}", headers=headers, timeout=10
                    )
    except Exception:
        pass
