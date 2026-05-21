"""
SEO overhaul backend regression tests (Iran Observatory).

Covers review items:
  1.  POST /api/admin/backfill-slugs (idempotent)
  2.  GET  /api/articles/{slug}  (slug lookup) + 404 unknown
  3.  GET  /api/articles/{objectid} (backward compat)
  4.  POST /api/articles -> auto-slug from title_en
  5.  PUT  /api/articles/{id} status change preserves slug
  6.  PUT  /api/articles/{id} with explicit slug -> sanitized + unique
  7.  POST /api/articles/{id}/seo/generate (GPT-5.2)
  8.  GET  /api/articles/{id}/seo/score
  9.  GET  /api/articles/{id}/related
  10. GET  /api/categories
  11. GET  /api/tags
  12. GET  /api/articles/by-category/{slug}
  13. GET  /api/articles/by-tag/{slug}
  14. POST /api/seo/suggest-angles
  15. GET  /api/sitemap.xml
  16. GET  /api/news-sitemap.xml
  17. Regression: list/upload/unsubscribe/founder/subscribers/newsletter
"""
import os
import re
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://iran-events-live.preview.emergentagent.com"

ADMIN_EMAIL = "admin@iranobservatory.org"
ADMIN_PASSWORD = "IranObs2024!"

TEST_TITLE_PREFIX = "TEST SEO"


# --------------------------- fixtures ---------------------------------------

@pytest.fixture(scope="module")
def api():
    return requests.Session()


@pytest.fixture(scope="module")
def auth_headers(api):
    r = api.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=60,
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def created_article_ids(api, auth_headers):
    """Track articles created during this test module for cleanup."""
    ids = []
    yield ids
    # teardown: delete each article
    for aid in ids:
        try:
            api.delete(f"{BASE_URL}/api/articles/{aid}", headers=auth_headers, timeout=15)
        except Exception:
            pass


def _create_article(api, auth_headers, created_article_ids, **overrides):
    suffix = uuid.uuid4().hex[:6]
    payload = {
        "title_en": f"{TEST_TITLE_PREFIX} Iran Sanctions Update {suffix}",
        "title_fr": f"{TEST_TITLE_PREFIX} Sanctions contre l'Iran {suffix}",
        "title_fa": f"{TEST_TITLE_PREFIX} تحریم‌های ایران {suffix}",
        "content_en": "Iran sanctions analysis. " * 80,
        "content_fr": "Analyse des sanctions iraniennes. " * 80,
        "content_fa": "تحلیل تحریم‌های ایران. " * 40,
        "summary_en": "A long summary about Iran sanctions and their effects on the economy.",
        "summary_fr": "Un long résumé sur les sanctions iraniennes et leurs effets sur l'économie.",
        "summary_fa": "خلاصه‌ای درباره تحریم‌ها.",
        "tags": ["iran", "sanctions", "economy"],
        "category": "analysis",
        "content_type": "analysis",
    }
    payload.update(overrides)
    r = api.post(f"{BASE_URL}/api/articles", json=payload, headers=auth_headers, timeout=30)
    assert r.status_code == 200, f"create failed: {r.status_code} {r.text[:300]}"
    body = r.json()
    aid = body["id"]
    created_article_ids.append(aid)
    return body


# --------------------------- 1. backfill-slugs ------------------------------

class TestBackfillSlugs:
    def test_backfill_endpoint(self, api, auth_headers):
        r = api.post(
            f"{BASE_URL}/api/admin/backfill-slugs", headers=auth_headers, timeout=60
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "updated_count" in body
        assert isinstance(body["updated_count"], int)

    def test_backfill_idempotent(self, api, auth_headers):
        # second run should report 0 updates (everything already has a slug)
        r = api.post(
            f"{BASE_URL}/api/admin/backfill-slugs", headers=auth_headers, timeout=60
        )
        assert r.status_code == 200
        assert r.json()["updated_count"] == 0

    def test_backfill_requires_auth(self, api):
        r = requests.post(f"{BASE_URL}/api/admin/backfill-slugs", timeout=20)
        assert r.status_code in (401, 403)


# --------------------------- 2/3. slug + objectid lookup --------------------

class TestArticleLookup:
    def test_slug_lookup_existing(self, api):
        # weekly brief slug created by main agent
        r = api.get(f"{BASE_URL}/api/articles/weekly-brief-april-29-may-06-2026", timeout=20)
        # If main-agent's seeded slug isn't present, fall back to picking any
        if r.status_code == 404:
            lst = api.get(f"{BASE_URL}/api/articles", timeout=20).json()
            assert lst, "no published articles to test slug lookup"
            slug = next((a.get("slug") for a in lst if a.get("slug")), None)
            assert slug, "no slugged article available"
            r = api.get(f"{BASE_URL}/api/articles/{slug}", timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("slug")
        assert body["id"]

    def test_slug_lookup_404(self, api):
        r = api.get(
            f"{BASE_URL}/api/articles/this-slug-does-not-exist-{uuid.uuid4().hex[:6]}",
            timeout=20,
        )
        assert r.status_code == 404

    def test_objectid_backward_compat(self, api):
        lst = api.get(f"{BASE_URL}/api/articles", timeout=20).json()
        target = next((a for a in lst if a.get("slug")), None)
        assert target, "need an article with slug"
        oid = target["id"]
        r = api.get(f"{BASE_URL}/api/articles/{oid}", timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["id"] == oid
        assert body.get("slug") == target.get("slug")


# --------------------------- 4. create -> auto-slug -------------------------

class TestCreateAutoSlug:
    def test_create_auto_slug(self, api, auth_headers, created_article_ids):
        body = _create_article(api, auth_headers, created_article_ids)
        assert body.get("slug"), f"slug not returned: {body}"
        assert re.match(r"^[a-z0-9-]+$", body["slug"]), f"bad slug: {body['slug']}"
        assert "test-seo" in body["slug"]

    def test_auto_slug_uniqueness(self, api, auth_headers, created_article_ids):
        # Force the same title to test uniqueness suffix
        title = f"{TEST_TITLE_PREFIX} Dup Title {uuid.uuid4().hex[:6]}"
        a = _create_article(api, auth_headers, created_article_ids, title_en=title)
        b = _create_article(api, auth_headers, created_article_ids, title_en=title)
        assert a["slug"] != b["slug"], "duplicate slugs not de-duped"
        assert b["slug"].endswith("-2") or b["slug"] != a["slug"]


# --------------------------- 5. PUT preserves slug --------------------------

class TestUpdatePreservesSlug:
    def test_status_change_preserves_slug(self, api, auth_headers, created_article_ids):
        body = _create_article(api, auth_headers, created_article_ids)
        aid = body["id"]
        original_slug = body["slug"]
        # change only status
        r = api.put(
            f"{BASE_URL}/api/articles/{aid}",
            json={"status": "published"},
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        fetched = api.get(f"{BASE_URL}/api/articles/{aid}", timeout=20).json()
        assert fetched["slug"] == original_slug, "slug was wiped on status change"
        assert fetched["status"] == "published"

    def test_explicit_slug_sanitized(self, api, auth_headers, created_article_ids):
        body = _create_article(api, auth_headers, created_article_ids)
        aid = body["id"]
        dirty = "  Custom Slug! With $pecial Chars!! "
        r = api.put(
            f"{BASE_URL}/api/articles/{aid}",
            json={"slug": dirty},
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        fetched = api.get(f"{BASE_URL}/api/articles/{aid}", timeout=20).json()
        new_slug = fetched["slug"]
        assert re.match(r"^[a-z0-9-]+$", new_slug), f"slug not sanitized: {new_slug}"
        assert "custom" in new_slug and "slug" in new_slug


# --------------------------- 7. SEO generate (AI) --------------------------

class TestSEOGenerate:
    @pytest.mark.timeout(120)
    def test_generate_seo_meta(self, api, auth_headers, created_article_ids):
        body = _create_article(api, auth_headers, created_article_ids)
        aid = body["id"]
        r = api.post(
            f"{BASE_URL}/api/articles/{aid}/seo/generate",
            headers=auth_headers,
            timeout=120,
        )
        assert r.status_code == 200, f"{r.status_code} {r.text[:400]}"
        out = r.json()
        # Should populate all three langs
        for lang in ("en", "fr", "fa"):
            stitle = out.get(f"seo_title_{lang}") or ""
            mdesc = out.get(f"meta_description_{lang}") or ""
            assert stitle, f"missing seo_title_{lang}"
            assert mdesc, f"missing meta_description_{lang}"
            assert len(stitle) <= 70, f"seo_title_{lang} too long: {len(stitle)}"
            assert len(mdesc) <= 180, f"meta_description_{lang} too long: {len(mdesc)}"
        # focus_keywords array
        kws = out.get("focus_keywords")
        assert isinstance(kws, list) and len(kws) >= 1, f"focus_keywords missing: {kws}"

        # Verify persisted
        fetched = api.get(f"{BASE_URL}/api/articles/{aid}", timeout=20).json()
        assert fetched.get("seo_title_en"), "seo_title_en not persisted"
        assert fetched.get("meta_description_fr"), "meta_description_fr not persisted"
        assert fetched.get("focus_keywords")


# --------------------------- 8. SEO score ----------------------------------

class TestSEOScore:
    def test_score_returns_shape(self, api, auth_headers, created_article_ids):
        body = _create_article(api, auth_headers, created_article_ids)
        aid = body["id"]
        r = api.get(
            f"{BASE_URL}/api/articles/{aid}/seo/score",
            headers=auth_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        out = r.json()
        assert out["max"] == 100
        assert isinstance(out["score"], int)
        assert 0 <= out["score"] <= 100
        assert isinstance(out["checks"], list) and len(out["checks"]) >= 5
        for c in out["checks"]:
            assert "label" in c and "passed" in c and "weight" in c and "hint" in c
            assert isinstance(c["passed"], bool)
            assert isinstance(c["weight"], int)


# --------------------------- 9. related ------------------------------------

class TestRelated:
    def test_related_excludes_self(self, api, auth_headers, created_article_ids):
        body = _create_article(api, auth_headers, created_article_ids)
        # publish so it can match published filter for relatives
        api.put(
            f"{BASE_URL}/api/articles/{body['id']}",
            json={"status": "published"},
            headers=auth_headers,
            timeout=20,
        )
        r = api.get(
            f"{BASE_URL}/api/articles/{body['id']}/related?limit=4", timeout=20
        )
        assert r.status_code == 200, r.text
        rel = r.json()
        assert isinstance(rel, list)
        assert len(rel) <= 4
        assert all(a["id"] != body["id"] for a in rel)


# --------------------------- 10/11. categories + tags ----------------------

class TestCategoriesAndTags:
    def test_categories(self, api):
        r = api.get(f"{BASE_URL}/api/categories", timeout=20)
        assert r.status_code == 200
        out = r.json()
        assert isinstance(out, list)
        if out:
            assert "slug" in out[0] and "count" in out[0]
            assert isinstance(out[0]["count"], int) and out[0]["count"] >= 1

    def test_tags(self, api):
        r = api.get(f"{BASE_URL}/api/tags", timeout=20)
        assert r.status_code == 200
        out = r.json()
        assert isinstance(out, list)
        assert len(out) <= 100
        if out:
            assert "slug" in out[0] and "name" in out[0] and "count" in out[0]


# --------------------------- 12/13. articles-by-X --------------------------

class TestArticlesByHub:
    def test_articles_by_category(self, api):
        cats = api.get(f"{BASE_URL}/api/categories", timeout=20).json()
        if not cats:
            pytest.skip("no categories present")
        cslug = cats[0]["slug"]
        r = api.get(f"{BASE_URL}/api/articles/by-category/{cslug}", timeout=20)
        assert r.status_code == 200
        arts = r.json()
        assert isinstance(arts, list)
        for a in arts:
            assert a["status"] == "published"
            assert a.get("category") == cslug

    def test_articles_by_tag(self, api):
        tags = api.get(f"{BASE_URL}/api/tags", timeout=20).json()
        if not tags:
            pytest.skip("no tags present")
        tslug = tags[0]["slug"]
        r = api.get(f"{BASE_URL}/api/articles/by-tag/{tslug}", timeout=20)
        assert r.status_code == 200
        arts = r.json()
        assert isinstance(arts, list)
        # Each returned article must have status published and slug matches a tag
        for a in arts:
            assert a["status"] == "published"

    def test_articles_by_tag_unknown(self, api):
        r = api.get(f"{BASE_URL}/api/articles/by-tag/no-such-tag-xyz-12345", timeout=20)
        assert r.status_code == 200
        assert r.json() == []


# --------------------------- 14. suggest-angles (AI) -----------------------

class TestSuggestAngles:
    @pytest.mark.timeout(120)
    def test_suggest_angles(self, api, auth_headers):
        r = api.post(
            f"{BASE_URL}/api/seo/suggest-angles",
            json={"topic": "sanctions Iran"},
            headers=auth_headers,
            timeout=120,
        )
        assert r.status_code == 200, f"{r.status_code} {r.text[:400]}"
        body = r.json()
        angles = body.get("angles") or body  # tolerate either wrapper
        if isinstance(angles, dict) and "angles" in angles:
            angles = angles["angles"]
        assert isinstance(angles, list), f"angles not list: {type(angles)}"
        assert len(angles) >= 5, f"want >=5 angles, got {len(angles)}"
        keys = {"title_fr", "title_en", "primary_keyword", "search_intent",
                "estimated_difficulty", "why_it_matters"}
        # at least majority of angles have the right shape
        good = [a for a in angles if isinstance(a, dict) and keys.issubset(a.keys())]
        assert len(good) >= len(angles) * 0.6, f"shape failures, only {len(good)} good of {len(angles)}"


# --------------------------- 15/16. sitemaps -------------------------------

class TestSitemaps:
    def test_main_sitemap(self, api):
        r = api.get(f"{BASE_URL}/api/sitemap.xml", timeout=30)
        assert r.status_code == 200, r.text[:300]
        ct = r.headers.get("content-type", "")
        assert "xml" in ct, ct
        body = r.text
        assert body.startswith("<?xml"), body[:80]
        assert "<urlset" in body
        # hreflang for fr/en/fa/x-default
        assert 'hreflang="fr"' in body
        assert 'hreflang="en"' in body
        assert 'hreflang="fa"' in body
        assert 'hreflang="x-default"' in body
        # category & tag hubs
        assert "/articles/category/" in body
        assert "/articles/tag/" in body
        # article URL uses /article/{slug}
        assert "/article/" in body

    def test_news_sitemap(self, api):
        r = api.get(f"{BASE_URL}/api/news-sitemap.xml", timeout=30)
        assert r.status_code == 200, r.text[:300]
        ct = r.headers.get("content-type", "")
        assert "xml" in ct
        body = r.text
        assert body.startswith("<?xml")
        assert "<urlset" in body
        # News namespace must be present even if no recent articles
        assert "sitemap-news" in body


# --------------------------- 17. regression --------------------------------

class TestRegression:
    def test_articles_list(self, api):
        r = api.get(f"{BASE_URL}/api/articles", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_unsubscribe(self, api):
        r = api.get(f"{BASE_URL}/api/unsubscribe?email=nobody@example.com", timeout=20)
        assert r.status_code == 200

    def test_founder_settings(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/settings/founder", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        body = r.json()
        # per-language schema must surface
        assert "name_fr" in body or "name_en" in body or "name_fa" in body

    def test_subscribers_list(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/subscribers", headers=auth_headers, timeout=20)
        assert r.status_code == 200

    @pytest.mark.timeout(180)
    def test_newsletter_generate_fr(self, api, auth_headers):
        r = api.post(
            f"{BASE_URL}/api/newsletter/generate?lang=fr",
            headers=auth_headers,
            timeout=180,
        )
        assert r.status_code == 200, r.text[:300]
        # body should contain some html
        out = r.json()
        html = out.get("html_content") or out.get("html") or out.get("body") or ""
        assert html, f"no html: {out}"

    @pytest.mark.timeout(180)
    def test_newsletter_generate_en(self, api, auth_headers):
        r = api.post(
            f"{BASE_URL}/api/newsletter/generate?lang=en",
            headers=auth_headers,
            timeout=180,
        )
        assert r.status_code == 200, r.text[:300]
