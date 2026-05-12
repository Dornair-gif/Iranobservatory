"""
Multilingual newsletter tests for Iran Observatory.

Covers:
  - POST /api/subscribers — public signup with language field (default 'fr')
  - POST /api/subscribers — existing subscriber language update
  - POST /api/subscribers/add — admin add with language validation
  - PATCH /api/subscribers/{id} — language/newsletter updates, 400 on invalid
  - GET /api/subscribers — includes 'language' field (default 'fr')
  - GET /api/settings/founder — per-language shape + legacy fallback
  - PUT /api/settings/founder — saves all per-language fields
  - POST /api/newsletter/generate?lang=fr|en|fa — localized HTML
  - POST /api/newsletter/send-multilingual — segmented dispatch
"""

import os
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://iran-events-live.preview.emergentagent.com"
).rstrip("/")
ADMIN_EMAIL = "admin@iranobservatory.org"
ADMIN_PASSWORD = "IranObs2024!"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


# ----------------------------- fixtures -------------------------------------

@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    r = s.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=60,
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code}")
    s.headers.update({"Authorization": f"Bearer {r.json()['access_token']}"})
    return s


@pytest.fixture(scope="module")
def fresh():
    return requests.Session()


@pytest.fixture(scope="module")
def mongo():
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


@pytest.fixture(scope="module", autouse=True)
def _cleanup_test_subscribers(mongo):
    yield
    try:
        mongo.subscribers.delete_many({"email": {"$regex": "^test_ml_"}})
    except Exception:
        pass


# ----------------------------- subscribers ----------------------------------

class TestSubscribers:
    def test_public_signup_default_language_fr(self, fresh, api):
        email = f"test_ml_default_{uuid.uuid4().hex[:6]}@example.com"
        r = fresh.post(
            f"{BASE_URL}/api/subscribers",
            json={"email": email, "newsletter": False},
            timeout=20,
        )
        assert r.status_code == 200, r.text

        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        match = [s for s in subs if s["email"] == email]
        assert match, "subscriber not persisted"
        assert match[0]["language"] == "fr", f"expected fr default, got {match[0]['language']}"

    def test_public_signup_explicit_language_en(self, fresh, api):
        email = f"test_ml_en_{uuid.uuid4().hex[:6]}@example.com"
        r = fresh.post(
            f"{BASE_URL}/api/subscribers",
            json={"email": email, "newsletter": False, "language": "en"},
            timeout=20,
        )
        assert r.status_code == 200

        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        match = [s for s in subs if s["email"] == email]
        assert match and match[0]["language"] == "en"

    def test_public_signup_updates_language_on_existing(self, fresh, api):
        email = f"test_ml_upd_{uuid.uuid4().hex[:6]}@example.com"
        # Create as fr
        fresh.post(
            f"{BASE_URL}/api/subscribers",
            json={"email": email, "newsletter": False, "language": "fr"},
            timeout=20,
        )
        # Update to fa
        r = fresh.post(
            f"{BASE_URL}/api/subscribers",
            json={"email": email, "newsletter": False, "language": "fa"},
            timeout=20,
        )
        assert r.status_code == 200
        body = r.json()
        assert body.get("already_subscribed") is True

        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        match = [s for s in subs if s["email"] == email]
        assert match and match[0]["language"] == "fa", f"got {match[0]['language']}"

    def test_admin_add_with_language(self, api):
        email = f"test_ml_admin_{uuid.uuid4().hex[:6]}@example.com"
        r = api.post(
            f"{BASE_URL}/api/subscribers/add",
            json={"email": email, "newsletter": True, "language": "en"},
            timeout=20,
        )
        assert r.status_code == 200

        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        match = [s for s in subs if s["email"] == email]
        assert match and match[0]["language"] == "en"
        assert match[0]["newsletter"] is True

    def test_admin_add_default_language_fr(self, api):
        email = f"test_ml_admin_def_{uuid.uuid4().hex[:6]}@example.com"
        r = api.post(
            f"{BASE_URL}/api/subscribers/add",
            json={"email": email, "newsletter": True},
            timeout=20,
        )
        assert r.status_code == 200
        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        match = [s for s in subs if s["email"] == email]
        assert match and match[0]["language"] == "fr"

    def test_patch_subscriber_language(self, api):
        email = f"test_ml_patch_{uuid.uuid4().hex[:6]}@example.com"
        api.post(
            f"{BASE_URL}/api/subscribers/add",
            json={"email": email, "newsletter": True, "language": "fr"},
            timeout=20,
        )
        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        sid = [s["id"] for s in subs if s["email"] == email][0]

        r = api.patch(
            f"{BASE_URL}/api/subscribers/{sid}",
            json={"language": "fa"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("language") == "fa"

        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        match = [s for s in subs if s["email"] == email]
        assert match and match[0]["language"] == "fa"

    def test_patch_subscriber_invalid_language_rejected(self, api):
        email = f"test_ml_bad_{uuid.uuid4().hex[:6]}@example.com"
        api.post(
            f"{BASE_URL}/api/subscribers/add",
            json={"email": email, "newsletter": True, "language": "fr"},
            timeout=20,
        )
        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        sid = [s["id"] for s in subs if s["email"] == email][0]

        r = api.patch(
            f"{BASE_URL}/api/subscribers/{sid}",
            json={"language": "es"},
            timeout=20,
        )
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text[:200]}"

    def test_patch_newsletter_flag(self, api):
        email = f"test_ml_nl_{uuid.uuid4().hex[:6]}@example.com"
        api.post(
            f"{BASE_URL}/api/subscribers/add",
            json={"email": email, "newsletter": True, "language": "fr"},
            timeout=20,
        )
        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        sid = [s["id"] for s in subs if s["email"] == email][0]

        r = api.patch(
            f"{BASE_URL}/api/subscribers/{sid}",
            json={"newsletter": False},
            timeout=20,
        )
        assert r.status_code == 200

        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        match = [s for s in subs if s["email"] == email]
        assert match and match[0]["newsletter"] is False

    def test_get_subscribers_always_includes_language(self, api, mongo):
        # Insert legacy subscriber directly (no language field)
        legacy_email = f"test_ml_legacy_get_{uuid.uuid4().hex[:6]}@example.com"
        mongo.subscribers.insert_one({
            "email": legacy_email,
            "newsletter": True,
            "downloads": [],
        })

        subs = api.get(f"{BASE_URL}/api/subscribers", timeout=20).json()
        for s in subs:
            assert "language" in s, f"missing language for {s.get('email')}"
        match = [s for s in subs if s["email"] == legacy_email]
        assert match and match[0]["language"] == "fr"


# ----------------------------- founder per-language -------------------------

class TestFounderMultilingual:
    def test_get_returns_per_language_shape(self, api):
        r = api.get(f"{BASE_URL}/api/settings/founder", timeout=20)
        assert r.status_code == 200
        data = r.json()
        for k in (
            "enabled", "photo_url", "signature_url",
            "name_fr", "name_en", "name_fa",
            "title_fr", "title_en", "title_fa",
            "intro_text_fr", "intro_text_en", "intro_text_fa",
        ):
            assert k in data, f"missing {k}"

    def test_put_persists_all_lang_fields(self, api):
        payload = {
            "enabled": True,
            "photo_url": "https://example.com/p.png",
            "signature_url": "https://example.com/s.png",
            "name_fr": "Jean Fondateur",
            "name_en": "John Founder",
            "name_fa": "جان بنیان‌گذار",
            "title_fr": "Directeur",
            "title_en": "Director",
            "title_fa": "مدیر",
            "intro_text_fr": "Bonjour chers lecteurs francophones.",
            "intro_text_en": "Hello dear English readers.",
            "intro_text_fa": "سلام خوانندگان عزیز.",
        }
        r = api.put(f"{BASE_URL}/api/settings/founder", json=payload, timeout=20)
        assert r.status_code == 200, r.text

        data = api.get(f"{BASE_URL}/api/settings/founder", timeout=20).json()
        for k, v in payload.items():
            assert data[k] == v, f"{k}: expected {v!r}, got {data[k]!r}"

    def test_put_empty_body_saves_empty_strings(self, api):
        r = api.put(f"{BASE_URL}/api/settings/founder", json={}, timeout=20)
        assert r.status_code == 200, r.text

        data = api.get(f"{BASE_URL}/api/settings/founder", timeout=20).json()
        assert data["enabled"] is False
        for k in ("name_fr", "name_en", "name_fa", "intro_text_fr", "intro_text_en", "intro_text_fa"):
            assert data[k] == "", f"{k} should be empty, got {data[k]!r}"

    def test_legacy_fallback_to_fr_and_en(self, api, mongo):
        # Wipe and write legacy-shape doc
        mongo.settings.update_one(
            {"key": "founder_intro"},
            {"$set": {
                "key": "founder_intro",
                "enabled": True,
                "name": "Legacy Name",
                "title": "Legacy Title",
                "intro_text": "Legacy intro paragraph.",
                "photo_url": "",
                "signature_url": "",
            }, "$unset": {
                "name_fr": "", "name_en": "", "name_fa": "",
                "title_fr": "", "title_en": "", "title_fa": "",
                "intro_text_fr": "", "intro_text_en": "", "intro_text_fa": "",
            }},
            upsert=True,
        )
        data = api.get(f"{BASE_URL}/api/settings/founder", timeout=20).json()
        assert data["name_fr"] == "Legacy Name"
        assert data["name_en"] == "Legacy Name"
        assert data["title_fr"] == "Legacy Title"
        assert data["title_en"] == "Legacy Title"
        assert data["intro_text_fr"] == "Legacy intro paragraph."
        assert data["intro_text_en"] == "Legacy intro paragraph."
        # fa stays empty
        assert data["name_fa"] == ""


# ----------------------------- newsletter generate per-lang -----------------

class TestNewsletterGenerateLang:
    @pytest.fixture(autouse=True)
    def _setup_founder(self, api):
        # Set per-lang founder with fa missing to test fallback
        api.put(
            f"{BASE_URL}/api/settings/founder",
            json={
                "enabled": True,
                "photo_url": "",
                "signature_url": "",
                "name_fr": "Jean Test",
                "name_en": "John Test",
                "name_fa": "",
                "title_fr": "Directeur Test",
                "title_en": "Test Director",
                "title_fa": "",
                "intro_text_fr": "Mot du fondateur français.",
                "intro_text_en": "English founder note.",
                "intro_text_fa": "",
            },
            timeout=20,
        )

    def test_generate_fr(self, api):
        r = api.post(f"{BASE_URL}/api/newsletter/generate?lang=fr", timeout=60)
        assert r.status_code == 200, r.text
        html = r.json()["html_content"]
        assert "Newsletter hebdomadaire" in html
        assert "Brief hebdomadaire" in html
        assert "Le mot du fondateur" in html
        assert "/api/unsubscribe" in html
        assert 'dir="ltr"' in html
        assert "height:100px" in html
        assert "Mot du fondateur français." in html

    def test_generate_en(self, api):
        r = api.post(f"{BASE_URL}/api/newsletter/generate?lang=en", timeout=60)
        assert r.status_code == 200
        html = r.json()["html_content"]
        assert "Weekly Newsletter" in html
        assert "Weekly Brief" in html
        assert "A note from the founder" in html
        assert 'dir="ltr"' in html
        assert "English founder note." in html

    def test_generate_fa(self, api):
        r = api.post(f"{BASE_URL}/api/newsletter/generate?lang=fa", timeout=60)
        assert r.status_code == 200
        html = r.json()["html_content"]
        assert 'dir="rtl"' in html
        assert "بریف هفتگی" in html
        assert "یادداشت بنیان\u200cگذار" in html

    def test_fa_intro_fallback_to_fr(self, api):
        # intro_text_fa is empty; _pick_field should fallback to fr first
        r = api.post(f"{BASE_URL}/api/newsletter/generate?lang=fa", timeout=60)
        assert r.status_code == 200
        html = r.json()["html_content"]
        # FR intro should appear as fallback
        assert "Mot du fondateur français." in html, "fa should fall back to fr intro_text"

    def test_generate_default_lang_is_fr(self, api):
        r = api.post(f"{BASE_URL}/api/newsletter/generate", timeout=60)
        assert r.status_code == 200
        html = r.json()["html_content"]
        assert "Newsletter hebdomadaire" in html


# ----------------------------- send-multilingual ----------------------------

class TestSendMultilingual:
    def test_send_multilingual_segments_correctly(self, api, mongo):
        # Seed 3 test subscribers + 1 legacy (no language)
        emails = {
            "fr": f"test_ml_send_fr_{uuid.uuid4().hex[:4]}@example.com",
            "en": f"test_ml_send_en_{uuid.uuid4().hex[:4]}@example.com",
            "fa": f"test_ml_send_fa_{uuid.uuid4().hex[:4]}@example.com",
        }
        legacy_email = f"test_ml_send_legacy_{uuid.uuid4().hex[:4]}@example.com"

        for lang, email in emails.items():
            api.post(
                f"{BASE_URL}/api/subscribers/add",
                json={"email": email, "newsletter": True, "language": lang},
                timeout=20,
            )
        # Insert legacy subscriber (no language field) directly via pymongo
        mongo.subscribers.insert_one({
            "email": legacy_email,
            "newsletter": True,
            "downloads": [],
        })

        # Call send-multilingual
        r = api.post(f"{BASE_URL}/api/newsletter/send-multilingual", timeout=180)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "status" in body
        assert "total_sent" in body
        assert "by_language" in body
        bl = body["by_language"]
        for lang in ("fr", "en", "fa"):
            assert lang in bl
            assert "total" in bl[lang]
            assert "sent" in bl[lang]

        # FR segment must include our fr test sub + legacy sub -> total >= 2
        assert bl["fr"]["total"] >= 2, f"fr total should include legacy, got {bl['fr']}"
        # EN segment must include en sub
        assert bl["en"]["total"] >= 1, f"en total: {bl['en']}"
        # FA segment must include fa sub
        assert bl["fa"]["total"] >= 1, f"fa total: {bl['fa']}"
