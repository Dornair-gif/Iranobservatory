from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import bcrypt
import jwt
import feedparser
import aiohttp
import asyncio

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
fs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="uploads")

# Create the main app
app = FastAPI(title="Iran Observatory API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
JWT_ALGORITHM = "HS256"

# ============ EDITORIAL SOURCE POLICY ============
# Hard editorial guardrails baked into every AI prompt. Iran Observatory must
# never reference opposition-affiliated outlets, and must always disclose when
# regime mouthpieces are quoted. These rules are appended to every LLM system
# message and post-processed via _sanitize_editorial() as a safety net.

BANNED_SOURCES = [
    # MEK / Mojahedin-e Khalq / Rajavi network and front organisations
    "mek", "m.e.k", "mko", "pmoi", "mojahedin", "mujahedin", "mojahedin-e khalq",
    "mujahedin-e khalq", "ncri", "cnri", "national council of resistance of iran",
    "conseil national de la résistance iranienne", "rajavi", "radjavi",
    "maryam rajavi", "maryam radjavi", "massoud rajavi", "iran-hrm", "iran hrm",
    # Iran International (Saudi-funded, openly partisan)
    "iran international", "iranintl", "iran intl", "ایران اینترنشنال",
]

# Regime-affiliated media: allowed only as primary sources for official
# announcements, and ALWAYS prefixed with an attribution disclaimer.
REGIME_SOURCES = {
    "tasnim": {"display": "Tasnim", "domain": "tasnimnews.com"},
    "tasnimnews": {"display": "Tasnim", "domain": "tasnimnews.com"},
    "fars": {"display": "Fars News", "domain": "farsnews.ir"},
    "farsnews": {"display": "Fars News", "domain": "farsnews.ir"},
    "irna": {"display": "IRNA", "domain": "irna.ir"},
    "press tv": {"display": "Press TV", "domain": "presstv.ir"},
    "presstv": {"display": "Press TV", "domain": "presstv.ir"},
    "mehr news": {"display": "Mehr News", "domain": "mehrnews.com"},
    "mehrnews": {"display": "Mehr News", "domain": "mehrnews.com"},
    "isna": {"display": "ISNA", "domain": "isna.ir"},
    "tabnak": {"display": "Tabnak", "domain": "tabnak.ir"},
    "kayhan": {"display": "Kayhan", "domain": "kayhan.ir"},
}

EDITORIAL_SOURCE_RULES = """
EDITORIAL SOURCE POLICY — STRICTLY ENFORCED (non-negotiable):

1. BANNED SOURCES — NEVER cite, quote, link, paraphrase, or reference in any way:
   - MEK / Mojahedin-e Khalq / MKO / PMOI / NCRI / CNRI / Rajavi (Maryam or Massoud) / Iran-HRM
   - Iran International (iranintl, ایران اینترنشنال) — partisan, Saudi-funded
   - Any outlet affiliated with the exiled Iranian opposition
   If a fact ONLY exists in these outlets, OMIT it. Do not laundering it. Do not say "some sources claim".

2. REGIME SOURCES — Tasnim, Fars News, IRNA, Press TV, Mehr News, ISNA, Tabnak, Kayhan:
   - Use ONLY for official Iranian government announcements, regime statements, or to document the regime's own narrative.
   - When cited, you MUST ALWAYS attribute with one of these exact framings (match output language):
       • French: "selon les médias d'État iraniens [Name]", "selon les sources du régime [Name]"
       • English: "according to Iranian state media [Name]", "per regime-controlled outlet [Name]"
       • Persian: "بنا به منابع حکومتی [Name]", "به گزارش رسانه دولتی [Name]"
   - NEVER present regime claims as neutral fact.

3. PREFERRED SOURCES (cite by name when used):
   - International independent: Reuters, AFP, AP, BBC, Le Monde, Financial Times, The Economist, NYT, Washington Post, Bloomberg
   - Multilateral / official: UN OHCHR, IAEA, IMF, World Bank, EU Council, US Treasury OFAC
   - Specialized monitors: NetBlocks, Cloudflare Radar, OONI, Crisis Group, SIPRI, FDD, UANI
   - Independent human rights (Oslo-based / international): Iran Human Rights (iranhr.net), HRA / HRANA (en-hrana.org), Amnesty International, Human Rights Watch

4. IF a source is unknown or unverified, do NOT fabricate. Either omit, or write "international independent sources" without specifics.
"""


def _sanitize_editorial(text: str) -> str:
    """Post-process AI output: scrub any residual banned-source mention and
    auto-prefix attribution disclaimers for regime sources. Idempotent."""
    if not text or not isinstance(text, str):
        return text
    import re as _re_ed

    cleaned = text

    # 1) Strip whole sentences that mention banned sources (most aggressive +
    # safest behaviour: if a banned source slipped in, drop the sentence).
    banned_pattern = _re_ed.compile(
        r"(?i)(?:[^.!?\n]*?\b(?:" + "|".join(_re_ed.escape(s) for s in BANNED_SOURCES) + r")\b[^.!?\n]*[.!?])"
    )
    cleaned = banned_pattern.sub("", cleaned)

    # 2) Collapse residual orphan punctuation / double spaces left by removal.
    cleaned = _re_ed.sub(r"\s{2,}", " ", cleaned)
    cleaned = _re_ed.sub(r"\s+([.,;:!?])", r"\1", cleaned)
    cleaned = _re_ed.sub(r"\n\s*\n\s*\n+", "\n\n", cleaned)

    # 3) Ensure regime sources carry attribution. We only act when the regime
    # source is mentioned WITHOUT one of the disclosure markers in the same
    # sentence (keeps idempotency).
    disclosure_markers = [
        "régime", "regime", "état iranien", "iranian state", "state media",
        "حکومتی", "دولتی", "regime-controlled", "régime iranien",
        "iran state", "official iranian",
    ]
    for key, info in REGIME_SOURCES.items():
        name = info["display"]
        # Word-boundary match on display name (case-insensitive)
        pattern = _re_ed.compile(rf"(?i)\b{_re_ed.escape(name)}\b")
        def _attribute(match, _name=name):
            # Look back to the start of the current sentence only (avoids
            # leaking disclosure from a prior sentence).
            start_sentence = match.start()
            for i in range(match.start() - 1, -1, -1):
                if cleaned[i] in ".!?\n":
                    start_sentence = i + 1
                    break
                else:
                    start_sentence = i
            window = cleaned[start_sentence:match.end()].lower()
            if any(m in window for m in disclosure_markers):
                return match.group(0)
            return f"the Iranian regime-controlled outlet {_name}"
        cleaned = pattern.sub(_attribute, cleaned)

    return cleaned.strip()

# ============ SEO HELPERS ============
import re as _re_seo
import unicodedata as _ud_seo

def slugify(value: str, max_length: int = 80) -> str:
    """ASCII-safe URL slug. Persian/Arabic chars are transliterated when possible,
    otherwise dropped. Falls back to a short uid if the result is empty."""
    if not value:
        return ""
    # Normalize unicode (strip combining marks); for Persian/Arabic, NFKD often
    # doesn't ASCII-fold meaningfully, so we just drop non-ascii and rely on
    # the caller passing a Latin title (we use the EN title preferentially).
    normalized = _ud_seo.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_only = ascii_only.lower()
    ascii_only = _re_seo.sub(r"[^a-z0-9\s-]", "", ascii_only)
    ascii_only = _re_seo.sub(r"[\s_-]+", "-", ascii_only).strip("-")
    if len(ascii_only) > max_length:
        ascii_only = ascii_only[:max_length].rstrip("-")
    return ascii_only

async def ensure_unique_slug(base: str, article_id_str: str) -> str:
    """Ensure slug uniqueness across articles. Appends -2, -3... if collision."""
    if not base:
        base = f"a-{article_id_str[-6:]}"
    candidate = base
    i = 1
    while True:
        existing = await db.articles.find_one(
            {"slug": candidate, "_id": {"$ne": ObjectId(article_id_str)}},
            {"_id": 1}
        )
        if not existing:
            return candidate
        i += 1
        candidate = f"{base}-{i}"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "default-secret-key")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Pydantic Models
class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class ArticleBase(BaseModel):
    title_en: str = ""
    title_fr: str = ""
    title_fa: str = ""
    content_en: str = ""
    content_fr: str = ""
    content_fa: str = ""
    summary_en: str = ""
    summary_fr: str = ""
    summary_fa: str = ""
    # SEO fields (per language)
    slug: Optional[str] = None  # canonical URL slug
    seo_title_en: str = ""
    seo_title_fr: str = ""
    seo_title_fa: str = ""
    meta_description_en: str = ""
    meta_description_fr: str = ""
    meta_description_fa: str = ""
    focus_keywords: List[str] = []
    image_url: Optional[str] = None
    source_url: Optional[str] = None
    pdf_url: Optional[str] = None
    tags: List[str] = []
    category: str = "news"  # news, analysis, study
    content_type: str = "news"  # news, analysis, study

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(ArticleBase):
    status: Optional[str] = None

class ArticleResponse(ArticleBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    slug: Optional[str] = None
    status: str
    content_type: str = "news"
    pdf_url: Optional[str] = None
    created_at: str
    updated_at: str
    published_at: Optional[str] = None

class RSSFeedBase(BaseModel):
    name: str
    url: str
    category: str = "general"
    language: str = "en"
    is_regime_source: bool = False  # Tasnim/Fars/IRNA/etc. — triggers auto-attribution

class RSSFeedResponse(RSSFeedBase):
    id: str
    active: bool
    language: str = "en"
    is_regime_source: bool = False
    last_fetched: Optional[str] = None

class RSSItemResponse(BaseModel):
    id: str
    title: str
    link: str
    summary: str
    published: Optional[str] = None
    feed_name: str
    processed: bool
    suggestion_status: str = "pending"
    ai_reason: Optional[str] = None

class AIGenerateRequest(BaseModel):
    rss_item_id: str
    target_languages: List[str] = ["en", "fr", "fa"]

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

# Auth Endpoints
@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "email": user["email"],
        "name": user.get("name", "Admin"),
        "role": user.get("role", "admin"),
        "access_token": access_token
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

# RSS Feed Endpoints
@api_router.get("/rss/feeds", response_model=List[RSSFeedResponse])
async def get_rss_feeds(request: Request):
    await get_current_user(request)
    feeds = await db.rss_feeds.find({}).to_list(100)
    result = []
    for feed in feeds:
        result.append({
            "id": str(feed["_id"]),
            "name": feed["name"],
            "url": feed["url"],
            "category": feed.get("category", "general"),
            "language": feed.get("language", "en"),
            "is_regime_source": feed.get("is_regime_source", False),
            "active": feed.get("active", True),
            "last_fetched": feed.get("last_fetched").isoformat() if feed.get("last_fetched") else None
        })
    return result

@api_router.post("/rss/feeds", response_model=RSSFeedResponse)
async def create_rss_feed(data: RSSFeedBase, request: Request):
    await get_current_user(request)
    feed_doc = {
        "name": data.name,
        "url": data.url,
        "category": data.category,
        "language": data.language,
        "is_regime_source": data.is_regime_source,
        "active": True,
        "last_fetched": None,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.rss_feeds.insert_one(feed_doc)
    return {
        "id": str(result.inserted_id),
        "name": data.name,
        "url": data.url,
        "category": data.category,
        "language": data.language,
        "is_regime_source": data.is_regime_source,
        "active": True,
        "last_fetched": None
    }

@api_router.put("/rss/feeds/{feed_id}")
async def update_rss_feed(feed_id: str, data: RSSFeedBase, request: Request):
    """Update RSS feed name, URL, category, language, or regime-source flag"""
    await get_current_user(request)

    update_doc = {
        "name": data.name,
        "url": data.url,
        "category": data.category,
        "language": data.language,
        "is_regime_source": data.is_regime_source,
    }
    
    result = await db.rss_feeds.update_one(
        {"_id": ObjectId(feed_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    return {"message": "Feed updated"}

@api_router.delete("/rss/feeds/{feed_id}")
async def delete_rss_feed(feed_id: str, request: Request):
    await get_current_user(request)
    result = await db.rss_feeds.delete_one({"_id": ObjectId(feed_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Feed not found")
    return {"message": "Feed deleted"}

import re

# Shared function to fetch a single feed (used by API endpoint and background task)
async def _fetch_single_feed(feed: dict) -> int:
    """Fetch RSS items for a single feed. Returns number of new items added."""
    feed_id = str(feed["_id"])
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(feed["url"], timeout=30) as resp:
                content = await resp.text()

        parsed = feedparser.parse(content)
        items_added = 0

        for entry in parsed.entries[:20]:
            existing = await db.rss_items.find_one({"link": entry.get("link", "")})
            if not existing:
                image_url = None

                if hasattr(entry, 'media_content') and entry.media_content:
                    for media in entry.media_content:
                        if media.get('type', '').startswith('image') or media.get('medium') == 'image':
                            image_url = media.get('url')
                            break

                if not image_url and hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
                    image_url = entry.media_thumbnail[0].get('url')

                if not image_url and hasattr(entry, 'enclosures') and entry.enclosures:
                    for enc in entry.enclosures:
                        if enc.get('type', '').startswith('image'):
                            image_url = enc.get('href') or enc.get('url')
                            break

                if not image_url:
                    content_html = entry.get('content', [{}])[0].get('value', '') if entry.get('content') else ''
                    summary_html = entry.get('summary', '')
                    html_to_search = content_html or summary_html
                    img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html_to_search)
                    if img_match:
                        image_url = img_match.group(1)

                if not image_url and hasattr(entry, 'links'):
                    for link in entry.links:
                        if link.get('type', '').startswith('image'):
                            image_url = link.get('href')
                            break

                item_doc = {
                    "feed_id": feed_id,
                    "feed_name": feed["name"],
                    "is_regime_source": feed.get("is_regime_source", False),
                    "title": entry.get("title", ""),
                    "link": entry.get("link", ""),
                    "summary": entry.get("summary", entry.get("description", "")),
                    "image_url": image_url,
                    "published": entry.get("published", ""),
                    "processed": False,
                    "created_at": datetime.now(timezone.utc)
                }
                await db.rss_items.insert_one(item_doc)
                items_added += 1

        await db.rss_feeds.update_one(
            {"_id": ObjectId(feed_id)},
            {"$set": {"last_fetched": datetime.now(timezone.utc)}}
        )
        return items_added
    except Exception as e:
        logger.error(f"Failed to fetch feed {feed.get('name', feed_id)}: {e}")
        return 0


# AI-powered RSS item evaluation - filters for analysis-worthy items
async def _evaluate_rss_items(items: list):
    """Use AI to evaluate which RSS items have potential for in-depth analysis."""
    if not items:
        return

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        api_key = os.environ.get("EMERGENT_LLM_KEY")

        chat = LlmChat(
            api_key=api_key,
            session_id=f"rss-eval-{uuid.uuid4()}",
            system_message=EDITORIAL_SOURCE_RULES + """

You are an editorial assistant for Iran Observatory. Your job is to evaluate news items and identify which ones have potential for in-depth journalistic analysis.

REJECT any item whose primary source is a BANNED outlet (MEK/NCRI/Iran International/Rajavi network) — no exceptions.

SELECT items that:
- Have geopolitical significance (sanctions, diplomacy, military, international relations)
- Reveal patterns or trends in Iranian politics, economy, or society
- Involve key figures, organizations, or institutions
- Have human rights implications
- Could benefit from contextual analysis and background explanation
- Are significant enough to warrant a full article (not just a tweet-level update)

REJECT items that:
- Are purely repetitive breaking news with no analytical angle
- Are too short or vague to develop into a full article
- Are just hashtag collections or social media noise
- Are duplicates or very similar to other items in the batch

For each item, respond with ONLY a JSON array. Each element: {"id": "item_id", "status": "suggested" or "rejected", "reason": "brief 10-word reason"}
No other text, just the JSON array."""
        ).with_model("openai", "gpt-5.2")

        # Build batch prompt
        items_text = ""
        for item in items:
            items_text += f'\n- ID: {str(item["_id"])}\n  Title: {item["title"][:200]}\n  Summary: {item.get("summary", "")[:300]}\n'

        prompt = f"Evaluate these {len(items)} news items about Iran. Which ones deserve a full analytical article?\n{items_text}"

        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)

        # Parse AI response
        import json
        # Extract JSON from response
        response_clean = response.strip()
        if response_clean.startswith("```"):
            response_clean = response_clean.split("```")[1]
            if response_clean.startswith("json"):
                response_clean = response_clean[4:]
        evaluations = json.loads(response_clean)

        for ev in evaluations:
            item_id = ev.get("id")
            status = ev.get("status", "rejected")
            reason = ev.get("reason", "")
            if item_id:
                await db.rss_items.update_one(
                    {"_id": ObjectId(item_id)},
                    {"$set": {"suggestion_status": status, "ai_reason": reason}}
                )

        suggested_count = sum(1 for ev in evaluations if ev.get("status") == "suggested")
        logger.info(f"AI evaluation: {suggested_count}/{len(items)} items suggested for articles")

    except Exception as e:
        logger.error(f"AI evaluation error: {e}")
        # Fallback: mark all as suggested so nothing is lost
        for item in items:
            await db.rss_items.update_one(
                {"_id": item["_id"]},
                {"$set": {"suggestion_status": "suggested", "ai_reason": "Auto-suggested (evaluation unavailable)"}}
            )


# Background auto-fetch task
async def auto_fetch_all_feeds():
    """Background task that fetches all active RSS feeds every 30 minutes."""
    while True:
        try:
            await asyncio.sleep(1800)  # 30 minutes
            feeds = await db.rss_feeds.find({"active": True}).to_list(50)
            total_new = 0
            for feed in feeds:
                count = await _fetch_single_feed(feed)
                total_new += count
            if total_new > 0:
                logger.info(f"Auto-fetch: {total_new} new RSS items across {len(feeds)} feeds")
                # Evaluate new items with AI
                pending_items = await db.rss_items.find(
                    {"suggestion_status": {"$exists": False}, "processed": False}
                ).to_list(50)
                if pending_items:
                    await _evaluate_rss_items(pending_items)
        except Exception as e:
            logger.error(f"Auto-fetch error: {e}")


@api_router.post("/rss/feeds/{feed_id}/fetch")
async def fetch_rss_feed(feed_id: str, request: Request):
    await get_current_user(request)
    feed = await db.rss_feeds.find_one({"_id": ObjectId(feed_id)})
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")

    items_added = await _fetch_single_feed(feed)
    return {"message": f"Fetched {items_added} new items"}

@api_router.get("/rss/items", response_model=List[RSSItemResponse])
async def get_rss_items(request: Request, processed: Optional[bool] = None, status: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if processed is not None:
        query["processed"] = processed
    if status:
        query["suggestion_status"] = status
    else:
        # By default, exclude rejected items
        query["suggestion_status"] = {"$ne": "rejected"}
    
    items = await db.rss_items.find(query).sort("created_at", -1).to_list(100)
    result = []
    for item in items:
        result.append({
            "id": str(item["_id"]),
            "title": item["title"],
            "link": item["link"],
            "summary": item.get("summary", ""),
            "published": item.get("published"),
            "feed_name": item.get("feed_name", ""),
            "processed": item.get("processed", False),
            "suggestion_status": item.get("suggestion_status", "pending"),
            "ai_reason": item.get("ai_reason")
        })
    return result

@api_router.post("/rss/items/{item_id}/reject")
async def reject_rss_item(item_id: str, request: Request):
    await get_current_user(request)
    result = await db.rss_items.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"suggestion_status": "rejected"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item rejected"}

@api_router.post("/rss/items/evaluate")
async def evaluate_pending_items(request: Request):
    """Manually trigger AI evaluation of pending RSS items."""
    await get_current_user(request)
    pending_items = await db.rss_items.find(
        {"suggestion_status": {"$in": ["pending", None]}, "processed": False}
    ).to_list(50)
    if not pending_items:
        return {"message": "No pending items to evaluate"}
    # Also include items without suggestion_status field
    no_status = await db.rss_items.find(
        {"suggestion_status": {"$exists": False}, "processed": False}
    ).to_list(50)
    all_items = {str(i["_id"]): i for i in pending_items + no_status}
    await _evaluate_rss_items(list(all_items.values()))
    return {"message": f"Evaluated {len(all_items)} items"}

# AI Content Generation
@api_router.post("/ai/generate")
async def generate_article(data: AIGenerateRequest, request: Request):
    await get_current_user(request)
    
    rss_item = await db.rss_items.find_one({"_id": ObjectId(data.rss_item_id)})
    if not rss_item:
        raise HTTPException(status_code=404, detail="RSS item not found")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        
        # Generate article content with fact-checking and enrichment
        chat = LlmChat(
            api_key=api_key,
            session_id=f"article-gen-{uuid.uuid4()}",
            system_message=EDITORIAL_SOURCE_RULES + """

You are a senior analyst for Iran Observatory, an independent platform offering fact-based insights into Iran's political, economic and social dynamics.

EDITORIAL STANCE:
- We are completely independent and impartial
- We are critical of the Islamic Republic regime but maintain journalistic objectivity
- We never produce content that could benefit the Islamic Republic
- We focus on facts, verified information, and balanced analysis
- We serve readers who believe "Iran's future matters, far beyond its borders"

CRITICAL RULES:
- The information provided has been verified by our editorial team. Write with full confidence.
- Do NOT use hedging: "reportedly", "according to sources", "we could not verify", "allegedly", "it is claimed".
- Do NOT pad articles with generic background filler like "Iran is a country of 85 million people" or "the Iranian economy has long suffered from sanctions". The reader already knows this.
- Every sentence must carry specific, actionable information or genuine analytical insight.
- If you explain a concept (e.g. what the IRGC is), do it in one concise sentence, not a paragraph.

ANALYTICAL DEPTH:
- Go beyond the headline. Answer: Why now? What does this change? Who benefits? What comes next?
- Connect events to specific, current dynamics — not vague historical overviews
- Use precise data: names, dates, dollar amounts, percentages, specific sanctions, exact policy details
- Identify strategic implications: shifts in power balance, signaling between actors, economic consequences
- When relevant, compare with specific recent precedents (cite the exact event and date, not "historically")
- Highlight what makes this event significant — don't state the obvious

WRITING STYLE:
- Authoritative, sharp, analytical — like The Economist's briefings or Foreign Affairs
- Every paragraph must advance the reader's understanding
- No filler sentences, no generic truisms, no padding
- Dense with insight, but clearly written
- Write with authority and conviction

Output in the requested language only, with proper localization and cultural adaptation."""
        ).with_model("openai", "gpt-5.2")
        
        generated = {}

        is_regime = bool(rss_item.get("is_regime_source", False))
        regime_hint_en = (
            "\nIMPORTANT — REGIME SOURCE: this item originates from an Iranian state-controlled outlet "
            f"({rss_item.get('feed_name','')}). You MUST attribute it as such ("
            "FR: 'selon les médias d'État iraniens'; EN: 'according to Iranian state media'; "
            "FA: 'بنا به منابع حکومتی'). Treat the claim as the regime's narrative, not as verified fact, "
            "and cross-check against international independent sources.\n"
            if is_regime else ""
        )

        for lang in data.target_languages:
            lang_names = {"en": "English", "fr": "French", "fa": "Persian (Farsi)"}
            
            # Generate title
            title_prompt = f"""Based on this news item, write a compelling headline in {lang_names.get(lang, lang)}:

Title: {rss_item['title']}
Summary: {rss_item.get('summary', '')}

Write ONLY the headline, nothing else. Make it professional and engaging."""
            
            title_msg = UserMessage(text=title_prompt)
            title_response = await chat.send_message(title_msg)
            
            # Generate content with fact-checking and enrichment
            content_prompt = f"""Write an analytical article in {lang_names.get(lang, lang)} based on:

Title: {rss_item['title']}
Summary: {rss_item.get('summary', '')}
Source: {rss_item.get('link', '')}
{regime_hint_en}
REQUIREMENTS:
1. Write 4-6 paragraphs of genuine analysis, not news recap
2. Open with the key fact in 1-2 sentences, then immediately analyze WHY it matters
3. Every paragraph must contain specific insights: names, dates, figures, policy details
4. Do NOT include generic background filler about Iran. Only mention context that directly explains THIS event
5. Answer these questions: Why now? What changes? Who gains/loses? What are the strategic implications?
6. If referencing precedent, cite the specific event and approximate date
7. End with a forward-looking assessment: what to watch next, what this signals
8. Mention the source
9. Write ONLY in {lang_names.get(lang, lang)}

Write the article body only, no title."""
            
            content_msg = UserMessage(text=content_prompt)
            content_response = await chat.send_message(content_msg)
            
            # Generate summary
            summary_prompt = f"""Write a 2-sentence summary of this article in {lang_names.get(lang, lang)}:

{content_response}

Write ONLY the summary, nothing else."""
            
            summary_msg = UserMessage(text=summary_prompt)
            summary_response = await chat.send_message(summary_msg)
            
            generated[f"title_{lang}"] = _sanitize_editorial(title_response.strip())
            generated[f"content_{lang}"] = _sanitize_editorial(content_response.strip())
            generated[f"summary_{lang}"] = _sanitize_editorial(summary_response.strip())
        
        # Create draft article
        article_doc = {
            **generated,
            "source_url": rss_item.get("link", ""),
            "image_url": rss_item.get("image_url") or "https://images.unsplash.com/photo-1767208212251-7b9b0bde15db?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHw0fHx0ZWhyYW4lMjBza3lsaW5lfGVufDB8fHx8MTc3NTIwMjc0NHww&ixlib=rb-4.1.0&q=85",
            "tags": [],
            "category": "news",
            "status": "draft",
            "rss_item_id": data.rss_item_id,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db.articles.insert_one(article_doc)
        
        # Mark RSS item as processed
        await db.rss_items.update_one(
            {"_id": ObjectId(data.rss_item_id)},
            {"$set": {"processed": True}}
        )
        
        return {
            "id": str(result.inserted_id),
            "message": "Article draft generated successfully",
            **generated
        }
        
    except Exception as e:
        logging.error(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate article: {str(e)}")

@api_router.post("/ai/translate")
async def translate_text(data: TranslationRequest, request: Request):
    await get_current_user(request)
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        
        lang_names = {"en": "English", "fr": "French", "fa": "Persian (Farsi)"}
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"translate-{uuid.uuid4()}",
            system_message=f"""You are an expert translator specializing in journalistic content about Iran and the Middle East.
Translate with proper localization, not literal translation. Adapt idioms and cultural references.
Maintain the professional journalistic tone. Output ONLY the translation, nothing else."""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Translate this text from {lang_names.get(data.source_lang, data.source_lang)} to {lang_names.get(data.target_lang, data.target_lang)}:

{data.text}

Output ONLY the translated text."""
        
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        
        return {"translated_text": response.strip()}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

# Article Endpoints
@api_router.post("/articles", response_model=ArticleResponse)
async def create_article(data: ArticleCreate, request: Request):
    """Create a new article manually (for studies, analysis, etc.)"""
    await get_current_user(request)
    
    # Auto-extract first image from HTML content if no image_url provided
    image_url = data.image_url
    if not image_url and data.content_type in ('analysis', 'study'):
        import re
        for content_field in [data.content_en, data.content_fr, data.content_fa]:
            if content_field:
                img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content_field)
                if img_match:
                    image_url = img_match.group(1)
                    break
    
    article_doc = {
        "title_en": data.title_en,
        "title_fr": data.title_fr,
        "title_fa": data.title_fa,
        "content_en": data.content_en,
        "content_fr": data.content_fr,
        "content_fa": data.content_fa,
        "summary_en": data.summary_en,
        "summary_fr": data.summary_fr,
        "summary_fa": data.summary_fa,
        "seo_title_en": data.seo_title_en or "",
        "seo_title_fr": data.seo_title_fr or "",
        "seo_title_fa": data.seo_title_fa or "",
        "meta_description_en": data.meta_description_en or "",
        "meta_description_fr": data.meta_description_fr or "",
        "meta_description_fa": data.meta_description_fa or "",
        "focus_keywords": data.focus_keywords or [],
        "image_url": image_url,
        "source_url": data.source_url,
        "tags": data.tags,
        "category": data.category,
        "content_type": data.content_type,
        "status": "draft",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.articles.insert_one(article_doc)
    inserted_id = str(result.inserted_id)
    
    # Generate slug from English title (best for SEO) → French → Persian fallback
    slug_seed = data.title_en or data.title_fr or data.title_fa
    base_slug = slugify(slug_seed) if slug_seed else ""
    final_slug = await ensure_unique_slug(base_slug, inserted_id) if base_slug else None
    if final_slug:
        await db.articles.update_one(
            {"_id": result.inserted_id},
            {"$set": {"slug": final_slug}}
        )
    
    return {
        "id": inserted_id,
        "slug": final_slug,
        "title_en": data.title_en,
        "title_fr": data.title_fr,
        "title_fa": data.title_fa,
        "content_en": data.content_en,
        "content_fr": data.content_fr,
        "content_fa": data.content_fa,
        "summary_en": data.summary_en,
        "summary_fr": data.summary_fr,
        "summary_fa": data.summary_fa,
        "image_url": data.image_url,
        "source_url": data.source_url,
        "tags": data.tags,
        "category": data.category,
        "content_type": data.content_type,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "published_at": None
    }

@api_router.get("/articles", response_model=List[ArticleResponse])
async def get_articles(status: Optional[str] = None, content_type: Optional[str] = None, lang: str = "en", limit: int = 50):
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = "published"
    if content_type:
        query["content_type"] = content_type
    
    # Use projection for public API to exclude full content and improve performance
    projection = {
        "title_en": 1, "title_fr": 1, "title_fa": 1,
        "summary_en": 1, "summary_fr": 1, "summary_fa": 1,
        "slug": 1, "focus_keywords": 1,
        "image_url": 1, "source_url": 1, "tags": 1,
        "category": 1, "content_type": 1, "status": 1,
        "created_at": 1, "updated_at": 1, "published_at": 1
    }
    
    articles = await db.articles.find(query, projection).sort("created_at", -1).to_list(limit)
    result = []
    for article in articles:
        result.append({
            "id": str(article["_id"]),
            "slug": article.get("slug"),
            "title_en": article.get("title_en", ""),
            "title_fr": article.get("title_fr", ""),
            "title_fa": article.get("title_fa", ""),
            "content_en": "",  # Not included in list view for performance
            "content_fr": "",
            "content_fa": "",
            "summary_en": article.get("summary_en", ""),
            "summary_fr": article.get("summary_fr", ""),
            "summary_fa": article.get("summary_fa", ""),
            "focus_keywords": article.get("focus_keywords", []),
            "image_url": article.get("image_url"),
            "source_url": article.get("source_url"),
            "pdf_url": article.get("pdf_url"),
            "tags": article.get("tags", []),
            "category": article.get("category", "news"),
            "content_type": article.get("content_type", "news"),
            "status": article.get("status", "draft"),
            "created_at": article.get("created_at").isoformat() if article.get("created_at") else "",
            "updated_at": article.get("updated_at").isoformat() if article.get("updated_at") else "",
            "published_at": article.get("published_at").isoformat() if article.get("published_at") else None
        })
    return result

@api_router.get("/articles/admin", response_model=List[ArticleResponse])
async def get_admin_articles(request: Request, status: Optional[str] = None, content_type: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if status:
        query["status"] = status
    if content_type:
        query["content_type"] = content_type
    
    articles = await db.articles.find(query).sort("created_at", -1).to_list(100)
    result = []
    for article in articles:
        result.append({
            "id": str(article["_id"]),
            "title_en": article.get("title_en", ""),
            "title_fr": article.get("title_fr", ""),
            "title_fa": article.get("title_fa", ""),
            "content_en": article.get("content_en", ""),
            "content_fr": article.get("content_fr", ""),
            "content_fa": article.get("content_fa", ""),
            "summary_en": article.get("summary_en", ""),
            "summary_fr": article.get("summary_fr", ""),
            "summary_fa": article.get("summary_fa", ""),
            "image_url": article.get("image_url"),
            "source_url": article.get("source_url"),
            "pdf_url": article.get("pdf_url"),
            "tags": article.get("tags", []),
            "category": article.get("category", "news"),
            "content_type": article.get("content_type", "news"),
            "status": article.get("status", "draft"),
            "created_at": article.get("created_at").isoformat() if article.get("created_at") else "",
            "updated_at": article.get("updated_at").isoformat() if article.get("updated_at") else "",
            "published_at": article.get("published_at").isoformat() if article.get("published_at") else None
        })
    return result

@api_router.get("/articles/{article_id_or_slug}", response_model=ArticleResponse)
async def get_article(article_id_or_slug: str):
    # Try ObjectId first (legacy), then slug
    article = None
    try:
        article = await db.articles.find_one({"_id": ObjectId(article_id_or_slug)})
    except Exception:
        pass
    if not article:
        article = await db.articles.find_one({"slug": article_id_or_slug})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {
        "id": str(article["_id"]),
        "slug": article.get("slug"),
        "title_en": article.get("title_en", ""),
        "title_fr": article.get("title_fr", ""),
        "title_fa": article.get("title_fa", ""),
        "content_en": article.get("content_en", ""),
        "content_fr": article.get("content_fr", ""),
        "content_fa": article.get("content_fa", ""),
        "summary_en": article.get("summary_en", ""),
        "summary_fr": article.get("summary_fr", ""),
        "summary_fa": article.get("summary_fa", ""),
        "seo_title_en": article.get("seo_title_en", ""),
        "seo_title_fr": article.get("seo_title_fr", ""),
        "seo_title_fa": article.get("seo_title_fa", ""),
        "meta_description_en": article.get("meta_description_en", ""),
        "meta_description_fr": article.get("meta_description_fr", ""),
        "meta_description_fa": article.get("meta_description_fa", ""),
        "focus_keywords": article.get("focus_keywords", []),
        "image_url": article.get("image_url"),
        "source_url": article.get("source_url"),
        "pdf_url": article.get("pdf_url"),
        "tags": article.get("tags", []),
        "category": article.get("category", "news"),
        "content_type": article.get("content_type", "news"),
        "status": article.get("status", "draft"),
        "created_at": article.get("created_at").isoformat() if article.get("created_at") else "",
        "updated_at": article.get("updated_at").isoformat() if article.get("updated_at") else "",
        "published_at": article.get("published_at").isoformat() if article.get("published_at") else None
    }

# ============ ARTICLE SEO HELPERS ============
@api_router.get("/articles/{article_id_or_slug}/related", response_model=List[ArticleResponse])
async def get_related_articles(article_id_or_slug: str, limit: int = 4):
    """Find related articles by shared tags / category. Used for internal linking + SEO."""
    article = None
    try:
        article = await db.articles.find_one({"_id": ObjectId(article_id_or_slug)})
    except Exception:
        pass
    if not article:
        article = await db.articles.find_one({"slug": article_id_or_slug})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    tags = article.get("tags", []) or []
    category = article.get("category", "news")
    
    # Score by tag overlap first, then category match, then recency
    query = {
        "_id": {"$ne": article["_id"]},
        "status": "published"
    }
    if tags:
        query["$or"] = [{"tags": {"$in": tags}}, {"category": category}]
    else:
        query["category"] = category
    
    projection = {
        "title_en": 1, "title_fr": 1, "title_fa": 1,
        "summary_en": 1, "summary_fr": 1, "summary_fa": 1,
        "slug": 1, "image_url": 1, "tags": 1, "category": 1,
        "content_type": 1, "status": 1,
        "created_at": 1, "updated_at": 1, "published_at": 1
    }
    candidates = await db.articles.find(query, projection).sort("created_at", -1).limit(20).to_list(20)
    
    # Score & sort
    article_tags = set(tags)
    def score(c):
        c_tags = set(c.get("tags", []) or [])
        return len(article_tags & c_tags) * 10 + (5 if c.get("category") == category else 0)
    candidates.sort(key=score, reverse=True)
    
    out = []
    for c in candidates[:limit]:
        out.append({
            "id": str(c["_id"]),
            "slug": c.get("slug"),
            "title_en": c.get("title_en", ""),
            "title_fr": c.get("title_fr", ""),
            "title_fa": c.get("title_fa", ""),
            "content_en": "", "content_fr": "", "content_fa": "",
            "summary_en": c.get("summary_en", ""),
            "summary_fr": c.get("summary_fr", ""),
            "summary_fa": c.get("summary_fa", ""),
            "image_url": c.get("image_url"),
            "tags": c.get("tags", []),
            "category": c.get("category", "news"),
            "content_type": c.get("content_type", "news"),
            "status": c.get("status", "published"),
            "created_at": c.get("created_at").isoformat() if c.get("created_at") else "",
            "updated_at": c.get("updated_at").isoformat() if c.get("updated_at") else "",
            "published_at": c.get("published_at").isoformat() if c.get("published_at") else None
        })
    return out

@api_router.post("/articles/{article_id}/seo/generate")
async def generate_article_seo(article_id: str, request: Request):
    """Auto-generate SEO meta (title, description, keywords) per language from article content using GPT-5.2."""
    await get_current_user(request)
    
    article = await db.articles.find_one({"_id": ObjectId(article_id)})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Strip HTML for the AI prompt
    import re as _re
    def _strip(s): return _re.sub(r"<[^>]+>", " ", s or "").strip()[:3000]
    
    content_excerpt = _strip(article.get("content_en") or article.get("content_fr") or article.get("content_fa"))
    title_en = article.get("title_en", "")
    title_fr = article.get("title_fr", "")
    title_fa = article.get("title_fa", "")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"seo-{article_id}",
            system_message="""You are an SEO expert for Iran Observatory, a multilingual independent platform on Iran.
For a given article, produce SEO-optimized meta in French, English and Persian.

Output STRICT JSON, no commentary, no markdown fence:
{
  "seo_title_en": "max 60 chars, includes primary keyword, in English",
  "seo_title_fr": "max 60 chars, includes primary keyword, in French",
  "seo_title_fa": "max 60 chars, in Persian",
  "meta_description_en": "max 155 chars, compelling summary that includes 1-2 keywords, in English",
  "meta_description_fr": "max 155 chars, in French",
  "meta_description_fa": "max 155 chars, in Persian",
  "focus_keywords": ["3 to 6 keywords/phrases (mixed langs is fine), most-searched first"]
}

Rules:
- Titles must include the article's primary topic and avoid clickbait.
- Descriptions must be self-contained (a search user can understand without clicking) and end without truncation.
- Focus keywords should be searchable phrases related to Iran (e.g., "Iran sanctions 2026", "Strait of Hormuz crisis", "اعتراضات ایران", "diplomatie Iran-USA").
- Do NOT include site name (we append it client-side).
"""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Article title (FR): {title_fr}
Article title (EN): {title_en}
Article title (FA): {title_fa}
Tags: {', '.join(article.get('tags', []) or [])}
Category: {article.get('category', 'news')}
Content excerpt:
{content_excerpt}
"""
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        
        # Parse JSON
        import json as _json
        raw = response.strip()
        # Tolerate occasional code fences
        raw = _re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=_re.MULTILINE).strip()
        data = _json.loads(raw)
        
        # Truncate to limits to be safe
        def _cap(s, n): return (s or "").strip()[:n]
        seo = {
            "seo_title_en": _cap(data.get("seo_title_en", ""), 60),
            "seo_title_fr": _cap(data.get("seo_title_fr", ""), 60),
            "seo_title_fa": _cap(data.get("seo_title_fa", ""), 60),
            "meta_description_en": _cap(data.get("meta_description_en", ""), 160),
            "meta_description_fr": _cap(data.get("meta_description_fr", ""), 160),
            "meta_description_fa": _cap(data.get("meta_description_fa", ""), 160),
            "focus_keywords": [k.strip() for k in (data.get("focus_keywords") or []) if k and isinstance(k, str)][:8],
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.articles.update_one({"_id": article["_id"]}, {"$set": seo})
        # Don't return Mongo's datetime
        seo["updated_at"] = seo["updated_at"].isoformat()
        return {"message": "SEO meta generated", **seo}
    except Exception as e:
        logger.exception("SEO generation failed")
        raise HTTPException(status_code=500, detail=f"SEO generation failed: {e}")

@api_router.get("/articles/{article_id}/seo/score")
async def get_seo_score(article_id: str, request: Request):
    """Compute a 0-100 SEO score with checklist for an article."""
    await get_current_user(request)
    article = await db.articles.find_one({"_id": ObjectId(article_id)})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    checks = []
    score = 0
    def add(passed, weight, label, hint=None):
        nonlocal score
        if passed:
            score += weight
        checks.append({"label": label, "passed": bool(passed), "weight": weight, "hint": hint or ""})
    
    add(bool(article.get("slug")), 10, "Has SEO-friendly slug", "Set a slug from the EN title")
    
    # Each title (FR/EN/FA): present + length ≤ 60
    for lang in ("fr", "en", "fa"):
        t = article.get(f"seo_title_{lang}") or article.get(f"title_{lang}") or ""
        ok = bool(t) and len(t) <= 60
        add(ok, 5, f"SEO title ({lang.upper()})", f"Set a 50-60 char title in {lang.upper()}")
        m = article.get(f"meta_description_{lang}") or article.get(f"summary_{lang}") or ""
        ok2 = 80 <= len(m) <= 160
        add(ok2, 5, f"Meta description ({lang.upper()})", "Aim for 120-155 chars")
    
    add(bool(article.get("image_url")), 10, "Has cover image", "Upload a cover image for OG/Twitter cards")
    add(bool(article.get("focus_keywords")), 10, "Has focus keywords", "Add 3-6 focus keywords (use AI generator)")
    
    # Content length: target ≥ 600 words in at least one language
    import re as _re
    def wc(s): return len(_re.findall(r"\w+", _re.sub(r"<[^>]+>", " ", s or "")))
    max_words = max(wc(article.get("content_en")), wc(article.get("content_fr")), wc(article.get("content_fa")))
    add(max_words >= 600, 15, f"Long-form content ({max_words} words)", "Aim for at least 600 words in one language")
    
    add(bool(article.get("tags")), 5, "Has tags", "Add 2-5 tags for internal linking")
    add(article.get("status") == "published", 5, "Published", "Draft articles aren't indexed")
    
    return {"score": score, "max": 100, "checks": checks}

# Public: list of all categories with article counts
@api_router.get("/categories")
async def list_categories():
    pipeline = [
        {"$match": {"status": "published"}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    result = await db.articles.aggregate(pipeline).to_list(100)
    return [{"slug": (r["_id"] or "news"), "count": r["count"]} for r in result]

# Public: list of all tags with article counts
@api_router.get("/tags")
async def list_tags():
    pipeline = [
        {"$match": {"status": "published"}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 100}
    ]
    result = await db.articles.aggregate(pipeline).to_list(200)
    return [{"slug": slugify(r["_id"]), "name": r["_id"], "count": r["count"]} for r in result if r["_id"]]

# Public: articles by tag
@api_router.get("/articles/by-tag/{tag_slug}", response_model=List[ArticleResponse])
async def articles_by_tag(tag_slug: str, limit: int = 50):
    # Find the canonical tag name(s) whose slugified form matches
    all_tags_doc = await db.articles.distinct("tags", {"status": "published"})
    matching = [t for t in all_tags_doc if t and slugify(t) == tag_slug]
    if not matching:
        return []
    projection = {
        "title_en": 1, "title_fr": 1, "title_fa": 1,
        "summary_en": 1, "summary_fr": 1, "summary_fa": 1,
        "slug": 1, "image_url": 1, "tags": 1, "category": 1,
        "content_type": 1, "status": 1,
        "created_at": 1, "updated_at": 1, "published_at": 1
    }
    arts = await db.articles.find(
        {"status": "published", "tags": {"$in": matching}},
        projection
    ).sort("created_at", -1).to_list(limit)
    return [{
        "id": str(a["_id"]),
        "slug": a.get("slug"),
        "title_en": a.get("title_en", ""),
        "title_fr": a.get("title_fr", ""),
        "title_fa": a.get("title_fa", ""),
        "content_en": "", "content_fr": "", "content_fa": "",
        "summary_en": a.get("summary_en", ""),
        "summary_fr": a.get("summary_fr", ""),
        "summary_fa": a.get("summary_fa", ""),
        "image_url": a.get("image_url"),
        "tags": a.get("tags", []),
        "category": a.get("category", "news"),
        "content_type": a.get("content_type", "news"),
        "status": a.get("status", "published"),
        "created_at": a.get("created_at").isoformat() if a.get("created_at") else "",
        "updated_at": a.get("updated_at").isoformat() if a.get("updated_at") else "",
        "published_at": a.get("published_at").isoformat() if a.get("published_at") else None
    } for a in arts]

# Public: articles by category
@api_router.get("/articles/by-category/{category_slug}", response_model=List[ArticleResponse])
async def articles_by_category(category_slug: str, limit: int = 50):
    projection = {
        "title_en": 1, "title_fr": 1, "title_fa": 1,
        "summary_en": 1, "summary_fr": 1, "summary_fa": 1,
        "slug": 1, "image_url": 1, "tags": 1, "category": 1,
        "content_type": 1, "status": 1,
        "created_at": 1, "updated_at": 1, "published_at": 1
    }
    arts = await db.articles.find(
        {"status": "published", "category": category_slug},
        projection
    ).sort("created_at", -1).to_list(limit)
    return [{
        "id": str(a["_id"]),
        "slug": a.get("slug"),
        "title_en": a.get("title_en", ""),
        "title_fr": a.get("title_fr", ""),
        "title_fa": a.get("title_fa", ""),
        "content_en": "", "content_fr": "", "content_fa": "",
        "summary_en": a.get("summary_en", ""),
        "summary_fr": a.get("summary_fr", ""),
        "summary_fa": a.get("summary_fa", ""),
        "image_url": a.get("image_url"),
        "tags": a.get("tags", []),
        "category": a.get("category", "news"),
        "content_type": a.get("content_type", "news"),
        "status": a.get("status", "published"),
        "created_at": a.get("created_at").isoformat() if a.get("created_at") else "",
        "updated_at": a.get("updated_at").isoformat() if a.get("updated_at") else "",
        "published_at": a.get("published_at").isoformat() if a.get("published_at") else None
    } for a in arts]

# Admin: SEO angle suggester — propose 10 high-potential article topics
@api_router.post("/seo/suggest-angles")
async def suggest_article_angles(request: Request):
    await get_current_user(request)
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    seed_topic = (body.get("topic") or "Iran current affairs").strip()
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        chat = LlmChat(
            api_key=api_key,
            session_id=f"seo-angles-{uuid.uuid4()}",
            system_message="""You are an SEO strategist for Iran Observatory.
Suggest 10 article angles with strong SEO potential (high search interest, low-to-mid competition, evergreen + topical mix).

For each angle, output:
- title_fr: a French headline (50-60 chars)
- title_en: an English headline (50-60 chars)
- primary_keyword: the main searchable keyword/phrase
- search_intent: informational / navigational / commercial / transactional
- estimated_difficulty: low / medium / high
- why_it_matters: 1 sentence on the strategic value for Iran Observatory

Return ONLY a strict JSON array of 10 objects, no markdown, no commentary.
Focus on Iran politics, economy, society, sanctions, diplomacy, human rights."""
        ).with_model("openai", "gpt-5.2")
        
        msg = UserMessage(text=f"Topic focus: {seed_topic}")
        response = await chat.send_message(msg)
        
        import json as _json, re as _re
        raw = _re.sub(r"^```(?:json)?\s*|\s*```$", "", response.strip(), flags=_re.MULTILINE).strip()
        angles = _json.loads(raw)
        if not isinstance(angles, list):
            raise ValueError("Expected JSON array")
        return {"angles": angles[:10]}
    except Exception as e:
        logger.exception("Angle suggestion failed")
        raise HTTPException(status_code=500, detail=f"Angle suggestion failed: {e}")

# Admin: backfill slugs for legacy articles that don't have one
@api_router.post("/admin/backfill-slugs")
async def backfill_slugs(request: Request):
    await get_current_user(request)
    cursor = db.articles.find(
        {"$or": [{"slug": None}, {"slug": ""}, {"slug": {"$exists": False}}]},
        {"_id": 1, "title_en": 1, "title_fr": 1, "title_fa": 1}
    )
    updated = 0
    async for art in cursor:
        seed = art.get("title_en") or art.get("title_fr") or art.get("title_fa") or ""
        base = slugify(seed)
        if not base:
            continue
        final = await ensure_unique_slug(base, str(art["_id"]))
        await db.articles.update_one({"_id": art["_id"]}, {"$set": {"slug": final}})
        updated += 1
    return {"updated_count": updated}


# ---------------------------------------------------------------------------
# Vercel ISR revalidation
# ---------------------------------------------------------------------------
# When admin publishes/edits/deletes an article, ping the Next.js front-end on
# Vercel so it busts its static cache for the affected paths immediately
# (otherwise readers see stale content for up to 5 minutes — the ISR window).
#
# Set VERCEL_REVALIDATE_URL=https://iranobservatory.org/api/revalidate
#     VERCEL_REVALIDATE_SECRET=<same value as REVALIDATE_SECRET on Vercel>
# Both must match for the call to succeed. Non-blocking, best-effort:
# if Vercel is unreachable the admin action still completes.

VERCEL_REVALIDATE_URL = os.environ.get("VERCEL_REVALIDATE_URL", "")
VERCEL_REVALIDATE_SECRET = os.environ.get("VERCEL_REVALIDATE_SECRET", "")


async def trigger_vercel_revalidate(slug: Optional[str] = None) -> None:
    """Fire-and-forget cache bust on Vercel. Failures are logged, never raised."""
    if not VERCEL_REVALIDATE_URL or not VERCEL_REVALIDATE_SECRET:
        return  # Feature not configured — no-op (safe default)

    # Paths to revalidate: home + listings + article detail (× 3 languages)
    paths = ["/fr", "/en", "/fa", "/fr/articles", "/en/articles", "/fa/articles",
             "/fr/studies", "/en/studies", "/fa/studies"]
    if slug:
        paths.extend([f"/fr/article/{slug}", f"/en/article/{slug}", f"/fa/article/{slug}"])

    async def _ping(path: str):
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                params = {"secret": VERCEL_REVALIDATE_SECRET, "path": path}
                async with session.post(VERCEL_REVALIDATE_URL, params=params) as r:
                    if r.status >= 400:
                        logging.warning(f"Vercel revalidate {path} -> {r.status}")
        except Exception as e:
            logging.warning(f"Vercel revalidate {path} failed: {e}")

    # Run all in parallel without awaiting (truly fire-and-forget)
    for p in paths:
        asyncio.create_task(_ping(p))


@api_router.put("/articles/{article_id}")
async def update_article(article_id: str, data: ArticleUpdate, request: Request):
    await get_current_user(request)
    
    # Only update fields the client explicitly sent. Fields omitted from the
    # request payload must NOT be overwritten with their Pydantic defaults
    # (this was wiping image_url, title, content_type, etc. on partial edits).
    update_doc = data.model_dump(exclude_unset=True)
    update_doc["updated_at"] = datetime.now(timezone.utc)
    
    if update_doc.get("status") == "published":
        update_doc["published_at"] = datetime.now(timezone.utc)
    
    # Auto-generate slug if title_en changes and no manual slug provided
    if "title_en" in update_doc and "slug" not in update_doc:
        existing = await db.articles.find_one({"_id": ObjectId(article_id)}, {"slug": 1, "title_en": 1})
        # Only regenerate slug if not set, or the EN title was empty before
        if existing and (not existing.get("slug") or not existing.get("title_en")):
            base = slugify(update_doc["title_en"])
            if base:
                update_doc["slug"] = await ensure_unique_slug(base, article_id)
    elif "slug" in update_doc and update_doc["slug"]:
        # Sanitize user-provided slug
        cleaned = slugify(update_doc["slug"])
        if cleaned:
            update_doc["slug"] = await ensure_unique_slug(cleaned, article_id)
        else:
            update_doc.pop("slug", None)
    
    result = await db.articles.update_one(
        {"_id": ObjectId(article_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Bust Vercel ISR cache so the change is live within seconds
    article = await db.articles.find_one({"_id": ObjectId(article_id)}, {"slug": 1})
    await trigger_vercel_revalidate(slug=(article or {}).get("slug"))
    
    return {"message": "Article updated"}

@api_router.delete("/articles/{article_id}")
async def delete_article(article_id: str, request: Request):
    await get_current_user(request)
    # Capture slug before deletion so we can revalidate the right path
    pre = await db.articles.find_one({"_id": ObjectId(article_id)}, {"slug": 1})
    result = await db.articles.delete_one({"_id": ObjectId(article_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    await trigger_vercel_revalidate(slug=(pre or {}).get("slug"))
    return {"message": "Article deleted"}

# SEO: Pre-render meta tags for social sharing and crawlers
@api_router.get("/og/article/{article_id}")
async def article_og_meta(article_id: str):
    """Return pre-rendered HTML with meta tags for an article — for link previews and SEO crawlers."""
    from fastapi.responses import HTMLResponse
    article = await db.articles.find_one({"_id": ObjectId(article_id)}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404)
    
    title = article.get("title_en", "") or article.get("title_fr", "")
    desc = article.get("summary_en", "") or article.get("summary_fr", "")
    image = article.get("image_url", "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png")
    url = f"https://iranobservatory.org/article/{article_id}"
    
    html = f"""<!DOCTYPE html><html><head>
<title>{title} | Iran Observatory</title>
<meta name="description" content="{desc[:160]}" />
<link rel="canonical" href="{url}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="{url}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc[:160]}" />
<meta property="og:image" content="{image}" />
<meta property="og:site_name" content="Iran Observatory" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc[:160]}" />
<meta name="twitter:image" content="{image}" />
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"Article","headline":"{title}","description":"{desc[:160]}","image":"{image}","url":"{url}","publisher":{{"@type":"Organization","name":"Iran Observatory"}}}}
</script>
<meta http-equiv="refresh" content="0;url={url}" />
</head><body><p>Redirecting to <a href="{url}">{title}</a></p></body></html>"""
    return HTMLResponse(content=html)

@api_router.post("/articles/{article_id}/publish")
async def publish_article(article_id: str, request: Request):
    await get_current_user(request)
    
    result = await db.articles.update_one(
        {"_id": ObjectId(article_id)},
        {"$set": {
            "status": "published",
            "published_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    
    article = await db.articles.find_one({"_id": ObjectId(article_id)}, {"slug": 1})
    await trigger_vercel_revalidate(slug=(article or {}).get("slug"))
    
    return {"message": "Article published"}

# PDF Upload endpoint
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Ensure logo is available for PDF generation
import urllib.request
_logo_path = UPLOAD_DIR / "logo.png"
if not _logo_path.exists():
    try:
        urllib.request.urlretrieve("https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png", str(_logo_path))
    except Exception:
        pass

@api_router.post("/upload/pdf")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    await get_current_user(request)
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}.pdf"
    
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    
    # Store in GridFS (persistent across redeploys)
    await fs_bucket.upload_from_stream(
        safe_name,
        content,
        metadata={"content_type": "application/pdf", "original_filename": file.filename}
    )
    
    # Return a RELATIVE URL so it resolves to the current origin (prod or preview),
    # avoiding cross-environment URL mismatch when env vars are misconfigured.
    pdf_url = f"/api/files/{safe_name}"
    
    return {"pdf_url": pdf_url, "filename": file.filename}

@api_router.post("/upload/image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    await get_current_user(request)
    
    ext = file.filename.lower().rsplit('.', 1)[-1] if '.' in file.filename else ''
    if ext not in ('jpg', 'jpeg', 'png', 'webp', 'gif'):
        raise HTTPException(status_code=400, detail="Only image files allowed (jpg, png, webp, gif)")
    
    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}.{ext}"
    
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    media_types = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif'}
    # Store in GridFS (persistent across redeploys)
    await fs_bucket.upload_from_stream(
        safe_name,
        content,
        metadata={"content_type": media_types.get(ext, 'application/octet-stream'), "original_filename": file.filename}
    )
    
    # Return a RELATIVE URL so it resolves to the current origin (prod or preview),
    # avoiding cross-environment URL mismatch when env vars are misconfigured.
    image_url = f"/api/files/{safe_name}"
    
    return {"image_url": image_url, "filename": file.filename}

@api_router.get("/files/{filename}")
async def serve_file(filename: str):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    media_types = {'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif'}
    media_type = media_types.get(ext, 'application/octet-stream')
    
    # Try GridFS first (new uploads)
    try:
        cursor = fs_bucket.find({"filename": filename}).sort("uploadDate", -1).limit(1)
        gridfs_docs = await cursor.to_list(1)
        if gridfs_docs:
            grid_file = gridfs_docs[0]
            stream = await fs_bucket.open_download_stream(grid_file["_id"])
            
            async def file_iterator():
                while True:
                    chunk = await stream.readchunk()
                    if not chunk:
                        break
                    yield chunk
            
            return StreamingResponse(
                file_iterator(),
                media_type=media_type,
                headers={
                    "Content-Disposition": f'inline; filename="{filename}"',
                    "Cache-Control": "public, max-age=31536000"
                }
            )
    except Exception as e:
        logger.warning(f"GridFS lookup failed for {filename}: {e}")
    
    # Fallback to local disk (backwards compatibility for legacy files / cached brief PDFs)
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        return FileResponse(file_path, media_type=media_type, filename=filename)
    
    raise HTTPException(status_code=404, detail="File not found")

# Admin: scan & repair article image_urls that point to other environments.
# Returns a list of fixed articles + their new (relative) URL. Also reports
# articles whose underlying file is truly missing from GridFS so the admin
# can re-upload them.
@api_router.post("/admin/repair-image-urls")
async def repair_image_urls(request: Request):
    await get_current_user(request)
    
    import re as _re
    fixed = []
    still_broken = []
    
    # Match any absolute URL ending in /api/files/<filename>
    pat = _re.compile(r"^https?://[^/]+(/api/files/[^/?#]+)")
    
    cursor = db.articles.find({"image_url": {"$nin": [None, ""]}}, {"_id": 1, "image_url": 1, "title_en": 1, "title_fr": 1, "content_type": 1})
    async for art in cursor:
        url = art.get("image_url") or ""
        # Rewrite absolute → relative if it points to our /api/files/ path
        m = pat.match(url)
        new_url = url
        was_rewritten = False
        if m:
            new_url = m.group(1)  # relative path
            if new_url != url:
                was_rewritten = True
        
        # Skip external CDN images (e.g. Twitter, RSS source images)
        if not new_url.startswith("/api/files/"):
            continue
        
        filename = new_url.rsplit("/", 1)[-1]
        exists_in_gridfs = await db["uploads.files"].find_one({"filename": filename}, {"_id": 1}) is not None
        
        if was_rewritten:
            await db.articles.update_one(
                {"_id": art["_id"]},
                {"$set": {"image_url": new_url}}
            )
            fixed.append({
                "id": str(art["_id"]),
                "title": art.get("title_en") or art.get("title_fr") or "(untitled)",
                "content_type": art.get("content_type"),
                "old_url": url,
                "new_url": new_url,
                "file_present": exists_in_gridfs
            })
        
        if not exists_in_gridfs:
            still_broken.append({
                "id": str(art["_id"]),
                "title": art.get("title_en") or art.get("title_fr") or "(untitled)",
                "content_type": art.get("content_type"),
                "image_url": new_url
            })
    
    return {
        "rewritten_count": len(fixed),
        "rewritten": fixed,
        "still_broken_count": len(still_broken),
        "still_broken": still_broken
    }

# Generate PDF from article HTML content
@api_router.get("/articles/{article_id}/pdf")
async def generate_article_pdf(article_id: str):
    article = await db.articles.find_one({"_id": ObjectId(article_id)})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check if PDF already cached
    safe_name = f"brief-{article_id}.pdf"
    pdf_path = UPLOAD_DIR / safe_name
    if pdf_path.exists():
        return FileResponse(pdf_path, media_type="application/pdf", filename=f"{article.get('title_en', 'brief')[:50]}.pdf")
    
    title = article.get("title_en", "") or article.get("title_fr", "")
    content = article.get("content_en", "") or article.get("content_fr", "")
    summary = article.get("summary_en", "") or article.get("summary_fr", "")
    date_str = article.get('created_at', '').strftime('%B %d, %Y') if hasattr(article.get('created_at', ''), 'strftime') else ''
    
    try:
        import re, io, html as html_mod
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.colors import HexColor
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.units import mm
        
        def strip_html(html_str):
            text = re.sub(r'<br\s*/?>', '\n', html_str)
            text = re.sub(r'</(p|div|h[1-6]|li|tr)>', '\n', text)
            text = re.sub(r'<li[^>]*>', '  \u2022 ', text)
            text = re.sub(r'<[^>]+>', '', text)
            text = html_mod.unescape(text)
            return re.sub(r'\n{3,}', '\n\n', text).strip()
        
        sections = []
        h2_parts = re.split(r'<h2[^>]*>(.*?)</h2>', content, flags=re.DOTALL)
        if len(h2_parts) > 1:
            for i in range(1, len(h2_parts), 2):
                heading = strip_html(h2_parts[i])
                body = strip_html(h2_parts[i + 1]) if i + 1 < len(h2_parts) else ''
                sections.append((heading, body))
        else:
            sections.append(('', strip_html(content)))
        
        def gen_pdf():
            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)
            
            styles = getSampleStyleSheet()
            styles.add(ParagraphStyle('OrgName', parent=styles['Normal'], fontSize=10, textColor=HexColor('#3DB883'), spaceAfter=2, fontName='Helvetica-Bold'))
            styles.add(ParagraphStyle('DateLine', parent=styles['Normal'], fontSize=8, textColor=HexColor('#999999'), spaceAfter=4))
            styles.add(ParagraphStyle('BriefTitle', parent=styles['Title'], fontSize=20, textColor=HexColor('#1E3A5F'), spaceAfter=8, fontName='Helvetica-Bold'))
            styles.add(ParagraphStyle('Summary', parent=styles['Normal'], fontSize=11, textColor=HexColor('#555555'), spaceAfter=12, fontName='Helvetica-Oblique', backColor=HexColor('#f5f7fa'), borderPadding=8))
            styles.add(ParagraphStyle('SectionHead', parent=styles['Heading2'], fontSize=14, textColor=HexColor('#1E3A5F'), spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold'))
            styles.add(ParagraphStyle('BodyPara', parent=styles['Normal'], fontSize=10, textColor=HexColor('#333333'), spaceAfter=6, leading=15))
            styles.add(ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=HexColor('#999999'), alignment=1))
            
            story = []
            # Logo
            logo_path = UPLOAD_DIR / "logo.png"
            if logo_path.exists():
                from reportlab.platypus import Image as RLImage
                story.append(RLImage(str(logo_path), width=50*mm, height=15*mm, kind='proportional'))
                story.append(Spacer(1, 4))
            story.append(Paragraph('IRAN OBSERVATORY', styles['OrgName']))
            story.append(Paragraph(f'Independent Insights into Iran | {date_str}', styles['DateLine']))
            story.append(HRFlowable(width='100%', color=HexColor('#1E3A5F'), thickness=1.5, spaceAfter=10))
            story.append(Paragraph(title, styles['BriefTitle']))
            if summary:
                story.append(Paragraph(summary, styles['Summary']))
            story.append(Spacer(1, 6))
            
            for heading, body in sections:
                if heading:
                    story.append(Paragraph(heading, styles['SectionHead']))
                    story.append(HRFlowable(width='100%', color=HexColor('#e0e0e0'), thickness=0.5, spaceAfter=4))
                if body:
                    for para in body.split('\n'):
                        para = para.strip()
                        if para:
                            story.append(Paragraph(para, styles['BodyPara']))
                    story.append(Spacer(1, 4))
            
            story.append(Spacer(1, 12))
            story.append(HRFlowable(width='100%', color=HexColor('#1E3A5F'), thickness=1, spaceAfter=6))
            story.append(Paragraph('Iran Observatory | iranobservatory.org', styles['Footer']))
            story.append(Paragraph('Independent platform for fact-based analysis on Iran', styles['Footer']))
            
            doc.build(story)
            return buf.getvalue()
        
        pdf_bytes = await asyncio.to_thread(gen_pdf)
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
        return FileResponse(pdf_path, media_type="application/pdf", filename=f"{title[:50]}.pdf")
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

# Subscriber / Email collection endpoints
@api_router.post("/subscribers")
async def subscribe(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    newsletter = body.get("newsletter", False)
    article_id = body.get("article_id")
    raw_lang = (body.get("language") or "").lower()
    language = raw_lang if raw_lang in ("en", "fr", "fa") else "fr"
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    
    existing = await db.subscribers.find_one({"email": email})
    if existing:
        # Update newsletter preference if needed
        if newsletter and not existing.get("newsletter"):
            await db.subscribers.update_one(
                {"_id": existing["_id"]},
                {"$set": {"newsletter": True}}
            )
        # Update language if provided
        new_lang = (body.get("language") or "").lower()
        if new_lang in ("en", "fr", "fa") and existing.get("language") != new_lang:
            await db.subscribers.update_one(
                {"_id": existing["_id"]},
                {"$set": {"language": new_lang}}
            )
        # Log the download
        if article_id:
            await db.subscribers.update_one(
                {"_id": existing["_id"]},
                {"$push": {"downloads": {"article_id": article_id, "date": datetime.now(timezone.utc).isoformat()}}}
            )
        return {"message": "Access granted", "already_subscribed": True}
    
    subscriber = {
        "email": email,
        "newsletter": newsletter,
        "language": language,
        "downloads": [{"article_id": article_id, "date": datetime.now(timezone.utc).isoformat()}] if article_id else [],
        "created_at": datetime.now(timezone.utc)
    }
    await db.subscribers.insert_one(subscriber)
    
    # Send confirmation email if newsletter signup
    if newsletter:
        try:
            resend_key = os.environ.get("RESEND_API_KEY")
            if resend_key:
                import resend
                resend.api_key = resend_key
                sender = os.environ.get("SENDER_EMAIL", "newsletter@iranobservatory.org")
                base_url = os.environ.get('FRONTEND_URL', 'https://iranobservatory.org')
                logo_url = "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png"
                
                sub_lang = (body.get("language") or "fr").lower()
                if sub_lang not in NEWSLETTER_I18N:
                    sub_lang = "fr"
                tl = NEWSLETTER_I18N[sub_lang]
                bullets_html = "".join(f"<li>{b}</li>" for b in tl["welcome_bullets"])
                
                confirm_html = f"""<!DOCTYPE html><html dir="{tl['dir']}" lang="{sub_lang}"><body style="margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Arial,sans-serif;" dir="{tl['dir']}">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#fff;padding:32px 40px 8px;text-align:center;"><img src="{logo_url}" alt="Iran Observatory" style="height:90px;max-height:90px;display:inline-block;" /></div>
  <div style="background:#1E3A5F;padding:16px 40px;text-align:center;"><p style="color:#3DB883;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:bold;">{tl['welcome_badge']}</p></div>
  <div style="padding:32px 40px;text-align:{('right' if tl['dir']=='rtl' else 'left')};">
    <h2 style="color:#1E3A5F;font-size:22px;margin:0 0 16px;">{tl['welcome_heading']}</h2>
    <p style="color:#555;font-size:15px;line-height:1.7;">{tl['welcome_intro']}</p>
    <ul style="color:#555;font-size:14px;line-height:2;">{bullets_html}</ul>
    <p style="color:#555;font-size:14px;line-height:1.7;margin-top:16px;">{tl['welcome_visit']} <a href="{base_url}" style="color:#3DB883;">{base_url}</a></p>
  </div>
  <div style="padding:20px 40px;background:#f8f9fb;text-align:center;">
    <p style="color:#999;font-size:11px;margin:0;">{tl['site_brand']}</p>
    <p style="color:#bbb;font-size:10px;margin:8px 0 0;"><a href="{base_url}/api/unsubscribe?email={email}" style="color:#999;">{tl['unsubscribe']}</a></p>
  </div>
</div></body></html>"""
                
                await asyncio.to_thread(resend.Emails.send, {
                    "from": sender,
                    "to": [email],
                    "subject": tl["welcome_subject"],
                    "html": confirm_html
                })
                logger.info(f"Confirmation email sent to {email} ({sub_lang})")
        except Exception as e:
            logger.warning(f"Failed to send confirmation email: {e}")
    
    return {"message": "Subscribed successfully"}

# Unsubscribe endpoint
@api_router.get("/unsubscribe")
async def unsubscribe_page(email: str = ""):
    """Simple unsubscribe — removes newsletter flag."""
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    result = await db.subscribers.update_one(
        {"email": email.strip().lower()},
        {"$set": {"newsletter": False}}
    )
    html = f"""<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;">
    <h2 style="color:#1E3A5F;">Unsubscribed</h2>
    <p style="color:#666;">You have been unsubscribed from Iran Observatory newsletter.</p>
    <p style="color:#999;font-size:12px;margin-top:20px;">You can re-subscribe anytime at <a href="https://iranobservatory.org" style="color:#3DB883;">iranobservatory.org</a></p>
    </body></html>"""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html)

# Admin: manually add subscriber
@api_router.post("/subscribers/add")
async def admin_add_subscriber(request: Request):
    await get_current_user(request)
    body = await request.json()
    email = body.get("email", "").strip().lower()
    newsletter = body.get("newsletter", True)
    language = (body.get("language") or "fr").lower()
    if language not in ("en", "fr", "fa"):
        language = "fr"
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    
    existing = await db.subscribers.find_one({"email": email})
    if existing:
        await db.subscribers.update_one(
            {"_id": existing["_id"]},
            {"$set": {"newsletter": newsletter, "language": language}}
        )
        return {"message": "Subscriber updated"}
    
    await db.subscribers.insert_one({
        "email": email,
        "newsletter": newsletter,
        "language": language,
        "downloads": [],
        "created_at": datetime.now(timezone.utc)
    })
    return {"message": "Subscriber added"}

# Admin: update subscriber language
@api_router.patch("/subscribers/{sub_id}")
async def update_subscriber(sub_id: str, request: Request):
    await get_current_user(request)
    body = await request.json()
    update = {}
    if "language" in body:
        lang = (body.get("language") or "").lower()
        if lang not in ("en", "fr", "fa"):
            raise HTTPException(status_code=400, detail="language must be one of en/fr/fa")
        update["language"] = lang
    if "newsletter" in body:
        update["newsletter"] = bool(body["newsletter"])
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    try:
        oid = ObjectId(sub_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid subscriber id")
    result = await db.subscribers.update_one(
        {"_id": oid},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return {"message": "Subscriber updated", **update}

# Admin: founder introduction settings (for newsletter personalization)
@api_router.get("/settings/founder")
async def get_founder_settings(request: Request):
    await get_current_user(request)
    doc = await db.settings.find_one({"key": "founder_intro"}, {"_id": 0, "key": 0}) or {}
    # Backfill defaults so the frontend always sees the same shape
    legacy_name = doc.get("name", "")
    legacy_title = doc.get("title", "")
    legacy_intro = doc.get("intro_text", "")
    return {
        "enabled": bool(doc.get("enabled", False)),
        "photo_url": doc.get("photo_url", ""),
        "signature_url": doc.get("signature_url", ""),
        "name_fr": doc.get("name_fr", legacy_name),
        "name_en": doc.get("name_en", legacy_name),
        "name_fa": doc.get("name_fa", ""),
        "title_fr": doc.get("title_fr", legacy_title),
        "title_en": doc.get("title_en", legacy_title),
        "title_fa": doc.get("title_fa", ""),
        "intro_text_fr": doc.get("intro_text_fr", legacy_intro),
        "intro_text_en": doc.get("intro_text_en", legacy_intro),
        "intro_text_fa": doc.get("intro_text_fa", ""),
    }

@api_router.put("/settings/founder")
async def update_founder_settings(request: Request):
    await get_current_user(request)
    body = await request.json()
    update = {
        "enabled": bool(body.get("enabled", False)),
        "photo_url": (body.get("photo_url") or "").strip(),
        "signature_url": (body.get("signature_url") or "").strip(),
        "name_fr": (body.get("name_fr") or "").strip(),
        "name_en": (body.get("name_en") or "").strip(),
        "name_fa": (body.get("name_fa") or "").strip(),
        "title_fr": (body.get("title_fr") or "").strip(),
        "title_en": (body.get("title_en") or "").strip(),
        "title_fa": (body.get("title_fa") or "").strip(),
        "intro_text_fr": (body.get("intro_text_fr") or "").strip(),
        "intro_text_en": (body.get("intro_text_en") or "").strip(),
        "intro_text_fa": (body.get("intro_text_fa") or "").strip(),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.settings.update_one(
        {"key": "founder_intro"},
        {"$set": update},
        upsert=True
    )
    return {"message": "Founder settings saved"}

# Admin: send custom newsletter
@api_router.post("/newsletter/custom")
async def send_custom_newsletter(request: Request):
    """Admin: Send a custom newsletter with user-written content."""
    await get_current_user(request)
    body = await request.json()
    subject = body.get("subject", "")
    content = body.get("content", "")
    
    if not subject or not content:
        raise HTTPException(status_code=400, detail="Subject and content required")
    
    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        raise HTTPException(status_code=500, detail="RESEND_API_KEY not configured")
    
    import resend
    resend.api_key = resend_key
    sender = os.environ.get("SENDER_EMAIL", "newsletter@iranobservatory.org")
    base_url = os.environ.get('FRONTEND_URL', 'https://iranobservatory.org')
    logo_url = "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png"
    helloasso_url = "https://www.helloasso.com/associations/dorna/formulaires/2"
    
    html = f"""<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#fff;">
  <div style="background:#fff;padding:32px 40px 8px;text-align:center;"><img src="{logo_url}" alt="Iran Observatory" style="height:100px;max-height:100px;margin-bottom:18px;display:inline-block;" /></div>
  <div style="background:#1E3A5F;padding:20px 40px;text-align:center;">
    <div style="width:60px;height:3px;background:#3DB883;margin:0 auto 12px;"></div>
    <p style="color:white;margin:0;font-size:18px;font-weight:bold;">{subject}</p>
  </div>
  <div style="padding:32px 40px;">
    {content}
  </div>
  <div style="background:linear-gradient(135deg,#1E3A5F 0%,#2a4d75 100%);padding:24px 40px;text-align:center;">
    <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0 0 12px;">Support Iran Observatory's independence</p>
    <a href="{helloasso_url}" style="display:inline-block;background:#3DB883;color:white;padding:8px 24px;font-size:11px;text-transform:uppercase;letter-spacing:2px;text-decoration:none;font-weight:bold;border-radius:20px;">Support Us</a>
  </div>
  <div style="padding:20px 40px;background:#f8f9fb;text-align:center;">
    <p style="color:#1E3A5F;font-size:12px;font-weight:bold;margin:0 0 4px;">Iran Observatory</p>
    <p style="color:#bbb;font-size:10px;margin:8px 0 0;"><a href="{base_url}/api/unsubscribe?email={{{{email}}}}" style="color:#999;">Unsubscribe</a></p>
  </div>
</div></body></html>"""
    
    subscribers = await db.subscribers.find({"newsletter": True}, {"_id": 0, "email": 1}).to_list(10000)
    if not subscribers:
        return {"status": "no_subscribers", "sent": 0}
    
    sent_count = 0
    errors = []
    for sub in subscribers:
        try:
            email_html = html.replace("{{email}}", sub["email"])
            await asyncio.to_thread(resend.Emails.send, {
                "from": sender,
                "to": [sub["email"]],
                "subject": subject,
                "html": email_html
            })
            sent_count += 1
        except Exception as e:
            errors.append(f"{sub['email']}: {str(e)}")
    
    return {"status": "sent", "sent": sent_count, "total": len(subscribers), "errors": errors[:10]}

@api_router.get("/subscribers")
async def get_subscribers(request: Request):
    await get_current_user(request)
    subs = await db.subscribers.find({}).sort("created_at", -1).to_list(500)
    return [{
        "id": str(s["_id"]),
        "email": s["email"],
        "newsletter": s.get("newsletter", False),
        "language": s.get("language") or "fr",
        "downloads_count": len(s.get("downloads", [])),
        "created_at": s.get("created_at").isoformat() if s.get("created_at") else ""
    } for s in subs]

@api_router.delete("/subscribers/{sub_id}")
async def delete_subscriber(sub_id: str, request: Request):
    await get_current_user(request)
    result = await db.subscribers.delete_one({"_id": ObjectId(sub_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return {"message": "Subscriber deleted"}

# Stats endpoint
@api_router.get("/stats")
async def get_stats(request: Request):
    await get_current_user(request)
    
    total_articles = await db.articles.count_documents({})
    published = await db.articles.count_documents({"status": "published"})
    drafts = await db.articles.count_documents({"status": "draft"})
    rss_items = await db.rss_items.count_documents({"processed": False, "suggestion_status": "suggested"})
    feeds = await db.rss_feeds.count_documents({})
    
    return {
        "total_articles": total_articles,
        "published": published,
        "drafts": drafts,
        "pending_rss_items": rss_items,
        "active_feeds": feeds
    }

# ============ IRAN MONITOR DASHBOARD ============

# Telegram channel scraper
async def _fetch_telegram_channel(channel: str, limit: int = 20):
    """Fetch latest messages from a public Telegram channel."""
    import re as regex
    url = f"https://t.me/s/{channel}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15) as resp:
                html = await resp.text()
        
        messages = regex.findall(r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', html, regex.DOTALL)
        dates = regex.findall(r'<time[^>]+datetime="([^"]+)"', html)
        
        results = []
        for i, msg in enumerate(messages[:limit]):
            clean_text = regex.sub(r'<[^>]+>', '', msg).strip()
            if clean_text:
                results.append({
                    "text": clean_text[:500],
                    "date": dates[i] if i < len(dates) else "",
                    "channel": channel
                })
        return results
    except Exception as e:
        logger.error(f"Telegram fetch error for {channel}: {e}")
        return []

# Compute dashboard indexes using AI
async def _compute_dashboard_indexes():
    """Analyze RSS items + Telegram to compute all dashboard indexes."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import json as json_lib
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        
        # Gather recent RSS items (last 7 days)
        week_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_items = await db.rss_items.find(
            {"created_at": {"$gte": week_ago}}
        ).sort("created_at", -1).to_list(100)
        
        # Fetch Telegram HRA data
        hra_messages = await _fetch_telegram_channel("hranews", 20)
        vahid_messages = await _fetch_telegram_channel("VahidOnline", 20)
        
        # Build context for AI
        rss_titles = "\n".join([f"- {item['title'][:120]} ({item.get('published', '')[:10]})" for item in recent_items[:60]])
        hra_texts = "\n".join([f"- [{msg.get('date', '')[:10]}] {msg['text'][:200]}" for msg in hra_messages[:15]])
        vahid_texts = "\n".join([f"- [{msg.get('date', '')[:10]}] {msg['text'][:200]}" for msg in vahid_messages[:15]])
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"dashboard-{uuid.uuid4()}",
            system_message=EDITORIAL_SOURCE_RULES + """

You are a geopolitical data analyst for Iran Observatory. Produce accurate, source-based quantitative indexes. Return ONLY valid JSON."""
        ).with_model("openai", "gpt-5.2")
        
        # CALL 1: Core indexes
        prompt1 = f"""Based on these Iran news items, produce a JSON dashboard.

NEWS (last 30 days):
{rss_titles[:3000]}

TELEGRAM — HRA News:
{hra_texts[:1500]}

TELEGRAM — VahidOnline:
{vahid_texts[:1500]}

Return ONLY this JSON:
{{"situation_summary": ["<bullet 1>","<bullet 2>","<bullet 3>"],
"updated_context": "<1 paragraph: what changed this week, what to watch>",
"tension_index": {{"score": <float 1-10>, "level": "<LOW|MODERATE|ELEVATED|CRITICAL>", "summary": "<1 sentence>", "key_drivers": ["<driver1>","<driver2>","<driver3>","<driver4>"]}},
"tension_history": [<30 floats 1-10, daily tension estimate, ending with today>],
"human_rights_index": {{"summary": "<1 sentence>", "key_factors": ["<factor1>","<factor2>","<factor3>"]}},
"internet_blackout_days": <int, number of days Iran has been without international internet based on NetBlocks reports in the sources>,
"protests_reported": <int>,
"hr_timeline": [{{"date":"<YYYY-MM-DD>","event":"<what happened>","source":"<HRA News/VahidOnline>"}}],
"hr_key_issues": ["<issue 1>","<issue 2>","<issue 3>"]}}
Max 10 HR timeline events. Based ONLY on provided sources."""

        msg1 = UserMessage(text=prompt1)
        response1 = await chat.send_message(msg1)
        
        r1 = response1.strip()
        if r1.startswith("```"):
            r1 = r1.split("```")[1]
            if r1.startswith("json"):
                r1 = r1[4:]
        r1 = r1.strip()
        start1 = r1.find('{')
        if start1 >= 0:
            brace_count = 0
            in_string = False
            escape_next = False
            for idx in range(start1, len(r1)):
                ch = r1[idx]
                if escape_next:
                    escape_next = False
                    continue
                if ch == '\\':
                    escape_next = True
                    continue
                if ch == '"':
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if ch == '{':
                    brace_count += 1
                elif ch == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        r1 = r1[start1:idx + 1]
                        break
        dashboard_data = json_lib.loads(r1.strip())
        
        # HARDCODED HR FIGURES from verified independent international sources
        # Executions: IHR/ECPM report (April 2026) — at least 1,639 in 2025 (highest since 1989, +68% from 975 in 2024)
        # IHR (Iran Human Rights, Oslo) figure is the most conservative/verified international source
        # Political prisoners: ~15,000 estimated (worldpopulationreview.com, 2026); HRW reports "tens of thousands" of arbitrary arrests
        # HRANA documented 53,000+ arrests post-protest; 2,800+ named detainees as of Feb 2026
        hri = dashboard_data.get("human_rights_index", {})
        hri["executions"] = "1,639+"
        hri["executions_source"] = "IHR/ECPM (2025)"
        hri["executions_detail"] = "Highest since 1989. +68% vs 2024 (975). 48 women, 11 public. Independent monitoring: IHR (Oslo) is the most conservative international source."
        hri["political_prisoners"] = "15,000+"
        hri["political_prisoners_source"] = "HRW / HRANA (2026)"
        hri["political_prisoners_detail"] = "53,000+ arrests documented post-Jan 2026 protests. 2,800+ named detainees."
        hri["internet_blackout_days"] = "68+"
        hri["internet_connectivity"] = "4%"
        hri["internet_source"] = "NetBlocks (May 2026)"
        hri["internet_detail"] = "Longest nationwide internet shutdown ever recorded. Near-total since Feb 28. $1.8B economic cost."
        dashboard_data["human_rights_index"] = hri
        dashboard_data["internet_blackout_days"] = 68
        dashboard_data["protests_source"] = "HRA News / VahidOnline (Jan-May 2026)"
        
        # CALL 2: Economic indicators only — sanctions are hardcoded from official sources
        chat2 = LlmChat(
            api_key=api_key,
            session_id=f"dashboard2-{uuid.uuid4()}",
            system_message=EDITORIAL_SOURCE_RULES + """

You are a geopolitical data analyst. Return ONLY valid JSON."""
        ).with_model("openai", "gpt-5.2")
        
        prompt2 = f"""Based on these Iran news sources and INTERNATIONAL independent economic data, produce economic indicators.

NEWS headlines:
{rss_titles[:2000]}

VERIFIED ECONOMIC DATA (use these as baseline — from IMF, World Bank, independent analysts):
- IRR/USD parallel market: ~1,400,000-1,500,000 IRR per USD (early 2026, 44% YoY depreciation — source: World Bank, investing.com)
- Inflation: 62.2% YoY in Feb 2026 (food: 99%) — source: World Bank. IMF forecasts 68.9%.
- GDP: -2.7% in 2025/26 fiscal year — source: World Bank.
- Oil exports: ~1.1-1.4 mbpd in 2026 (down from 2.0 mbpd peak in 2025). March 2026: 1.136 mbpd. Revenue ~$3.6B/month — source: tanker-tracking (FDD/UANI/OilPrice).
- Brent crude: ~$106-107/bbl. Iranian crude trades at $10-20 discount due to sanctions — source: trading economics.
- US naval blockade since April 12, 2026 has severely restricted Iranian exports through Strait of Hormuz.

Return ONLY this JSON:
{{"economic_indicators": {{
  "summary": "<2-3 sentences on Iran's economic situation citing international sources>",
  "metrics": [
    {{"label":"IRR/USD (Parallel Market)","value":"~1,450,000","change_pct": -44,"period":"YoY","trend_data":[850000,920000,1000000,1050000,1150000,1300000,1420000,1450000],"context":"<1 sentence — source: World Bank/parallel market trackers>"}},
    {{"label":"Brent Crude Oil","value":"<current $/barrel from news>","change_pct": <float>,"period":"MoM","trend_data":[<8 floats>],"context":"<1 sentence>"}},
    {{"label":"Iranian Crude (est.)","value":"<Brent minus $10-20 discount>","change_pct": <float>,"period":"MoM","trend_data":[<8 floats, each ~$10-20 below Brent trend>],"context":"Iranian heavy crude trades at $10-20/bbl discount to Brent due to sanctions and limited buyers (China, India)."}},
    {{"label":"Inflation Rate (YoY)","value":"62.2%","change_pct": 62.2,"period":"YoY","trend_data":[35,38,40,42,45,50,58,62],"context":"World Bank Feb 2026: 62.2% overall, 99% food inflation. IMF forecasts 69%."}},
    {{"label":"GDP Growth","value":"-2.7%","change_pct": -2.7,"period":"2025/26 FY","trend_data":[4.5,3.8,3.0,1.5,0.5,-0.8,-1.5,-2.7],"context":"World Bank: First contraction since 2020, driven by conflict, sanctions, energy shortages."}},
    {{"label":"Oil Export Revenue","value":"<est. from context>","change_pct": <float>,"period":"MoM","trend_data":[<8 floats>],"context":"<1 sentence — IMF notes ~16% export decline in 2025>"}}
  ]
}}}}
CRITICAL: Use the VERIFIED baseline data provided above. Do NOT use Iranian government figures (CBI official rate of 42,000 is fictitious). Use World Bank, IMF, and independent market data. All values must be non-null numbers."""

        msg2 = UserMessage(text=prompt2)
        response2 = await chat2.send_message(msg2)
        
        r2 = response2.strip()
        if r2.startswith("```"):
            r2 = r2.split("```")[1]
            if r2.startswith("json"):
                r2 = r2[4:]
        # Extract only the first valid JSON object
        r2 = r2.strip()
        start = r2.find('{')
        if start >= 0:
            brace_count = 0
            in_string = False
            escape = False
            for idx in range(start, len(r2)):
                ch = r2[idx]
                if escape:
                    escape = False
                    continue
                if ch == '\\':
                    escape = True
                    continue
                if ch == '"' and not escape:
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if ch == '{':
                    brace_count += 1
                elif ch == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        r2 = r2[start:idx + 1]
                        break
        data2 = json_lib.loads(r2.strip())
        
        # Merge economic data
        dashboard_data.update(data2)
        
        # HARDCODED SANCTIONS DATA — sourced from official EU Council and US Treasury OFAC pages
        # Last verified: April 2026
        dashboard_data["sanctions_tracker"] = {
            "us_active_count": "4,000+",
            "eu_active_count": "500+",
            "un_active_count": "121",
            "us_persons_designated": "900+",
            "us_entities_designated": "3,100+",
            "eu_persons_designated": "300+",
            "eu_entities_designated": "200+",
            "us_trend": [15, 22, 18, 25, 30, 20, 28, 35, 22, 18, 24, 30],
            "eu_trend": [3, 5, 2, 8, 4, 6, 3, 10, 5, 4, 8, 6],
            "sector_breakdown": [
                {"sector": "Oil & Energy", "us_count": 800, "eu_count": 80, "un_count": 2},
                {"sector": "Financial & Banking", "us_count": 700, "eu_count": 65, "un_count": 2},
                {"sector": "Nuclear & Proliferation", "us_count": 500, "eu_count": 90, "un_count": 6},
                {"sector": "Military & Defense (IRGC)", "us_count": 600, "eu_count": 95, "un_count": 3},
                {"sector": "Human Rights & Repression", "us_count": 400, "eu_count": 120, "un_count": 0},
                {"sector": "Shipping & Trade", "us_count": 550, "eu_count": 50, "un_count": 2},
                {"sector": "Drones & UAV", "us_count": 180, "eu_count": 50, "un_count": 1},
                {"sector": "Technology & Cyber", "us_count": 200, "eu_count": 40, "un_count": 0}
            ],
            "recent_packages": [
                {"date": "2026-03-30", "issuer": "EU", "title": "EU extends Iran human rights sanctions regime until April 2027", "persons_added": 0, "entities_added": 0, "details": "Council Decision (CFSP) 2026/... extending the framework of restrictive measures in view of the situation in Iran."},
                {"date": "2026-03-20", "issuer": "US", "title": "OFAC General License U — Authorizing delivery/sale of Iranian-origin crude loaded on vessels", "persons_added": 0, "entities_added": 0, "details": "Enforcement action related to seized Iranian oil shipments."},
                {"date": "2026-02-19", "issuer": "EU", "title": "EU designates IRGC as terrorist organisation", "persons_added": 0, "entities_added": 1, "details": "The Islamic Revolutionary Guard Corps listed under EU counter-terrorism sanctions regime. All IRGC funds in EU frozen."},
                {"date": "2026-01-23", "issuer": "US", "title": "OFAC General License T — Safety/environmental transactions for blocked vessels", "persons_added": 0, "entities_added": 0, "details": "Related to vessels blocked under Iran sanctions enforcement."},
                {"date": "2025-09-27", "issuer": "UN", "title": "UN Snapback — E3 triggers reimposition of all prior UNSC Iran sanctions", "persons_added": 43, "entities_added": 78, "details": "UK/France/Germany triggered snapback under UNSCR 2231. 1737 Committee re-established. Resolutions 1696, 1737, 1747, 1803, 1835, 1929 reactivated. Disputed by Russia/China."},
                {"date": "2025-09-29", "issuer": "EU", "title": "EU reimpose all nuclear-related economic/financial sanctions on Iran", "persons_added": 0, "entities_added": 0, "details": "Following UN snapback, Council reimposed all JCPOA-related sanctions lifted in 2016."},
                {"date": "2025-05-14", "issuer": "EU", "title": "EU broadens drone/missile sanctions framework — Middle East & Red Sea scope", "persons_added": 24, "entities_added": 26, "details": "Framework expanded to cover Iran's military support of armed groups in Middle East/Red Sea, total 24 individuals + 26 entities."},
                {"date": "2024-10-11", "issuer": "US", "title": "OFAC Determination — Petroleum & petrochemical sectors under EO 13902", "persons_added": 0, "entities_added": 0, "details": "Expanded sectoral sanctions to Iran's petroleum and petrochemical sectors."}
            ],
            "categories": [
                {
                    "regime": "United States",
                    "short": "US",
                    "description": "The U.S. maintains the most comprehensive Iran sanctions through OFAC, covering oil, banking, military, human rights, shipping, and proliferation via multiple Executive Orders, statutes (CISADA, CAATSA, IFCA, SHIP Act, MAHSA Act, Fight CRIME Act) and CFR regulations.",
                    "key_sanctions": [
                        {"name": "Iranian Transactions & Sanctions Regulations (ITSR) — 31 CFR Part 560", "date": "2012", "target": "Comprehensive trade prohibition", "status": "Active", "details": "Core regulation prohibiting virtually all trade, transactions, and services with Iran by U.S. persons."},
                        {"name": "EO 13846 — Reimposing Certain Sanctions With Respect to Iran", "date": "2018-08-06", "target": "Oil, shipping, banking, insurance", "status": "Active", "details": "Reimposed post-JCPOA sanctions on Iran's oil, shipping, financial sectors, and Central Bank."},
                        {"name": "EO 13902 — Sanctions on Additional Sectors of Iran", "date": "2020-01-10", "target": "Construction, mining, manufacturing, textiles, petroleum", "status": "Active", "details": "Expanded sectoral sanctions. Petroleum/petrochemical determination added October 2024."},
                        {"name": "EO 13876 — Imposing Sanctions with Respect to Iran", "date": "2019-06-24", "target": "Supreme Leader, IRGC leadership", "status": "Active", "details": "Directly targets Iran's Supreme Leader and senior IRGC officials."},
                        {"name": "EO 13871 — Iron, Steel, Aluminum, and Copper Sectors", "date": "2019-05-08", "target": "Metals and mining", "status": "Active", "details": "Sanctions on Iran's iron, steel, aluminum, and copper sectors."},
                        {"name": "EO 13949 — Conventional Arms Activities of Iran", "date": "2020-09-21", "target": "Arms transfers", "status": "Active", "details": "Blocks property of persons involved in Iran's conventional arms activities."},
                        {"name": "EO 13553 — Serious Human Rights Abuses", "date": "2010-09-29", "target": "Human rights violators", "status": "Active", "details": "Targets individuals/entities responsible for serious human rights abuses in Iran."},
                        {"name": "EO 13606 — Grave Human Rights Abuses via IT", "date": "2012-04-23", "target": "Surveillance technology", "status": "Active", "details": "Targets those facilitating surveillance and repression via information technology."},
                        {"name": "MAHSA Act (Public Law 118-50, Div. L)", "date": "2024", "target": "Human rights accountability", "status": "Active", "details": "Mandates sanctions on Iranian officials responsible for human rights abuses, named after Mahsa Amini."},
                        {"name": "SHIP Act (Public Law 118-50, Div. J)", "date": "2024", "target": "Iranian petroleum shipping", "status": "Active", "details": "Targets ships involved in transporting Iranian petroleum, strengthening maritime enforcement."},
                        {"name": "Shipping & Maritime Advisory (April 2025)", "date": "2025-04-16", "target": "Maritime stakeholders", "status": "Active", "details": "Updated OFAC guidance on detecting and mitigating Iranian oil sanctions evasion in shipping."}
                    ]
                },
                {
                    "regime": "European Union",
                    "short": "EU",
                    "description": "The EU applies multiple sanctions regimes against Iran: human rights (extended to April 2027), nuclear proliferation (reimposed September 2025 after snapback), drones/missiles (extended to July 2026), and counter-terrorism (IRGC designated February 2026).",
                    "key_sanctions": [
                        {"name": "Council Decision 2011/235/CFSP — Human Rights Sanctions", "date": "2011 (extended March 2026)", "target": "Officials, security forces, judiciary, IRGC", "status": "Active until April 2027", "details": "Travel bans, asset freezes, ban on repression equipment. Extended until April 13, 2027 by Council on March 30, 2026."},
                        {"name": "IRGC Designated as Terrorist Organisation", "date": "2026-02-19", "target": "Islamic Revolutionary Guard Corps", "status": "Active", "details": "IRGC listed under EU counter-terrorism sanctions regime. All IRGC funds in EU member states frozen."},
                        {"name": "Council Decision 2010/413/CFSP — Nuclear Proliferation", "date": "2010 (reimposed Sep 2025)", "target": "Nuclear program, energy, finance, transport", "status": "Active", "details": "All JCPOA-related sanctions reimposed on 29 September 2025 after UN snapback. Includes oil import ban, banking restrictions, arms embargo."},
                        {"name": "Council Regulation (EU) No 267/2012", "date": "2012-03-23", "target": "Nuclear/economic restrictions", "status": "Active", "details": "Comprehensive regulation covering trade, financial, and transport sector sanctions against Iran."},
                        {"name": "Council Decision (CFSP) 2023/1532 — Drones & Missiles Framework", "date": "2023-07-20 (broadened 2024)", "target": "Drone/missile suppliers, 24 persons + 26 entities", "status": "Active until July 2026", "details": "Targets Iran's military support of Russia's war and armed groups in Middle East/Red Sea. 24 individuals and 26 entities sanctioned."},
                        {"name": "EU Iran Nuclear Sanctions Reimposition", "date": "2025-09-29", "target": "Central Bank of Iran, commercial banks, energy sector", "status": "Active", "details": "Council reimposed all nuclear-related economic/financial sanctions lifted in 2016. Includes oil embargo, financial sector restrictions, cargo flight bans."},
                        {"name": "EU Global Human Rights Sanctions (Iran-related)", "date": "2020+", "target": "Individual human rights violators", "status": "Active", "details": "Iranian individuals also sanctioned under the EU global human rights sanctions regime (Magnitsky-style)."},
                        {"name": "Sanctions on Internet Monitoring & Repression Equipment", "date": "2011+", "target": "Telecom/IT surveillance", "status": "Active", "details": "Ban on selling internet monitoring or interception services to Iran, plus ban on repression equipment exports."}
                    ]
                },
                {
                    "regime": "United Nations (Snapback)",
                    "short": "UN",
                    "description": "On 27 September 2025, the E3 (UK/France/Germany) triggered the snapback under UNSCR 2231. All prior UNSC resolutions reactivated. 1737 Committee re-established with 43 designated individuals and 78 entities. Disputed by Russia, China, and Iran.",
                    "key_sanctions": [
                        {"name": "UNSCR 1696 (2006)", "date": "2006-07-31", "target": "Uranium enrichment suspension demand", "status": "Reactivated Oct 2025", "details": "Demands Iran suspend all enrichment-related and reprocessing activities. Basis for subsequent escalatory resolutions."},
                        {"name": "UNSCR 1737 (2006)", "date": "2006-12-23", "target": "Nuclear-related asset freeze, procurement ban", "status": "Reactivated Oct 2025", "details": "Imposes asset freeze on nuclear/missile-related entities. Bans proliferation-sensitive technology transfers."},
                        {"name": "UNSCR 1747 (2007)", "date": "2007-03-24", "target": "Arms embargo, IRGC-related entities", "status": "Reactivated Oct 2025", "details": "Adds arms export ban from Iran, expands asset freeze to IRGC-linked entities, adds travel ban provisions."},
                        {"name": "UNSCR 1803 (2008)", "date": "2008-03-03", "target": "Financial vigilance, cargo inspections", "status": "Reactivated Oct 2025", "details": "Calls on states to inspect Iranian cargo, exercise vigilance over Iranian banks, and restrict travel of designated persons."},
                        {"name": "UNSCR 1929 (2010)", "date": "2010-06-09", "target": "Comprehensive: arms, ballistic missiles, finance", "status": "Reactivated Oct 2025", "details": "Most comprehensive UNSC resolution. Full arms embargo, ballistic missile restrictions, expanded financial sanctions, cargo inspection authority."},
                        {"name": "UNSCR 2231 (2015) — Snapback Mechanism", "date": "2015-07-20", "target": "Framework for JCPOA and snapback", "status": "Active", "details": "The resolution that endorsed the JCPOA and contains the snapback provision (para. 11) triggered by E3 in October 2025."}
                    ]
                }
            ]
        }
        
        dashboard_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        dashboard_data["rss_items_analyzed"] = len(recent_items)
        dashboard_data["telegram_messages_analyzed"] = len(hra_messages) + len(vahid_messages)

        # Editorial sanitation: scrub any banned-source mentions and ensure
        # regime-source attribution across all AI-generated text fields.
        def _scrub_obj(obj):
            if isinstance(obj, str):
                return _sanitize_editorial(obj)
            if isinstance(obj, list):
                return [_scrub_obj(x) for x in obj]
            if isinstance(obj, dict):
                return {k: _scrub_obj(v) for k, v in obj.items()}
            return obj
        dashboard_data = _scrub_obj(dashboard_data)
        
        # Cache in DB
        await db.dashboard_cache.delete_many({})
        await db.dashboard_cache.insert_one(dashboard_data)
        
        # Remove _id added by MongoDB before returning
        dashboard_data.pop("_id", None)
        
        logger.info(f"Dashboard indexes computed: tension={dashboard_data['tension_index']['score']}")
        return dashboard_data
        
    except Exception as e:
        logger.error(f"Dashboard computation error: {e}")
        # Return cached data if available
        cached = await db.dashboard_cache.find_one({}, {"_id": 0})
        if cached:
            return cached
        return None

# Dashboard API endpoint
@api_router.get("/dashboard/indexes")
async def get_dashboard_indexes():
    """Public endpoint - returns cached dashboard data."""
    cached = await db.dashboard_cache.find_one({}, {"_id": 0})
    if cached:
        # Surface last_updated timestamp for the UI "updated X min ago" pill
        cached["last_updated"] = cached.get("updated_at")
        return cached
    # Compute on first request
    data = await _compute_dashboard_indexes()
    if data:
        data["last_updated"] = data.get("updated_at")
        return data
    raise HTTPException(status_code=503, detail="Dashboard data not yet available")

@api_router.post("/dashboard/refresh")
async def refresh_dashboard(request: Request):
    """Admin endpoint - force refresh dashboard indexes."""
    await get_current_user(request)
    data = await _compute_dashboard_indexes()
    if data:
        return data
    raise HTTPException(status_code=500, detail="Failed to compute dashboard data")

# Background task: refresh dashboard every 2 hours
async def auto_refresh_dashboard():
    """Background task to refresh dashboard indexes."""
    while True:
        try:
            await asyncio.sleep(7200)  # 2 hours
            await _compute_dashboard_indexes()
        except Exception as e:
            logger.error(f"Dashboard auto-refresh error: {e}")

# Health check
@api_router.get("/")
async def root():
    return {"message": "Iran Observatory API", "status": "running"}

# Sitemap for SEO
@api_router.get("/sitemap.xml")
async def sitemap():
    from fastapi.responses import Response
    
    base_url = os.environ.get('FRONTEND_URL', 'https://iranobservatory.org').rstrip('/')
    if "preview" in base_url:
        # Always use the canonical production domain in the sitemap
        base_url = 'https://iranobservatory.org'
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    langs = ("fr", "en", "fa")
    
    def hreflang_for(path: str) -> str:
        # Each URL on the site is the same regardless of language (language
        # is picked client-side via context/cookie), so all hreflang entries
        # point to the same URL — this still satisfies Google's requirement.
        out = ""
        for lc in langs:
            out += f'    <xhtml:link rel="alternate" hreflang="{lc}" href="{base_url}{path}" />\n'
        out += f'    <xhtml:link rel="alternate" hreflang="x-default" href="{base_url}{path}" />\n'
        return out
    
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n'
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
    
    # Main pages
    pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "daily"},
        {"loc": "/articles", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/studies", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/monitor", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/a-propos", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/methodologie", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/manifeste", "priority": "0.8", "changefreq": "monthly"},
    ]
    for page in pages:
        xml += f'  <url>\n    <loc>{base_url}{page["loc"]}</loc>\n'
        xml += f'    <lastmod>{now}</lastmod>\n'
        xml += f'    <changefreq>{page["changefreq"]}</changefreq>\n'
        xml += f'    <priority>{page["priority"]}</priority>\n'
        xml += hreflang_for(page["loc"])
        xml += '  </url>\n'
    
    # Categories (indexable hubs)
    try:
        cats = await db.articles.distinct("category", {"status": "published"})
        for c in cats:
            if not c:
                continue
            cslug = slugify(c) or c
            path = f"/articles/category/{cslug}"
            xml += f'  <url>\n    <loc>{base_url}{path}</loc>\n'
            xml += f'    <lastmod>{now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n'
            xml += hreflang_for(path)
            xml += '  </url>\n'
    except Exception:
        pass
    
    # Tags (indexable hubs) — top 50 by usage
    try:
        pipeline = [
            {"$match": {"status": "published"}},
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 50}
        ]
        for tag in await db.articles.aggregate(pipeline).to_list(50):
            tname = tag.get("_id")
            if not tname:
                continue
            tslug = slugify(tname)
            if not tslug:
                continue
            path = f"/articles/tag/{tslug}"
            xml += f'  <url>\n    <loc>{base_url}{path}</loc>\n'
            xml += f'    <lastmod>{now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n'
            xml += hreflang_for(path)
            xml += '  </url>\n'
    except Exception:
        pass
    
    # All published articles
    articles = await db.articles.find(
        {"status": "published"},
        {"_id": 1, "slug": 1, "updated_at": 1, "created_at": 1, "content_type": 1, "image_url": 1, "title_en": 1, "title_fr": 1}
    ).sort("created_at", -1).to_list(1000)
    
    for art in articles:
        aid = str(art["_id"])
        slug = art.get("slug") or aid
        path = f"/article/{slug}"
        lastmod_dt = art.get("updated_at") or art.get("created_at")
        lastmod = lastmod_dt.strftime("%Y-%m-%d") if hasattr(lastmod_dt, "strftime") else now
        priority = "0.9" if art.get("content_type") in ("study", "analysis", "brief") else "0.7"
        
        xml += f'  <url>\n    <loc>{base_url}{path}</loc>\n'
        xml += f'    <lastmod>{lastmod}</lastmod>\n'
        xml += '    <changefreq>monthly</changefreq>\n'
        xml += f'    <priority>{priority}</priority>\n'
        xml += hreflang_for(path)
        
        # Image entry
        img = art.get("image_url") or ""
        if img:
            if img.startswith("/"):
                img = f"{base_url}{img}"
            # XML-escape minimal chars
            img_esc = img.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            title_for_img = (art.get("title_en") or art.get("title_fr") or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")[:150]
            xml += '    <image:image>\n'
            xml += f'      <image:loc>{img_esc}</image:loc>\n'
            if title_for_img:
                xml += f'      <image:title>{title_for_img}</image:title>\n'
            xml += '    </image:image>\n'
        xml += '  </url>\n'
    
    xml += '</urlset>'
    return Response(content=xml, media_type="application/xml")

# Google News-specific sitemap (recent articles only, last 2 days)
@api_router.get("/news-sitemap.xml")
async def news_sitemap():
    from fastapi.responses import Response
    base_url = os.environ.get('FRONTEND_URL', 'https://iranobservatory.org').rstrip('/')
    if "preview" in base_url:
        base_url = 'https://iranobservatory.org'
    
    two_days_ago = datetime.now(timezone.utc) - timedelta(days=2)
    articles = await db.articles.find(
        {"status": "published", "published_at": {"$gte": two_days_ago}},
        {"_id": 1, "slug": 1, "published_at": 1, "title_en": 1, "title_fr": 1, "title_fa": 1}
    ).sort("published_at", -1).to_list(500)
    
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n'
    
    for art in articles:
        aid = str(art["_id"])
        slug = art.get("slug") or aid
        title = (art.get("title_fr") or art.get("title_en") or art.get("title_fa") or "").replace("&", "&amp;").replace("<", "&lt;")[:200]
        pub_dt = art.get("published_at")
        pub_iso = pub_dt.strftime("%Y-%m-%dT%H:%M:%S+00:00") if hasattr(pub_dt, "strftime") else ""
        
        xml += f'  <url>\n    <loc>{base_url}/article/{slug}</loc>\n'
        xml += '    <news:news>\n'
        xml += '      <news:publication>\n'
        xml += '        <news:name>Iran Observatory</news:name>\n'
        xml += '        <news:language>fr</news:language>\n'
        xml += '      </news:publication>\n'
        xml += f'      <news:publication_date>{pub_iso}</news:publication_date>\n'
        xml += f'      <news:title>{title}</news:title>\n'
        xml += '    </news:news>\n'
        xml += '  </url>\n'
    
    xml += '</urlset>'
    return Response(content=xml, media_type="application/xml")


# ============ WEEKLY BRIEF GENERATION ============
async def generate_weekly_brief():
    """Generate a weekly intelligence brief from the past week's RSS items. Runs every Monday."""
    import json
    try:
        # Get RSS items from the past 7 days
        one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_items = await db.rss_items.find(
            {"created_at": {"$gte": one_week_ago}},
            {"_id": 0, "title": 1, "description": 1, "link": 1, "source_feed": 1}
        ).sort("created_at", -1).to_list(100)
        
        if not recent_items or len(recent_items) < 3:
            logger.info("Not enough RSS items for weekly brief (need 3+)")
            return None
        
        # Get published articles from last week for featured news
        recent_articles = await db.articles.find(
            {"status": "published", "created_at": {"$gte": one_week_ago}, "content_type": "news"},
            {"_id": 0, "title_en": 1, "title_fr": 1, "summary_en": 1, "summary_fr": 1}
        ).sort("created_at", -1).to_list(10)
        
        # Build context
        rss_context = "\n".join([f"- {item.get('title', '')}: {item.get('description', '')[:150]}" for item in recent_items[:50]])
        articles_context = "\n".join([f"- {a.get('title_en', '')}: {a.get('summary_en', '')[:100]}" for a in recent_articles[:5]])
        
        today = datetime.now(timezone.utc)
        week_start = (today - timedelta(days=7)).strftime("%B %d")
        week_end = today.strftime("%B %d, %Y")
        
        api_key = os.environ.get("LLM_API_KEY") or os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY")
        if not api_key:
            logger.error("No LLM API key for weekly brief")
            return None
        
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"weekly-brief-{uuid.uuid4()}",
            system_message=EDITORIAL_SOURCE_RULES + """

You are a senior geopolitical intelligence analyst at Iran Observatory. Write sharp, assertive weekly intelligence briefs. No hedging, no filler. Style: The Economist meets BCA Research."""
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Write a professional weekly intelligence brief for Iran Observatory covering {week_start} to {week_end}.

RSS FEED ITEMS THIS WEEK:
{rss_context}

PUBLISHED ARTICLES THIS WEEK:
{articles_context}

Write the brief in BOTH English and French. Return ONLY this JSON:
{{
  "title_en": "Weekly Brief: {week_start} – {week_end}",
  "title_fr": "Brief Hebdomadaire: {week_start} – {week_end}",
  "summary_en": "<2-3 sentence executive summary of the week's key developments>",
  "summary_fr": "<same in French>",
  "content_en": "<HTML formatted brief with sections: Executive Summary, Geopolitics & Security, Economy & Sanctions, Human Rights & Society, Outlook. Use <h2>, <h3>, <p>, <ul>, <li>, <strong> tags. Make it 500-800 words. Be direct, analytical, no hedging.>",
  "content_fr": "<same structure in French>"
}}

IMPORTANT: Return valid JSON only. Content must be HTML-formatted for direct rendering."""
        
        msg = UserMessage(text=prompt)
        response = await chat.send_message(msg)
        
        r = response.strip()
        if r.startswith("```"):
            r = r.split("```")[1]
            if r.startswith("json"):
                r = r[4:]
        # Extract JSON
        r = r.strip()
        start = r.find('{')
        if start >= 0:
            brace_count = 0
            in_str = False
            esc = False
            for idx in range(start, len(r)):
                ch = r[idx]
                if esc: esc = False; continue
                if ch == '\\': esc = True; continue
                if ch == '"': in_str = not in_str; continue
                if in_str: continue
                if ch == '{': brace_count += 1
                elif ch == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        r = r[start:idx+1]
                        break
        
        brief_data = json.loads(r)
        
        # Save as draft article
        brief_doc = {
            "title_en": _sanitize_editorial(brief_data.get("title_en", f"Weekly Brief: {week_start} – {week_end}")),
            "title_fr": _sanitize_editorial(brief_data.get("title_fr", f"Brief Hebdomadaire: {week_start} – {week_end}")),
            "title_fa": "",
            "content_en": _sanitize_editorial(brief_data.get("content_en", "")),
            "content_fr": _sanitize_editorial(brief_data.get("content_fr", "")),
            "content_fa": "",
            "summary_en": _sanitize_editorial(brief_data.get("summary_en", "")),
            "summary_fr": _sanitize_editorial(brief_data.get("summary_fr", "")),
            "summary_fa": "",
            "image_url": "",
            "source_url": "",
            "tags": ["weekly-brief"],
            "category": "politics",
            "content_type": "brief",
            "status": "draft",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db.articles.insert_one(brief_doc)
        logger.info(f"Weekly brief generated as draft: {brief_data.get('title_en', '')}")
        return str(result.inserted_id)
        
    except Exception as e:
        logger.error(f"Weekly brief generation error: {e}")
        return None

# Background task: check every hour if it's Monday morning and generate brief
async def weekly_brief_scheduler():
    """Check if it's Monday and generate the weekly brief."""
    generated_this_week = False
    while True:
        try:
            now = datetime.now(timezone.utc)
            # Monday = 0, check between 6-8 AM UTC
            if now.weekday() == 0 and 6 <= now.hour < 8 and not generated_this_week:
                # Check if we already generated a brief this week
                week_start = now - timedelta(days=1)
                existing = await db.articles.find_one({
                    "content_type": "brief",
                    "created_at": {"$gte": week_start}
                })
                if not existing:
                    await generate_weekly_brief()
                    generated_this_week = True
            
            # Reset flag on Tuesday
            if now.weekday() == 1:
                generated_this_week = False
                
            await asyncio.sleep(3600)  # Check every hour
        except Exception as e:
            logger.error(f"Weekly brief scheduler error: {e}")
            await asyncio.sleep(3600)

# ============ STRATEGIC SIGNALS ("Signaux Stratégiques") ============
# Editorial curation of things-to-watch for professional readers
# (executives, diplomats, journalists, NGOs). Positions Iran Observatory in
# the gap left by partisan media: francophone, non-partisan, signed.

STRATEGIC_AUDIENCES = {"business", "diplomatic", "media", "ngo", "all"}
STRATEGIC_LEVELS = {"low", "medium", "high", "critical"}
STRATEGIC_TIMEFRAMES = {"this_week", "next_30_days", "ongoing", "next_quarter"}

@api_router.get("/signals")
async def list_signals(audience: str = "all", include_locked: bool = False):
    """Public list of active strategic signals.
    Filters out expired signals automatically. The `locked` flag controls
    whether premium signals are returned with full body or just preview meta."""
    now = datetime.now(timezone.utc)
    query = {
        "status": "published",
        "$or": [{"expires_at": None}, {"expires_at": {"$gte": now}}]
    }
    if audience and audience != "all":
        # Match signals targeting this audience OR all
        query["audience"] = {"$in": [audience, "all"]}
    
    cursor = db.signals.find(query).sort([("priority", -1), ("created_at", -1)]).limit(50)
    out = []
    async for s in cursor:
        s["id"] = str(s.pop("_id"))
        for k in ("created_at", "updated_at", "expires_at", "published_at"):
            if isinstance(s.get(k), datetime):
                s[k] = s[k].isoformat()
        # Premium gating: if locked & not include_locked, hide details
        if s.get("premium") and not include_locked:
            s["context_fr"] = ""
            s["context_en"] = ""
            s["context_fa"] = ""
            s["sources"] = []
            s["locked"] = True
        else:
            s["locked"] = False
        out.append(s)
    return out

@api_router.get("/signals/admin")
async def list_signals_admin(request: Request):
    """Admin: all signals including drafts + expired."""
    await get_current_user(request)
    out = []
    async for s in db.signals.find({}).sort("created_at", -1):
        s["id"] = str(s.pop("_id"))
        for k in ("created_at", "updated_at", "expires_at", "published_at"):
            if isinstance(s.get(k), datetime):
                s[k] = s[k].isoformat()
        out.append(s)
    return out

@api_router.post("/signals")
async def create_signal(request: Request):
    await get_current_user(request)
    body = await request.json()
    
    audience = body.get("audience", "all")
    if audience not in STRATEGIC_AUDIENCES:
        raise HTTPException(status_code=400, detail=f"audience must be one of {sorted(STRATEGIC_AUDIENCES)}")
    
    likelihood = (body.get("likelihood") or "medium").lower()
    impact = (body.get("impact") or "medium").lower()
    if likelihood not in STRATEGIC_LEVELS:
        likelihood = "medium"
    if impact not in STRATEGIC_LEVELS:
        impact = "medium"
    
    timeframe = (body.get("timeframe") or "this_week").lower()
    if timeframe not in STRATEGIC_TIMEFRAMES:
        timeframe = "this_week"
    
    # Compute priority for sorting (impact * likelihood, on 0-15 scale)
    weight = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    priority = weight.get(likelihood, 2) * weight.get(impact, 2)
    
    # Optional expiry
    expires_at = None
    if body.get("expires_at"):
        try:
            expires_at = datetime.fromisoformat(body["expires_at"].replace("Z", "+00:00"))
        except Exception:
            pass
    
    doc = {
        "title_fr": (body.get("title_fr") or "").strip(),
        "title_en": (body.get("title_en") or "").strip(),
        "title_fa": (body.get("title_fa") or "").strip(),
        "context_fr": (body.get("context_fr") or "").strip(),
        "context_en": (body.get("context_en") or "").strip(),
        "context_fa": (body.get("context_fa") or "").strip(),
        "category": body.get("category") or "geopolitics",
        "audience": audience,
        "timeframe": timeframe,
        "likelihood": likelihood,
        "impact": impact,
        "priority": priority,
        "sources": [s for s in (body.get("sources") or []) if isinstance(s, dict) and s.get("url")][:10],
        "tags": [t for t in (body.get("tags") or []) if isinstance(t, str)][:10],
        "premium": bool(body.get("premium", False)),
        "status": body.get("status", "draft"),
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "published_at": datetime.now(timezone.utc) if body.get("status") == "published" else None,
    }
    res = await db.signals.insert_one(doc)
    return {"id": str(res.inserted_id), "message": "Signal created"}

@api_router.put("/signals/{signal_id}")
async def update_signal(signal_id: str, request: Request):
    await get_current_user(request)
    body = await request.json()
    try:
        oid = ObjectId(signal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signal id")
    
    update = {}
    for k in ("title_fr", "title_en", "title_fa", "context_fr", "context_en", "context_fa", "category", "audience", "timeframe", "likelihood", "impact", "status"):
        if k in body:
            update[k] = body[k]
    if "sources" in body:
        update["sources"] = [s for s in body["sources"] if isinstance(s, dict) and s.get("url")][:10]
    if "tags" in body:
        update["tags"] = [t for t in body["tags"] if isinstance(t, str)][:10]
    if "premium" in body:
        update["premium"] = bool(body["premium"])
    if "expires_at" in body:
        try:
            update["expires_at"] = datetime.fromisoformat(body["expires_at"].replace("Z", "+00:00")) if body["expires_at"] else None
        except Exception:
            pass
    
    # Recompute priority if likelihood/impact changed
    if "likelihood" in update or "impact" in update:
        existing = await db.signals.find_one({"_id": oid}, {"likelihood": 1, "impact": 1})
        if existing:
            lk = update.get("likelihood", existing.get("likelihood", "medium"))
            im = update.get("impact", existing.get("impact", "medium"))
            weight = {"low": 1, "medium": 2, "high": 3, "critical": 4}
            update["priority"] = weight.get(lk, 2) * weight.get(im, 2)
    
    update["updated_at"] = datetime.now(timezone.utc)
    if update.get("status") == "published":
        update["published_at"] = datetime.now(timezone.utc)
    
    result = await db.signals.update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Signal not found")
    return {"message": "Signal updated"}

@api_router.delete("/signals/{signal_id}")
async def delete_signal(signal_id: str, request: Request):
    await get_current_user(request)
    try:
        oid = ObjectId(signal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signal id")
    result = await db.signals.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Signal not found")
    return {"message": "Signal deleted"}

@api_router.post("/signals/{signal_id}/unlock")
async def unlock_signal(signal_id: str, request: Request):
    """Email-gated unlock for premium signals. Adds the requester to subscribers
    (newsletter=true) and returns the full body. Stepping stone before Stripe."""
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    language = (body.get("language") or "fr").lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")
    if language not in ("fr", "en", "fa"):
        language = "fr"
    
    try:
        oid = ObjectId(signal_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signal id")
    signal = await db.signals.find_one({"_id": oid})
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    # Track lead — also subscribes them to the newsletter
    existing = await db.subscribers.find_one({"email": email})
    if existing:
        await db.subscribers.update_one(
            {"_id": existing["_id"]},
            {"$set": {"newsletter": True, "language": language},
             "$addToSet": {"unlocked_signals": str(oid)}}
        )
    else:
        await db.subscribers.insert_one({
            "email": email,
            "newsletter": True,
            "language": language,
            "unlocked_signals": [str(oid)],
            "downloads": [],
            "created_at": datetime.now(timezone.utc),
            "source": "strategic_signal_unlock"
        })
    
    # Return full signal body
    signal["id"] = str(signal.pop("_id"))
    for k in ("created_at", "updated_at", "expires_at", "published_at"):
        if isinstance(signal.get(k), datetime):
            signal[k] = signal[k].isoformat()
    signal["locked"] = False
    return signal

# ============ DASHBOARD SOURCES ============
# Curated list of trusted sources for each Iran Monitor indicator. Returned
# alongside indicator values to display source-clustering favicons.
DASHBOARD_SOURCE_CONFIG = {
    "tension_index": [
        {"name": "International Crisis Group", "url": "https://www.crisisgroup.org/", "favicon": "https://www.google.com/s2/favicons?domain=crisisgroup.org&sz=32"},
        {"name": "Reuters", "url": "https://www.reuters.com/world/middle-east/", "favicon": "https://www.google.com/s2/favicons?domain=reuters.com&sz=32"},
        {"name": "Stockholm Int. Peace Research", "url": "https://www.sipri.org/", "favicon": "https://www.google.com/s2/favicons?domain=sipri.org&sz=32"},
    ],
    "hormuz": [
        {"name": "UNCTAD", "url": "https://unctad.org/publication/strait-hormuz-disruptions-implications-global-trade-and-development", "favicon": "https://www.google.com/s2/favicons?domain=unctad.org&sz=32"},
        {"name": "MarineTraffic", "url": "https://www.marinetraffic.com/", "favicon": "https://www.google.com/s2/favicons?domain=marinetraffic.com&sz=32"},
        {"name": "EIA US Energy", "url": "https://www.eia.gov/", "favicon": "https://www.google.com/s2/favicons?domain=eia.gov&sz=32"},
        {"name": "Crisis Group", "url": "https://www.crisisgroup.org/trigger-list/iran-usisrael-trigger-list/flashpoints/strait-hormuz", "favicon": "https://www.google.com/s2/favicons?domain=crisisgroup.org&sz=32"},
    ],
    "human_rights": [
        {"name": "HRA Iran", "url": "https://www.en-hrana.org/", "favicon": "https://www.google.com/s2/favicons?domain=en-hrana.org&sz=32"},
        {"name": "Amnesty International", "url": "https://www.amnesty.org/en/location/middle-east-and-north-africa/iran/", "favicon": "https://www.google.com/s2/favicons?domain=amnesty.org&sz=32"},
        {"name": "UN OHCHR", "url": "https://www.ohchr.org/en/countries/iran", "favicon": "https://www.google.com/s2/favicons?domain=ohchr.org&sz=32"},
        {"name": "Iran Human Rights", "url": "https://iranhr.net/", "favicon": "https://www.google.com/s2/favicons?domain=iranhr.net&sz=32"},
    ],
    "internet_blackouts": [
        {"name": "NetBlocks", "url": "https://netblocks.org/", "favicon": "https://www.google.com/s2/favicons?domain=netblocks.org&sz=32"},
        {"name": "Cloudflare Radar", "url": "https://radar.cloudflare.com/", "favicon": "https://www.google.com/s2/favicons?domain=cloudflare.com&sz=32"},
        {"name": "OONI", "url": "https://ooni.org/country/IR/", "favicon": "https://www.google.com/s2/favicons?domain=ooni.org&sz=32"},
    ],
    "sanctions": [
        {"name": "US Treasury OFAC", "url": "https://ofac.treasury.gov/sanctions-programs-and-country-information/iran-sanctions", "favicon": "https://www.google.com/s2/favicons?domain=treasury.gov&sz=32"},
        {"name": "EU Council", "url": "https://www.consilium.europa.eu/en/policies/sanctions-against-iran/", "favicon": "https://www.google.com/s2/favicons?domain=consilium.europa.eu&sz=32"},
        {"name": "UN Security Council", "url": "https://www.un.org/securitycouncil/sanctions/1737", "favicon": "https://www.google.com/s2/favicons?domain=un.org&sz=32"},
        {"name": "UK FCDO", "url": "https://www.gov.uk/government/collections/uk-sanctions-on-iran", "favicon": "https://www.google.com/s2/favicons?domain=gov.uk&sz=32"},
    ],
    "economy": [
        {"name": "IMF", "url": "https://www.imf.org/en/Countries/IRN", "favicon": "https://www.google.com/s2/favicons?domain=imf.org&sz=32"},
        {"name": "World Bank", "url": "https://www.worldbank.org/en/country/iran", "favicon": "https://www.google.com/s2/favicons?domain=worldbank.org&sz=32"},
        {"name": "Central Bank of Iran", "url": "https://www.cbi.ir/", "favicon": "https://www.google.com/s2/favicons?domain=cbi.ir&sz=32"},
        {"name": "Statistical Centre of Iran", "url": "https://www.amar.org.ir/", "favicon": "https://www.google.com/s2/favicons?domain=amar.org.ir&sz=32"},
    ],
}

@api_router.get("/dashboard/sources")
async def get_dashboard_sources():
    """Returns the source attribution map for each indicator on the Iran Monitor."""
    return DASHBOARD_SOURCE_CONFIG

# ============ NEWSLETTER I18N + BUILDER ============
NEWSLETTER_I18N = {
    "fr": {
        "dir": "ltr",
        "label_weekly": "Newsletter hebdomadaire",
        "label_brief": "Brief hebdomadaire",
        "label_articles": "Articles à la une",
        "label_studies": "Nouvelles études",
        "read_brief": "Lire le brief complet →",
        "view_articles": "Voir tous les articles →",
        "view_studies": "Voir les études →",
        "support_text": "Si ce brief est utile à votre travail,<br>soutenez l'indépendance d'Iran Observatory.",
        "support_btn": "♡ Nous soutenir",
        "tagline": "Plateforme indépendante d'analyse factuelle sur l'Iran",
        "site_brand": "Iran Observatory | Observatoire de l'Iran",
        "footer_links": {"Site web": "", "Iran Monitor": "/monitor", "Articles": "/articles", "Études & Briefs": "/studies"},
        "footer_note": "Vous recevez cet email car vous êtes inscrit à la newsletter d'Iran Observatory.",
        "unsubscribe": "Se désinscrire",
        "founder_label": "Le mot du fondateur",
        "default_brief_title": "Brief hebdomadaire",
        "subject_prefix": "Iran Observatory — ",
        "subject_default": "Newsletter hebdomadaire",
        "welcome_subject": "Bienvenue à la newsletter d'Iran Observatory",
        "welcome_heading": "Bienvenue à Iran Observatory",
        "welcome_intro": "Merci de votre inscription à notre newsletter. Vous recevrez :",
        "welcome_bullets": [
            "<strong>Le Brief hebdomadaire</strong> chaque lundi",
            "<strong>Les articles à la une</strong> et les analyses clés",
            "<strong>Les nouvelles études</strong> dès leur publication"
        ],
        "welcome_visit": "Visitez notre site :",
        "welcome_badge": "Inscription confirmée",
    },
    "en": {
        "dir": "ltr",
        "label_weekly": "Weekly Newsletter",
        "label_brief": "Weekly Brief",
        "label_articles": "Featured Articles",
        "label_studies": "New Studies",
        "read_brief": "Read Full Brief →",
        "view_articles": "View All Articles →",
        "view_studies": "View Studies →",
        "support_text": "If this briefing is useful to your work,<br>consider supporting Iran Observatory's independence.",
        "support_btn": "♡ Support Us",
        "tagline": "Independent platform for fact-based analysis on Iran",
        "site_brand": "Iran Observatory | Observatoire de l'Iran",
        "footer_links": {"Website": "", "Iran Monitor": "/monitor", "Articles": "/articles", "Studies & Briefs": "/studies"},
        "footer_note": "You received this because you subscribed to Iran Observatory newsletter.",
        "unsubscribe": "Unsubscribe",
        "founder_label": "A note from the founder",
        "default_brief_title": "Weekly Brief",
        "subject_prefix": "Iran Observatory — ",
        "subject_default": "Weekly Newsletter",
        "welcome_subject": "Welcome to Iran Observatory Newsletter",
        "welcome_heading": "Welcome to Iran Observatory",
        "welcome_intro": "Thank you for subscribing to our newsletter. You will receive:",
        "welcome_bullets": [
            "<strong>Weekly Intelligence Brief</strong> every Monday",
            "<strong>Featured articles</strong> and analysis highlights",
            "<strong>New studies</strong> when published"
        ],
        "welcome_visit": "Visit our website:",
        "welcome_badge": "Subscription Confirmed",
    },
    "fa": {
        "dir": "rtl",
        "label_weekly": "خبرنامه هفتگی",
        "label_brief": "بریف هفتگی",
        "label_articles": "مقالات منتخب",
        "label_studies": "مطالعات جدید",
        "read_brief": "← خواندن بریف کامل",
        "view_articles": "← مشاهده همه مقالات",
        "view_studies": "← مشاهده مطالعات",
        "support_text": "اگر این بریف برای کار شما مفید است،<br>از استقلال ایران آبزرواتوری حمایت کنید.",
        "support_btn": "♡ حمایت از ما",
        "tagline": "پلتفرم مستقل تحلیل مبتنی بر واقعیت درباره ایران",
        "site_brand": "ایران آبزرواتوری | Iran Observatory",
        "footer_links": {"وب‌سایت": "", "ایران مانیتور": "/monitor", "مقالات": "/articles", "مطالعات و بریف‌ها": "/studies"},
        "footer_note": "شما این ایمیل را دریافت می‌کنید چون مشترک خبرنامه ایران آبزرواتوری هستید.",
        "unsubscribe": "لغو اشتراک",
        "founder_label": "یادداشت بنیان‌گذار",
        "default_brief_title": "بریف هفتگی",
        "subject_prefix": "Iran Observatory — ",
        "subject_default": "خبرنامه هفتگی",
        "welcome_subject": "به خبرنامه ایران آبزرواتوری خوش آمدید",
        "welcome_heading": "به ایران آبزرواتوری خوش آمدید",
        "welcome_intro": "از اشتراک شما در خبرنامه ما متشکریم. شما دریافت خواهید کرد:",
        "welcome_bullets": [
            "<strong>بریف هفتگی</strong> هر دوشنبه",
            "<strong>مقالات منتخب</strong> و تحلیل‌های کلیدی",
            "<strong>مطالعات جدید</strong> هنگام انتشار"
        ],
        "welcome_visit": "وب‌سایت ما را ببینید:",
        "welcome_badge": "اشتراک تأیید شد",
    },
}

def _pick_field(doc: dict, base: str, lang: str) -> str:
    """Pick localized field with fallback chain: lang -> fr -> en -> fa -> empty."""
    for lc in (lang, "fr", "en", "fa"):
        val = (doc.get(f"{base}_{lc}") or "").strip()
        if val:
            return val
    return ""

async def _build_newsletter_html(lang: str) -> dict:
    """Build a localized weekly newsletter HTML for the given language ('fr'/'en'/'fa')."""
    if lang not in NEWSLETTER_I18N:
        lang = "fr"
    t = NEWSLETTER_I18N[lang]
    
    latest_brief = await db.articles.find_one(
        {"content_type": "brief", "status": "published"},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    featured_news = await db.articles.find(
        {"status": "published", "content_type": "news", "created_at": {"$gte": one_week_ago}},
        {"_id": 0, "title_en": 1, "title_fr": 1, "title_fa": 1, "summary_en": 1, "summary_fr": 1, "summary_fa": 1, "image_url": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    latest_studies = await db.articles.find(
        {"status": "published", "content_type": {"$in": ["study", "analysis"]}, "created_at": {"$gte": one_week_ago}},
        {"_id": 0, "title_en": 1, "title_fr": 1, "title_fa": 1, "summary_en": 1, "summary_fr": 1, "summary_fa": 1}
    ).sort("created_at", -1).limit(3).to_list(3)
    
    base_url = os.environ.get('FRONTEND_URL', 'https://iranobservatory.org')
    logo_url = "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png"
    helloasso_url = "https://www.helloasso.com/associations/dorna/formulaires/2"
    
    # Localized date
    now = datetime.now(timezone.utc)
    if lang == "fr":
        fr_months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
        today_str = f"{now.day} {fr_months[now.month-1]} {now.year}"
    elif lang == "fa":
        today_str = now.strftime("%Y-%m-%d")
    else:
        today_str = now.strftime("%B %d, %Y")
    
    founder = await db.settings.find_one({"key": "founder_intro"}, {"_id": 0, "key": 0}) or {}
    
    body_dir = t["dir"]
    text_align = "right" if body_dir == "rtl" else "left"
    
    html = f"""<!DOCTYPE html>
<html dir="{body_dir}" lang="{lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Helvetica Neue',Arial,sans-serif;" dir="{body_dir}">
<div style="max-width:640px;margin:0 auto;background:#ffffff;">

  <!-- Header -->
  <div style="background:#ffffff;padding:32px 40px 8px;text-align:center;">
    <img src="{logo_url}" alt="Iran Observatory" style="height:100px;max-height:100px;margin-bottom:18px;display:inline-block;" />
  </div>
  <div style="background:#1E3A5F;padding:20px 40px;text-align:center;">
    <div style="width:60px;height:3px;background:#3DB883;margin:0 auto 12px;"></div>
    <p style="color:#3DB883;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:bold;">{t['label_weekly']}</p>
    <p style="color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:11px;">{today_str}</p>
  </div>
"""
    
    # Founder Introduction block (per-language)
    intro_text_lang = _pick_field(founder, "intro_text", lang)
    name_lang = _pick_field(founder, "name", lang)
    title_lang = _pick_field(founder, "title", lang)
    photo_url_f = founder.get("photo_url", "") or ""
    signature_url_f = founder.get("signature_url", "") or ""
    # Emails need absolute URLs
    if photo_url_f.startswith("/"):
        photo_url_f = f"{base_url}{photo_url_f}"
    if signature_url_f.startswith("/"):
        signature_url_f = f"{base_url}{signature_url_f}"
    
    if founder.get("enabled") and (intro_text_lang or photo_url_f):
        intro_text_html = intro_text_lang.replace("\n", "<br>")
        
        photo_html = ""
        if photo_url_f:
            photo_html = f'<img src="{photo_url_f}" alt="{name_lang}" style="width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid #3DB883;display:block;" />'
        
        signature_html = ""
        if signature_url_f:
            signature_html = f'<img src="{signature_url_f}" alt="Signature" style="max-height:48px;margin-top:6px;display:block;" />'
        elif name_lang:
            signature_html = f'<p style="color:#1E3A5F;font-size:15px;margin:8px 0 0;font-style:italic;font-family:Georgia,serif;">— {name_lang}</p>'
        
        name_title_html = ""
        if name_lang:
            name_title_html = f'<p style="color:#1E3A5F;font-size:14px;margin:0;font-weight:bold;">{name_lang}</p>'
            if title_lang:
                name_title_html += f'<p style="color:#888;font-size:12px;margin:2px 0 0;">{title_lang}</p>'
        
        # In RTL, swap photo to right side via direction
        html += f"""
  <!-- Founder Introduction -->
  <div style="padding:28px 40px;background:#fafbfc;border-bottom:1px solid #eaedf0;text-align:{text_align};" dir="{body_dir}">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" dir="{body_dir}"><tr>
      <td width="100" style="vertical-align:top;{'padding-left:20px' if body_dir == 'rtl' else 'padding-right:20px'};">
        {photo_html}
      </td>
      <td style="vertical-align:top;text-align:{text_align};">
        <p style="color:#3DB883;margin:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">{t['founder_label']}</p>
        {name_title_html}
      </td>
    </tr></table>
    <div style="margin-top:16px;color:#444;font-size:14px;line-height:1.7;text-align:{text_align};">
      {intro_text_html}
    </div>
    {signature_html}
  </div>
"""
    
    # Weekly Brief section
    if latest_brief:
        brief_title = _pick_field(latest_brief, "title", lang) or t["default_brief_title"]
        brief_summary = _pick_field(latest_brief, "summary", lang)
        brief_content = latest_brief.get(f"content_{lang}", "") or latest_brief.get("content_fr", "") or latest_brief.get("content_en", "")
        import re
        highlights = []
        li_matches = re.findall(r'<li[^>]*>(.*?)</li>', brief_content, re.DOTALL)
        for li in li_matches[:4]:
            clean = re.sub(r'<[^>]+>', '', li).strip()
            if clean and len(clean) > 20:
                highlights.append(clean[:200])
        
        border_side = "border-right" if body_dir == "rtl" else "border-left"
        html += f"""
  <!-- Weekly Brief -->
  <div style="padding:32px 40px;border-bottom:1px solid #eaedf0;text-align:{text_align};" dir="{body_dir}">
    <div style="display:inline-block;background:#FEF3C7;color:#92400E;padding:4px 12px;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;border-radius:3px;margin-bottom:16px;">{t['label_brief']}</div>
    <h2 style="color:#1E3A5F;font-size:22px;margin:12px 0 10px;font-weight:800;line-height:1.3;">{brief_title}</h2>
    <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 16px;">{brief_summary}</p>
"""
        if highlights:
            html += f'<div style="background:#f8f9fb;{border_side}:4px solid #1E3A5F;padding:16px 20px;margin:0 0 16px;">'
            for h in highlights:
                html += f'<p style="color:#333;font-size:13px;line-height:1.6;margin:0 0 8px;">&#8226; {h}</p>'
            html += '</div>'
        
        html += f"""
    <a href="{base_url}/studies" style="display:inline-block;background:#1E3A5F;color:white;padding:10px 24px;font-size:12px;text-transform:uppercase;letter-spacing:1px;text-decoration:none;font-weight:bold;border-radius:4px;">{t['read_brief']}</a>
  </div>
"""
    
    # Featured News section
    if featured_news:
        html += f"""
  <!-- Featured News -->
  <div style="padding:32px 40px;border-bottom:1px solid #eaedf0;text-align:{text_align};" dir="{body_dir}">
    <div style="display:inline-block;background:#DBEAFE;color:#1E40AF;padding:4px 12px;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;border-radius:3px;margin-bottom:16px;">{t['label_articles']}</div>
"""
        pad_side = "padding-left" if body_dir == "rtl" else "padding-right"
        for i, news in enumerate(featured_news):
            title = _pick_field(news, "title", lang)
            summary = _pick_field(news, "summary", lang)[:150]
            img = news.get("image_url", "") or ""
            # Emails need absolute URLs — prepend base_url to relative paths
            if img.startswith("/"):
                img = f"{base_url}{img}"
            border = 'border-bottom:1px solid #f0f2f5;' if i < len(featured_news) - 1 else ''
            
            if img:
                html += f"""
    <div style="padding:16px 0;{border}">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" dir="{body_dir}"><tr>
        <td width="100" style="vertical-align:top;{pad_side}:16px;">
          <img src="{img}" alt="" style="width:100px;height:75px;object-fit:cover;border-radius:6px;" />
        </td>
        <td style="vertical-align:top;text-align:{text_align};">
          <p style="font-weight:bold;margin:0 0 4px;font-size:15px;color:#1a1a2e;line-height:1.3;">{title}</p>
          <p style="color:#666;font-size:13px;margin:0;line-height:1.5;">{summary}...</p>
        </td>
      </tr></table>
    </div>
"""
            else:
                html += f"""
    <div style="padding:16px 0;{border}">
      <p style="font-weight:bold;margin:0 0 4px;font-size:15px;color:#1a1a2e;line-height:1.3;">{title}</p>
      <p style="color:#666;font-size:13px;margin:0;line-height:1.5;">{summary}...</p>
    </div>
"""
        html += f"""
    <div style="padding-top:8px;">
      <a href="{base_url}/articles" style="color:#3DB883;font-size:12px;text-transform:uppercase;letter-spacing:1px;text-decoration:none;font-weight:bold;">{t['view_articles']}</a>
    </div>
  </div>
"""
    
    # Studies section
    if latest_studies:
        html += f"""
  <!-- New Studies -->
  <div style="padding:32px 40px;border-bottom:1px solid #eaedf0;text-align:{text_align};" dir="{body_dir}">
    <div style="display:inline-block;background:#F3E8FF;color:#6B21A8;padding:4px 12px;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;border-radius:3px;margin-bottom:16px;">{t['label_studies']}</div>
"""
        for study in latest_studies:
            title = _pick_field(study, "title", lang)
            summary = _pick_field(study, "summary", lang)[:120]
            html += f"""
    <div style="padding:10px 0;">
      <p style="font-weight:bold;margin:0 0 2px;font-size:14px;color:#1a1a2e;">{title}</p>
      <p style="color:#888;font-size:12px;margin:0;">{summary}</p>
    </div>
"""
        html += f"""
    <div style="padding-top:8px;">
      <a href="{base_url}/studies" style="color:#3DB883;font-size:12px;text-transform:uppercase;letter-spacing:1px;text-decoration:none;font-weight:bold;">{t['view_studies']}</a>
    </div>
  </div>
"""
    
    # Support Banner
    html += f"""
  <!-- Support Banner -->
  <div style="background:linear-gradient(135deg,#1E3A5F 0%,#2a4d75 100%);padding:28px 40px;text-align:center;">
    <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0 0 16px;line-height:1.5;">{t['support_text']}</p>
    <a href="{helloasso_url}" style="display:inline-block;background:#3DB883;color:white;padding:10px 28px;font-size:11px;text-transform:uppercase;letter-spacing:2px;text-decoration:none;font-weight:bold;border-radius:20px;">{t['support_btn']}</a>
  </div>

  <!-- Footer -->
  <div style="padding:24px 40px;background:#f8f9fb;text-align:center;">
    <p style="color:#1E3A5F;font-size:13px;font-weight:bold;margin:0 0 4px;">{t['site_brand']}</p>
    <p style="color:#999;font-size:11px;margin:0 0 8px;">{t['tagline']}</p>
    <div style="margin:12px 0;">
"""
    for label, path in t['footer_links'].items():
        html += f'      <a href="{base_url}{path}" style="color:#1E3A5F;font-size:11px;text-decoration:none;margin:0 8px;">{label}</a>\n'
    
    html += f"""    </div>
    <p style="color:#bbb;font-size:10px;margin:0;">{t['footer_note']}<br><a href="{base_url}/api/unsubscribe?email={{{{email}}}}" style="color:#999;">{t['unsubscribe']}</a></p>
  </div>

</div>
</body>
</html>"""
    
    # Subject
    if latest_brief:
        brief_title = _pick_field(latest_brief, "title", lang) or t["default_brief_title"]
        subject = f"{t['subject_prefix']}{brief_title}"
    else:
        subject = f"{t['subject_prefix']}{t['subject_default']}"
    
    return {"subject": subject, "html_content": html, "language": lang}

# ============ NEWSLETTER ENDPOINTS ============
@api_router.post("/newsletter/send")
async def send_newsletter(request: Request):
    """Admin endpoint: Send newsletter to all subscribers."""
    await get_current_user(request)
    
    body = await request.json()
    subject = body.get("subject", "")
    html_content = body.get("html_content", "")
    
    if not subject or not html_content:
        raise HTTPException(status_code=400, detail="Subject and html_content required")
    
    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        raise HTTPException(status_code=500, detail="Email service not configured (RESEND_API_KEY)")
    
    import resend
    resend.api_key = resend_key
    sender = os.environ.get("SENDER_EMAIL", "newsletter@iranobservatory.org")
    
    # Get all subscribers who expect newsletter
    subscribers = await db.subscribers.find(
        {"newsletter": True},
        {"_id": 0, "email": 1}
    ).to_list(10000)
    
    if not subscribers:
        return {"status": "no_subscribers", "sent": 0}
    
    sent_count = 0
    errors = []
    for sub in subscribers:
        try:
            # Replace unsubscribe placeholder with actual email
            personalized_html = html_content.replace("{{email}}", sub["email"])
            params = {
                "from": sender,
                "to": [sub["email"]],
                "subject": subject,
                "html": personalized_html
            }
            await asyncio.to_thread(resend.Emails.send, params)
            sent_count += 1
        except Exception as e:
            errors.append(f"{sub['email']}: {str(e)}")
    
    return {"status": "sent", "sent": sent_count, "errors": errors[:10]}

@api_router.post("/newsletter/generate")
async def generate_newsletter(request: Request, lang: str = "fr"):
    """Generate a localized newsletter HTML preview. lang: fr/en/fa (default fr)."""
    await get_current_user(request)
    return await _build_newsletter_html(lang)

@api_router.post("/newsletter/send-multilingual")
async def send_newsletter_multilingual(request: Request):
    """Generate per-language newsletters and send each one to subscribers in that language.
    Subscribers without an explicit language are treated as 'fr' (French default)."""
    await get_current_user(request)
    
    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        raise HTTPException(status_code=500, detail="Email service not configured (RESEND_API_KEY)")
    
    import resend
    resend.api_key = resend_key
    sender = os.environ.get("SENDER_EMAIL", "newsletter@iranobservatory.org")
    
    results = {}
    total_sent = 0
    all_errors = []
    
    for lang in ("fr", "en", "fa"):
        # Query subscribers for this language. For 'fr', include legacy subscribers with missing language.
        if lang == "fr":
            query = {
                "newsletter": True,
                "$or": [
                    {"language": "fr"},
                    {"language": {"$exists": False}},
                    {"language": None},
                    {"language": ""}
                ]
            }
        else:
            query = {"newsletter": True, "language": lang}
        
        subs = await db.subscribers.find(query, {"_id": 0, "email": 1}).to_list(10000)
        if not subs:
            results[lang] = {"total": 0, "sent": 0}
            continue
        
        built = await _build_newsletter_html(lang)
        subject = built["subject"]
        html_content = built["html_content"]
        
        sent_count = 0
        for sub in subs:
            try:
                personalized_html = html_content.replace("{{email}}", sub["email"])
                await asyncio.to_thread(resend.Emails.send, {
                    "from": sender,
                    "to": [sub["email"]],
                    "subject": subject,
                    "html": personalized_html
                })
                sent_count += 1
            except Exception as e:
                all_errors.append(f"[{lang}] {sub['email']}: {str(e)}")
        
        results[lang] = {"total": len(subs), "sent": sent_count}
        total_sent += sent_count
    
    return {
        "status": "sent" if total_sent > 0 else "no_subscribers",
        "total_sent": total_sent,
        "by_language": results,
        "errors": all_errors[:20]
    }

# Admin endpoint to manually trigger brief generation
@api_router.post("/briefs/generate")
async def trigger_brief_generation(request: Request):
    """Admin: Manually trigger weekly brief generation."""
    await get_current_user(request)
    result = await generate_weekly_brief()
    if result:
        return {"status": "success", "article_id": result}
    raise HTTPException(status_code=500, detail="Brief generation failed")

# Include the router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get('FRONTEND_URL', 'http://localhost:3000'), "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Admin seeding
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@iranobservatory.org")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")
    
    # Seed default RSS feeds if none exists
    feeds_count = await db.rss_feeds.count_documents({})
    if feeds_count == 0:
        # English social feed
        await db.rss_feeds.insert_one({
            "name": "Iran Observatory - English",
            "url": "https://rss.app/feeds/cPvRWpMkf81Tx8nr.xml",
            "category": "social",
            "language": "en",
            "is_regime_source": False,
            "active": True,
            "last_fetched": None,
            "created_at": datetime.now(timezone.utc)
        })
        # French social feed
        await db.rss_feeds.insert_one({
            "name": "Observatoire de l'Iran - Français",
            "url": "https://rss.app/feeds/0aYtpxYInp9pe8Vz.xml",
            "category": "social",
            "language": "fr",
            "is_regime_source": False,
            "active": True,
            "last_fetched": None,
            "created_at": datetime.now(timezone.utc)
        })
        logger.info("Default RSS feeds created (EN + FR)")

    # Idempotent migration: backfill is_regime_source on existing feeds.
    await db.rss_feeds.update_many(
        {"is_regime_source": {"$exists": False}},
        {"$set": {"is_regime_source": False}}
    )

    # Migration: replace previously-seeded direct .ir endpoints (which fail
    # outside Iran) with the new Google News proxy entries. Safe to run on
    # every startup; only matches the legacy URLs.
    await db.rss_feeds.delete_many({"url": {"$in": [
        "https://www.tasnimnews.com/en/rss/feed/0/8/0/world-service",
        "https://www.farsnews.ir/en/rss/allnews",
    ]}})

    # Idempotent seed of regime-monitored feeds (Tasnim + Fars).
    # We flag them is_regime_source=True so every downstream AI prompt
    # auto-prefixes attribution and never treats their claims as neutral fact.
    # NOTE: direct .ir RSS endpoints often fail from outside Iran (DNS / TLS).
    # We proxy via Google News RSS which is globally reliable and updates in
    # near real-time. The is_regime_source flag is what matters for editorial
    # treatment — not the underlying transport.
    REGIME_FEEDS_TO_SEED = [
        {
            "name": "Tasnim News (Régime — via Google News)",
            "url": "https://news.google.com/rss/search?q=site:tasnimnews.com&hl=en-US&gl=US&ceid=US:en",
            "category": "regime",
            "language": "en",
        },
        {
            "name": "Fars News (Régime — via Google News)",
            "url": "https://news.google.com/rss/search?q=site:farsnews.ir&hl=en-US&gl=US&ceid=US:en",
            "category": "regime",
            "language": "en",
        },
    ]
    for f in REGIME_FEEDS_TO_SEED:
        await db.rss_feeds.update_one(
            {"url": f["url"]},
            {"$setOnInsert": {
                **f,
                "is_regime_source": True,
                "active": True,
                "last_fetched": None,
                "created_at": datetime.now(timezone.utc),
            }},
            upsert=True,
        )
    logger.info("Regime-monitored RSS feeds ensured (Tasnim + Fars)")
    
    # Write test credentials
    Path("/app/memory").mkdir(exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
""")

@app.on_event("startup")
async def startup():
    await seed_admin()
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.articles.create_index("status")
    await db.articles.create_index("created_at")
    await db.rss_items.create_index("link", unique=True)
    await db.rss_items.create_index("processed")
    # Start background auto-fetch task
    asyncio.create_task(auto_fetch_all_feeds())
    # Also do an immediate fetch on startup
    feeds = await db.rss_feeds.find({"active": True}).to_list(50)
    for feed in feeds:
        await _fetch_single_feed(feed)
    logger.info("Initial RSS fetch completed")
    # Evaluate any unevaluated items
    pending_items = await db.rss_items.find(
        {"suggestion_status": {"$exists": False}, "processed": False}
    ).to_list(50)
    if pending_items:
        asyncio.create_task(_evaluate_rss_items(pending_items))
        logger.info(f"Evaluating {len(pending_items)} RSS items with AI")
    # Start dashboard auto-refresh
    asyncio.create_task(auto_refresh_dashboard())
    # Compute dashboard on startup
    asyncio.create_task(_compute_dashboard_indexes())
    # Start weekly brief scheduler
    asyncio.create_task(weekly_brief_scheduler())

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
