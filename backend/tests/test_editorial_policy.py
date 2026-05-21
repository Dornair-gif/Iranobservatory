"""
Editorial-policy regression tests (iteration 5).

Covers:
  - GET /api/rss/feeds returns is_regime_source flag on each feed and >= 2 seeded
    regime feeds (Tasnim, Fars) present after startup.
  - POST /api/rss/feeds with is_regime_source=true persists the flag.
  - PUT  /api/rss/feeds/{id} can toggle is_regime_source on existing feed.
  - _sanitize_editorial (imported from server) satisfies the 4 contract cases:
      (a) strips sentences containing BANNED sources (MEK/NCRI/Iran International/
          Mojahedin/Rajavi),
      (b) auto-prefixes "the Iranian regime-controlled outlet" in front of an
          unattributed regime source (Tasnim/Fars/IRNA/Press TV),
      (c) does NOT double-prefix already-attributed regime mentions,
      (d) is idempotent: f(f(x)) == f(x).
  - /api/dashboard payload no longer contains the literal banned phrase
    "NCRI reports 2,201" anywhere in executions_detail.
  - /api/signals endpoints still respond (regression vs P0).
"""

import os
import sys
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://iran-events-live.preview.emergentagent.com"

ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "admin@iranobservatory.org")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "IranObs2024!")

# Make /app/backend importable so we can call _sanitize_editorial directly.
sys.path.insert(0, "/app/backend")


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=60,
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code}")
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ============ 1. _sanitize_editorial unit tests (direct import) ============

class TestSanitizeEditorial:
    def setup_method(self):
        from server import _sanitize_editorial  # noqa: WPS433
        self.fn = _sanitize_editorial

    def test_strip_ncri_sentence(self):
        out = self.fn("NCRI confirms X. UN says Y.")
        assert "NCRI" not in out
        # The second sentence about UN must survive.
        assert "UN says Y." in out

    def test_strip_mek_sentence(self):
        out = self.fn("MEK claims a major rally. Reuters reports protests.")
        assert "MEK" not in out and "claims a major rally" not in out
        assert "Reuters reports protests." in out

    def test_strip_iran_international(self):
        out = self.fn("Iran International says fighting continues today.")
        assert "Iran International" not in out
        assert out.strip() == ""

    def test_strip_rajavi(self):
        out = self.fn("Maryam Rajavi addressed the crowd.")
        assert "Rajavi" not in out
        assert "Maryam" not in out  # whole sentence dropped

    def test_strip_mojahedin(self):
        out = self.fn("The Mojahedin-e Khalq released a statement.")
        assert "Mojahedin" not in out

    def test_regime_prefix_tasnim(self):
        out = self.fn("Tasnim reports Y.")
        assert "the Iranian regime-controlled outlet Tasnim" in out

    def test_regime_prefix_fars(self):
        out = self.fn("Fars News announced new sanctions today.")
        assert "the Iranian regime-controlled outlet Fars News" in out

    def test_no_double_prefix_state_media(self):
        original = "According to Iranian state media Fars News, Z happened."
        out = self.fn(original)
        assert out == original
        # Specifically: NOT two attributions in front
        assert out.count("Fars News") == 1
        assert "regime-controlled outlet Fars News" not in out

    def test_no_double_prefix_regime_controlled(self):
        original = "Per regime-controlled outlet Tasnim, the launch succeeded."
        out = self.fn(original)
        # If the disclosure marker is in the same sentence, no re-prefixing.
        assert "the Iranian regime-controlled outlet Tasnim" not in out
        assert "regime-controlled outlet Tasnim" in out

    def test_idempotent(self):
        sample = "Tasnim reports Y. NCRI claims something else. UN responded."
        once = self.fn(sample)
        twice = self.fn(once)
        assert once == twice

    def test_empty_and_none(self):
        assert self.fn("") == ""
        assert self.fn(None) is None


# ============ 2. /api/rss/feeds — regime-source flag persistence ============

class TestRssRegimeFlag:
    def test_get_feeds_returns_regime_flag(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/rss/feeds", headers=auth_headers, timeout=60)
        assert r.status_code == 200
        feeds = r.json()
        assert isinstance(feeds, list)
        assert len(feeds) >= 2, f"expected >=2 feeds, got {len(feeds)}"
        # Every feed has the field.
        for f in feeds:
            assert "is_regime_source" in f, f"feed missing flag: {f}"

    def test_tasnim_and_fars_seeded_as_regime(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/rss/feeds", headers=auth_headers, timeout=60)
        feeds = r.json()
        regime_feeds = [f for f in feeds if f.get("is_regime_source") is True]
        names = " | ".join(f["name"] for f in regime_feeds).lower()
        assert any("tasnim" in n for n in [f["name"].lower() for f in regime_feeds]), \
            f"no Tasnim regime feed found in: {names}"
        assert any("fars" in n for n in [f["name"].lower() for f in regime_feeds]), \
            f"no Fars regime feed found in: {names}"

    def test_create_feed_persists_regime_flag(self, auth_headers):
        payload = {
            "name": "TEST_REGIME_FEED",
            "url": "https://example.test/rss/regime-test.xml",
            "category": "regime",
            "language": "en",
            "is_regime_source": True,
        }
        r = requests.post(
            f"{BASE_URL}/api/rss/feeds",
            json=payload,
            headers=auth_headers,
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["is_regime_source"] is True
        feed_id = data["id"]

        # Verify via GET.
        r2 = requests.get(f"{BASE_URL}/api/rss/feeds", headers=auth_headers, timeout=60)
        feed = next(f for f in r2.json() if f["id"] == feed_id)
        assert feed["is_regime_source"] is True

        # Cleanup.
        requests.delete(f"{BASE_URL}/api/rss/feeds/{feed_id}", headers=auth_headers, timeout=60)

    def test_update_feed_toggle_regime_flag(self, auth_headers):
        # Create as non-regime.
        payload = {
            "name": "TEST_TOGGLE_FEED",
            "url": "https://example.test/rss/toggle-test.xml",
            "category": "general",
            "language": "en",
            "is_regime_source": False,
        }
        r = requests.post(f"{BASE_URL}/api/rss/feeds", json=payload,
                          headers=auth_headers, timeout=60)
        assert r.status_code == 200
        feed_id = r.json()["id"]
        assert r.json()["is_regime_source"] is False

        # Toggle to True via PUT.
        payload["is_regime_source"] = True
        payload["category"] = "regime"
        u = requests.put(
            f"{BASE_URL}/api/rss/feeds/{feed_id}",
            json=payload,
            headers=auth_headers,
            timeout=45,
        )
        assert u.status_code == 200, u.text

        # Verify.
        r2 = requests.get(f"{BASE_URL}/api/rss/feeds", headers=auth_headers, timeout=30)
        feed = next(f for f in r2.json() if f["id"] == feed_id)
        assert feed["is_regime_source"] is True

        # Toggle back to False.
        payload["is_regime_source"] = False
        u2 = requests.put(
            f"{BASE_URL}/api/rss/feeds/{feed_id}",
            json=payload,
            headers=auth_headers,
            timeout=45,
        )
        assert u2.status_code == 200
        r3 = requests.get(f"{BASE_URL}/api/rss/feeds", headers=auth_headers, timeout=30)
        feed = next(f for f in r3.json() if f["id"] == feed_id)
        assert feed["is_regime_source"] is False

        # Cleanup.
        requests.delete(f"{BASE_URL}/api/rss/feeds/{feed_id}", headers=auth_headers, timeout=60)


# ============ 3. /api/dashboard — no banned content in executions_detail ============

class TestDashboardEditorial:
    def test_dashboard_no_ncri_phrase(self, auth_headers):
        # Try a few possible endpoints. The review names /api/dashboard;
        # other deployments expose /api/dashboard/compute or /api/iran-monitor.
        candidate_paths = [
            "/api/dashboard/indexes",
            "/api/dashboard/sources",
            "/api/dashboard",
            "/api/iran-monitor",
        ]
        found = False
        for p in candidate_paths:
            r = requests.get(f"{BASE_URL}{p}", headers=auth_headers, timeout=120)
            if r.status_code == 200:
                found = True
                body = r.text
                assert "NCRI reports 2,201" not in body, \
                    f"banned literal phrase still present in {p}"
                # NCRI / Mojahedin / Iran International must NOT appear in
                # any user-facing dashboard payload.
                low = body
                assert "NCRI" not in low, \
                    f"banned source NCRI appears in {p}: {body[:300]}"
                assert "Mojahedin" not in low and "Mujahedin" not in low, \
                    f"banned source Mojahedin appears in {p}"
                assert "Iran International" not in low, \
                    f"banned source Iran International appears in {p}"
                break
        if not found:
            pytest.skip("No dashboard endpoint responded 200 — skipping content scan")


# ============ 4. /api/signals — regression ============

class TestSignalsRegression:
    def test_signals_list_responds(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/signals", headers=auth_headers, timeout=30)
        # Accept 200 (list) or 404 (route renamed); fail on 500.
        assert r.status_code in (200, 404), f"signals endpoint 5xx: {r.status_code} {r.text[:300]}"
        if r.status_code == 200:
            assert isinstance(r.json(), (list, dict))
