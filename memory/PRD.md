# Iran Observatory / Observatoire de l'Iran - PRD

## Original Problem Statement
Build a best-in-class website for Iran Observatory with real-time monitoring of Iran events, highly automated content generation, and integration with existing social media feeds (X, Instagram, LinkedIn).

## Brand Identity
- **Tagline EN**: "Independent insights into Iran's political, economic and social dynamics"
- **Tagline FR**: "Analyses indépendantes des dynamiques politiques, économiques et sociales de l'Iran"
- **Motto**: "Iran's future matters, far beyond its borders"
- **Colors**: Navy Blue (#1E3A5F), Emerald Green (#3DB883)
- **Editorial Stance**: Independent, fact-based, critical of Islamic Republic but impartial

## User Personas
- **Admin/Editor**: Manages content, reviews AI-generated drafts, publishes articles
- **Public Reader**: Consumes news in French, English, or Persian

## Core Requirements (Static)
1. AI-powered content generation with admin review before publishing
2. RSS feed integration for social media aggregation
3. Multi-language support (FR/EN/FA) with localized translations
4. Admin panel with JWT authentication
5. Professional news + modern aesthetic design
6. Independent editorial voice - critical but impartial

## What's Been Implemented
- ✅ Full-stack application (React + FastAPI + MongoDB)
- ✅ Official Iran Observatory branding (logo, colors, taglines)
- ✅ AI content generation with GPT-5.2 via Emergent LLM Key
- ✅ Editorial stance embedded in AI system prompts
- ✅ RSS feed management (add, fetch, delete feeds)
- ✅ Multi-language support with RTL for Persian
- ✅ JWT-based admin authentication
- ✅ Article workflow (draft → review → publish)
- ✅ Swiss/brutalist editorial design aesthetic
- ✅ Real-time social feed widget integration
- ✅ Responsive design for mobile
- ✅ SEO: Dynamic sitemaps, robots.txt, react-helmet-async meta tags
- ✅ Cross-fact-checking & contextual enrichment in AI prompts
- ✅ RSS image extraction: AI-generated articles use original RSS source images (April 2026)

## Technology Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Motor (MongoDB async)
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Auth**: JWT with httpOnly cookies
- **Database**: MongoDB

## Admin Credentials
- Email: admin@iranobservatory.org
- Password: IranObs2024!

## Prioritized Backlog

### P0 (Completed)
- **GridFS file persistence (May 2026)**: All admin uploads (study images, PDFs, founder photos) now stored in MongoDB GridFS instead of local disk → survives container redeploys
- **Unsubscribe link fixed (May 2026)**: All newsletter templates (welcome, custom, auto) now point to `/api/unsubscribe` (was broken `/unsubscribe` frontend route)
- RSS image sync: Articles use original RSS source images
- Favicon: Custom radar icon deployed
- AI-powered RSS filtering + reject mechanism
- Auto-fetch RSS every 30min + startup evaluation
- Production login fix (secure cookies + token fallback)
- Assertive AI prompt + manual article creation
- Magazine-format Articles & Studies pages with pagination
- Navigation links (Articles, Studies) in header
- PDF upload on articles + email collection for downloads + Subscribers admin tab
- Iran Monitor Dashboard: AI-powered tension index, human rights index (NetBlocks/HRA), 30-day trend chart, economic indicators with sparklines
- Sanctions Tracker: Hardcoded from official EU Council + US Treasury OFAC + UNSCR pages (verified April 2026). Includes EU March 2026 extension, IRGC terrorist designation, UN Snapback, MAHSA Act, SHIP Act. Sector breakdown chart, persons/entities counts, recent packages timeline.
- Source links: Official source links to US Treasury/OFAC, EU Council, UN/UNSCR 2231
- Economic indicators now include time period context (MoM, YoY, WoW) for all % changes
- Dashboard readability overhaul: Bigger text, better contrast, rounded cards, larger index scores (April 2026)
- Homepage articles layout: Smart layout adapts to article count (1, 2, or 3+) — no more empty space (April 2026)
- Sources: RSS feeds + Telegram channels (t.me/hranews, t.me/VahidOnline)

### P1 (Completed)
- **Full SEO Overhaul (May 2026)**:
  - **AI auto-SEO per article**: New endpoint `POST /api/articles/{id}/seo/generate` calls GPT-5.2 to produce `seo_title_{fr,en,fa}` (≤60 chars), `meta_description_{fr,en,fa}` (≤160 chars) and `focus_keywords[]`. Server-side hard-capped. Admin button "✨ Générer SEO (IA)" in the article edit panel.
  - **SEO score endpoint** `GET /api/articles/{id}/seo/score`: 0-100 with 12 checks (slug, per-lang title/desc, image, focus keywords, long-form, tags, published). Live checklist in admin.
  - **Slug-based URLs** for articles: `/article/iran-strait-hormuz-crisis-2026` instead of ObjectIds. Backend lookup supports BOTH slug and legacy ObjectId. Article page does a client-side 301-equivalent redirect from ObjectId → slug for SEO canonicalization. `POST /api/admin/backfill-slugs` to migrate legacy articles (idempotent).
  - **Indexable hub pages** for categories (`/articles/category/{slug}`) and tags (`/articles/tag/{slug}`) with their own SEO, breadcrumbs, and listing. New endpoints `GET /api/categories`, `GET /api/tags`, `GET /api/articles/by-category/{slug}`, `GET /api/articles/by-tag/{slug}`.
  - **Sitemap upgrade**: hreflang FR/EN/FA + x-default on every URL, `image:image` entries for article covers, category & tag hub URLs. New Google News-format `/api/news-sitemap.xml` for last-48h articles. `robots.txt` references both.
  - **Rich Schema.org JSON-LD**: `NewsArticle`/`Report`/`Article` on article pages with `author`, `wordCount`, `keywords`, `inLanguage`, `mainEntityOfPage`. `BreadcrumbList` on every page. Site-wide `Organization` + `WebSite` with `SearchAction` mounted once at app root.
  - **Per-language meta + canonical**: Helmet now manages all `<head>` meta (removed static SEO meta from `index.html` to avoid duplicates). Hreflang links on every page.
  - **Reading time & visible breadcrumbs** on article page. Related articles section (4 cards) by tag-overlap scoring + category match.
  - **SEO Angles Suggester**: `POST /api/seo/suggest-angles` calls GPT-5.2 to propose 10 article ideas with primary keyword, search intent, estimated difficulty, and strategic rationale. Admin tool surfaces them in the Dashboard tab.
  - **Internal linking**: article-page category badge + tag pills now link to hub pages.
  - Backend test coverage: 70/70 pytest cases pass (43 legacy + 27 new SEO).
- **Multilingual Newsletter (May 2026, Option A — per-subscriber language preference)** [carried]
- **Newsletter Founder Introduction (May 2026)** [carried]
- **Newsletter logo enlarged (May 2026)** [carried]
- Studies & Briefs page: Filter tabs (All / Studies & Analysis / Weekly Briefs)
  - Subscribers now have a `language` field (FR/EN/FA, default FR for legacy/new). Stored on `db.subscribers`.
  - Public signup form on Home auto-uses the current site language.
  - Admin → Subscribers tab: language column with inline dropdown to change each subscriber's language. Header shows breakdown FR/EN/FA counts.
  - Admin → Newsletter tab → Founder Introduction: 3 language tabs (FR/EN/فارسی) for name, title, intro text. Photo & signature stay shared. Live preview per tab. Persian preview correctly switches to RTL.
  - Admin → Newsletter tab → Auto Newsletter: language picker tabs to preview each version (FR/EN/فارسی), audience-by-language counter, and a single "Send Newsletter (All Languages)" button calling `/api/newsletter/send-multilingual` which generates 3 emails and dispatches each to its language segment.
  - New endpoints: `POST /api/newsletter/generate?lang=xx`, `POST /api/newsletter/send-multilingual`, `PATCH /api/subscribers/{id}`.
  - Welcome / confirmation email also localized (FR/EN/FA) based on the subscriber's chosen language at signup time.
  - Backend safety: invalid language values fall back to 'fr' on POST; malformed subscriber ID returns 400 (not 500) on PATCH; FR segment query includes legacy subscribers with missing `language` field.
  - Backend test coverage: 43/43 pytest cases pass (19 new + 24 legacy regression).
- **Newsletter Founder Introduction (May 2026)**: Admin can save founder name, title, intro text, photo, signature image — auto-injected at top of weekly newsletter when "Include" toggle is enabled (`/api/settings/founder`)
- **Newsletter logo enlarged (May 2026)**: 55px → 100px for better branding visibility
- Studies & Briefs page: Filter tabs (All / Studies & Analysis / Weekly Briefs)
- Weekly Brief auto-generation: Every Monday 6-8 AM UTC, GPT-5.2 generates HTML brief as draft
- Newsletter system: Admin can generate newsletter HTML + send to opted-in subscribers (requires RESEND_API_KEY)
- Image upload for articles (replaces URL input)
- Article HTML content rendering for studies/analyses

### P2 (Medium Priority)
- Persian social media feed (utilisateur a dit "plus tard")
- Premium content gating (subscription)
- Article analytics dashboard

### P3 (Nice to Have)
- Direct social media API integration (bypass RSS)
- AI-powered article categorization
- Reader comments system
- Dark mode toggle
