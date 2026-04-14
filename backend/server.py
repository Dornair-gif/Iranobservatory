from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

# Create the main app
app = FastAPI(title="Iran Observatory API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
JWT_ALGORITHM = "HS256"

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

class RSSFeedResponse(RSSFeedBase):
    id: str
    active: bool
    language: str = "en"
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
        "active": True,
        "last_fetched": None
    }

@api_router.put("/rss/feeds/{feed_id}")
async def update_rss_feed(feed_id: str, data: RSSFeedBase, request: Request):
    """Update RSS feed name, URL, category, or language"""
    await get_current_user(request)
    
    update_doc = {
        "name": data.name,
        "url": data.url,
        "category": data.category,
        "language": data.language
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
            system_message="""You are an editorial assistant for Iran Observatory. Your job is to evaluate news items and identify which ones have potential for in-depth journalistic analysis.

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
            system_message="""You are a senior analyst for Iran Observatory, an independent platform offering fact-based insights into Iran's political, economic and social dynamics.

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
            
            generated[f"title_{lang}"] = title_response.strip()
            generated[f"content_{lang}"] = content_response.strip()
            generated[f"summary_{lang}"] = summary_response.strip()
        
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
        "image_url": data.image_url,
        "source_url": data.source_url,
        "tags": data.tags,
        "category": data.category,
        "content_type": data.content_type,
        "status": "draft",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.articles.insert_one(article_doc)
    
    return {
        "id": str(result.inserted_id),
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
        "image_url": 1, "source_url": 1, "tags": 1,
        "category": 1, "content_type": 1, "status": 1,
        "created_at": 1, "updated_at": 1, "published_at": 1
    }
    
    articles = await db.articles.find(query, projection).sort("created_at", -1).to_list(limit)
    result = []
    for article in articles:
        result.append({
            "id": str(article["_id"]),
            "title_en": article.get("title_en", ""),
            "title_fr": article.get("title_fr", ""),
            "title_fa": article.get("title_fa", ""),
            "content_en": "",  # Not included in list view for performance
            "content_fr": "",
            "content_fa": "",
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

@api_router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: str):
    article = await db.articles.find_one({"_id": ObjectId(article_id)})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {
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
    }

@api_router.put("/articles/{article_id}")
async def update_article(article_id: str, data: ArticleUpdate, request: Request):
    await get_current_user(request)
    
    update_doc = {
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
        "pdf_url": data.pdf_url,
        "tags": data.tags,
        "category": data.category,
        "content_type": data.content_type,
        "updated_at": datetime.now(timezone.utc)
    }
    
    if data.status:
        update_doc["status"] = data.status
        if data.status == "published":
            update_doc["published_at"] = datetime.now(timezone.utc)
    
    result = await db.articles.update_one(
        {"_id": ObjectId(article_id)},
        {"$set": update_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {"message": "Article updated"}

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
    
    return {"message": "Article published"}

@api_router.delete("/articles/{article_id}")
async def delete_article(article_id: str, request: Request):
    await get_current_user(request)
    
    result = await db.articles.delete_one({"_id": ObjectId(article_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {"message": "Article deleted"}

# PDF Upload endpoint
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@api_router.post("/upload/pdf")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    await get_current_user(request)
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}.pdf"
    file_path = UPLOAD_DIR / safe_name
    
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    backend_url = os.environ.get("BACKEND_URL", "")
    pdf_url = f"{backend_url}/api/files/{safe_name}"
    
    return {"pdf_url": pdf_url, "filename": file.filename}

@api_router.get("/files/{filename}")
async def serve_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="application/pdf", filename=filename)

# Subscriber / Email collection endpoints
@api_router.post("/subscribers")
async def subscribe(request: Request):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    newsletter = body.get("newsletter", False)
    article_id = body.get("article_id")
    
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
        "downloads": [{"article_id": article_id, "date": datetime.now(timezone.utc).isoformat()}] if article_id else [],
        "created_at": datetime.now(timezone.utc)
    }
    await db.subscribers.insert_one(subscriber)
    return {"message": "Subscribed successfully"}

@api_router.get("/subscribers")
async def get_subscribers(request: Request):
    await get_current_user(request)
    subs = await db.subscribers.find({}).sort("created_at", -1).to_list(500)
    return [{
        "id": str(s["_id"]),
        "email": s["email"],
        "newsletter": s.get("newsletter", False),
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
            system_message="""You are a geopolitical data analyst for Iran Observatory. Produce accurate, source-based quantitative indexes. Return ONLY valid JSON."""
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
"human_rights_index": {{"score": <float 1-10>, "level": "<LOW|MODERATE|ELEVATED|CRITICAL>", "summary": "<1 sentence explaining the HR situation severity>", "key_factors": ["<factor1>","<factor2>","<factor3>"]}},
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
        dashboard_data = json_lib.loads(r1.strip())
        
        # CALL 2: Human rights timeline + sanctions + economic
        chat2 = LlmChat(
            api_key=api_key,
            session_id=f"dashboard2-{uuid.uuid4()}",
            system_message="""You are a geopolitical data analyst. Return ONLY valid JSON."""
        ).with_model("openai", "gpt-5.2")
        
        prompt2 = f"""Based on these sources about Iran, produce detailed economic and sanctions tracking data.

HRA News (Telegram):
{hra_texts[:1500]}

VahidOnline (Telegram):
{vahid_texts[:1500]}

NEWS headlines:
{rss_titles[:2000]}

Return ONLY this JSON:
{{"sanctions_tracker": {{
  "us_active_count": <int, estimated total active US sanctions designations on Iran>,
  "eu_active_count": <int, estimated total active EU restrictive measures on Iran>,
  "un_active_count": <int, estimated total active UN sanctions on Iran including snapback>,
  "us_trend": [<12 ints representing monthly new US sanctions count over past year, oldest to newest>],
  "eu_trend": [<12 ints representing monthly new EU sanctions count over past year, oldest to newest>],
  "categories": [
    {{
      "regime": "United States",
      "short": "US",
      "description": "<1 sentence: overall US sanctions posture toward Iran>",
      "key_sanctions": [
        {{"name":"<sanction program or EO name>","date":"<YYYY-MM-DD or year>","target":"<sector/entities targeted>","status":"Active","details":"<1 sentence impact>"}}
      ]
    }},
    {{
      "regime": "European Union",
      "short": "EU",
      "description": "<1 sentence: overall EU sanctions posture toward Iran>",
      "key_sanctions": [
        {{"name":"<regulation or decision name>","date":"<YYYY-MM-DD or year>","target":"<sector/entities targeted>","status":"Active","details":"<1 sentence impact>"}}
      ]
    }},
    {{
      "regime": "United Nations (Snapback)",
      "short": "UN",
      "description": "<1 sentence explaining the UN snapback mechanism reactivation and its significance>",
      "key_sanctions": [
        {{"name":"<UNSCR number or measure>","date":"<YYYY-MM-DD or year>","target":"<what it restricts>","status":"Active","details":"<1 sentence impact>"}}
      ]
    }}
  ]
}},
"economic_indicators": {{
  "summary": "<2-3 sentences overall economic situation>",
  "metrics": [
    {{"label":"IRR/USD (Parallel Market)","value":"<estimated current rate>","change_pct": <float, recent % change>,"trend_data":[<8 floats representing recent values>],"context":"<1 sentence>"}},
    {{"label":"Brent Crude Oil","value":"<current price estimate>","change_pct": <float>,"trend_data":[<8 floats>],"context":"<1 sentence>"}},
    {{"label":"Inflation Rate","value":"<current estimate %>","change_pct": <float>,"trend_data":[<8 floats>],"context":"<1 sentence>"}},
    {{"label":"TEDPIX (Tehran Stock Exchange)","value":"<current estimate>","change_pct": <float>,"trend_data":[<8 floats>],"context":"<1 sentence>"}},
    {{"label":"War Damage Estimate","value":"<if mentioned in sources>","change_pct": <float>,"trend_data":[<8 floats>],"context":"<1 sentence>"}}
  ]
}}}}
IMPORTANT for sanctions:
- For US: List the 5-7 most important active sanctions programs (e.g., EO 13846 oil exports, EO 13902 construction/mining, IRGC designation, banking sanctions, OFAC SDN designations for key entities).
- For EU: List the 5-7 most important active EU restrictive measures (arms embargo, oil embargo, financial restrictions, IRGC listings, tech export bans).
- For UN Snapback: The UN snapback mechanism was triggered. List the key UNSC resolutions that were reactivated (UNSCR 1696, 1737, 1747, 1803, 1835, 1929, 2231 provisions). Explain the arms embargo, ballistic missile restrictions, and other measures now back in force.
- Use actual sanction program names and resolution numbers. Be specific and factual.
Be accurate based on the sources. For economic data, use the most recent figures mentioned or reasonable estimates."""

        msg2 = UserMessage(text=prompt2)
        response2 = await chat2.send_message(msg2)
        
        r2 = response2.strip()
        if r2.startswith("```"):
            r2 = r2.split("```")[1]
            if r2.startswith("json"):
                r2 = r2[4:]
        data2 = json_lib.loads(r2.strip())
        
        # Merge
        dashboard_data.update(data2)
        
        dashboard_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        dashboard_data["rss_items_analyzed"] = len(recent_items)
        dashboard_data["telegram_messages_analyzed"] = len(hra_messages) + len(vahid_messages)
        
        # Cache in DB
        await db.dashboard_cache.delete_many({})
        await db.dashboard_cache.insert_one(dashboard_data)
        
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
        return cached
    # Compute on first request
    data = await _compute_dashboard_indexes()
    if data:
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
    
    # Use environment variable for base URL
    base_url = os.environ.get('FRONTEND_URL', 'https://iranobservatory.org').rstrip('/')
    
    # Get all published articles with projection (only needed fields)
    articles = await db.articles.find(
        {"status": "published"}, 
        {"_id": 1, "updated_at": 1, "created_at": 1}
    ).limit(1000).to_list(1000)
    
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Main pages
    pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "daily"},
        {"loc": "/articles", "priority": "0.9", "changefreq": "daily"},
        {"loc": "/studies", "priority": "0.9", "changefreq": "weekly"},
    ]
    
    for page in pages:
        xml_content += f'''  <url>
    <loc>{base_url}{page["loc"]}</loc>
    <changefreq>{page["changefreq"]}</changefreq>
    <priority>{page["priority"]}</priority>
  </url>\n'''
    
    # Article pages
    for article in articles:
        article_id = str(article["_id"])
        lastmod = article.get("updated_at") or article.get("created_at")
        lastmod_str = lastmod.strftime("%Y-%m-%d") if lastmod else ""
        
        xml_content += f'''  <url>
    <loc>{base_url}/article/{article_id}</loc>
    <lastmod>{lastmod_str}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n'''
    
    xml_content += '</urlset>'
    
    return Response(content=xml_content, media_type="application/xml")

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
            "active": True,
            "last_fetched": None,
            "created_at": datetime.now(timezone.utc)
        })
        logger.info("Default RSS feeds created (EN + FR)")
    
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
