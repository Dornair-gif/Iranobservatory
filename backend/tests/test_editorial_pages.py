"""Backend regression for editorial pages — sitemap exposure and editorial source policy."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://iran-events-live.preview.emergentagent.com').rstrip('/')


# --- Sitemap regression: new editorial URLs must be exposed with hreflang FR/EN/FA ---

@pytest.fixture(scope='module')
def sitemap_xml():
    r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=90)
    assert r.status_code == 200, f"sitemap returned {r.status_code}"
    return r.text


@pytest.mark.parametrize("path", ["/a-propos", "/methodologie", "/manifeste"])
def test_sitemap_contains_editorial_path(sitemap_xml, path):
    expected_loc = f"<loc>https://iranobservatory.org{path}</loc>"
    assert expected_loc in sitemap_xml, f"Missing loc for {path}"


@pytest.mark.parametrize("path", ["/a-propos", "/methodologie", "/manifeste"])
@pytest.mark.parametrize("lang", ["fr", "en", "fa"])
def test_sitemap_hreflang_for_editorial(sitemap_xml, path, lang):
    expected = f'hreflang="{lang}" href="https://iranobservatory.org{path}"'
    assert expected in sitemap_xml, f"Missing hreflang={lang} for {path}"


def test_sitemap_xdefault_for_editorial(sitemap_xml):
    for path in ("/a-propos", "/methodologie", "/manifeste"):
        assert f'hreflang="x-default" href="https://iranobservatory.org{path}"' in sitemap_xml


# --- Regression: existing main routes still listed ---

@pytest.mark.parametrize("path", ["/", "/articles", "/studies", "/monitor"])
def test_sitemap_existing_routes_still_present(sitemap_xml, path):
    assert f"<loc>https://iranobservatory.org{path}</loc>" in sitemap_xml


# --- Basic API health to ensure no regression ---

def test_api_articles_listing():
    r = requests.get(f"{BASE_URL}/api/articles", timeout=20)
    assert r.status_code in (200, 304)


def test_news_sitemap_still_works():
    r = requests.get(f"{BASE_URL}/api/news-sitemap.xml", timeout=20)
    assert r.status_code == 200
    assert "<urlset" in r.text
