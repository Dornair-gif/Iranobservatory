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

## Editorial Source Policy (Strictly Enforced — 2026-05-21)
**Banned sources** (never cited, never used as basis for content):
- MEK / Mojahedin-e Khalq / MKO / PMOI / NCRI / CNRI / Rajavi network / Iran-HRM
- Iran International (iranintl) — Saudi-funded, partisan
- Any outlet affiliated with the exiled Iranian opposition

**Regime sources** (Tasnim, Fars, IRNA, Press TV, Mehr, ISNA, Tabnak, Kayhan):
- Allowed ONLY for official Iranian state announcements
- Always prefixed with attribution: "selon les médias d'État iraniens X" / "according to Iranian state media X" / "بنا به منابع حکومتی X"
- Treated as regime narrative, never as neutral fact

**Enforcement**: `EDITORIAL_SOURCE_RULES` constant injected into every AI system_message (article gen, dashboard, weekly brief, RSS evaluator). `_sanitize_editorial()` post-processes every AI output as a safety net. RSS feeds carry `is_regime_source` flag that propagates to items and triggers per-prompt attribution hints.

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
- **UI Restoration + Brand Anonymization + Vercel ISR (Feb 26, 2026)**: Major post-deployment fixes after user feedback on bare layout. (1) Header logo restored to h-28/h-32/h-36 (was h-10), white glass background, Live indicator, Support (HelloAsso) button. (2) Home page rewritten with full SPA-like richness: hero with backdrop, 2/3 articles + 1/3 briefing sidebar (situation summary from /api/dashboard/indexes), Live RSS feed iframe, Studies & Analyses horizontal carousel, gradient Support banner, NewsletterSignup client component posting to /api/subscribers. (3) Articles page split into 3 sections: News, Briefs Hebdo, Études & Analyses (Studies and Briefs were absent). (4) Monitor page rebuilt as real SSR dashboard with briefing bullets + key indicators grid (color-coded by severity 0-100) + latest studies + live RSS. (5) New tagline (FR/EN/FA): "Intelligence and decryption of Iran — independent analysis, verified OSINT, forecasts for decision-makers". (6) Founder name "Maneli Mirkhan" removed everywhere (author/creator/twitter.creator metas, Org JSON-LD founder field replaced by Organization DORNA, alternateName, Footer affiliation, Manifesto signature → "La direction éditoriale" / "The editorial direction" / "هیئت تحریریه", Manifesto Person→Organization JSON-LD, About page mentions across FR/EN/FA, SEO titles). DORNA affiliation retained as institutional credit. (7) Vercel ISR webhook: trigger_vercel_revalidate() helper in server.py (fire-and-forget, non-blocking, env-gated by VERCEL_REVALIDATE_URL + VERCEL_REVALIDATE_SECRET), hooked into PUT /articles/{id}, POST /articles/{id}/publish, DELETE /articles/{id}. Bust paths: /[lang], /[lang]/articles, /[lang]/studies, /[lang]/article/{slug} × 3 langs on every mutation. Pushed to GitHub commit `95b0a46` → Vercel auto-deploy.
- **DNS switch to Vercel + brand on iranobservatory.org (Feb 26, 2026)**: Cloudflare A record updated to Vercel IP `76.76.21.21` + CNAME `www → cname.vercel-dns.com` (both DNS-only, Cloudflare proxy disabled). Old MX/TXT/SPF/DKIM records preserved (OVH email + Resend + GSC verification all intact). SSL Let's Encrypt auto-generated. Site now LIVE on the public domain via Next.js SSG. Sitemap submitted in GSC (full URL form for Domain property).
- **Phase 2 Next.js + SEO Audit Response (Feb 26, 2026)**: Massive migration push answering external SEO audit. (1) Editorial pages ported to Next.js SSG: `/[lang]/a-propos`, `/[lang]/methodologie`, `/[lang]/manifeste` × FR/EN/FA = 9 routes with full `EditorialPage` component, founder-voice italic for Manifesto, `AboutPage`/`Article`/`OpinionNewsArticle` JSON-LD with `Person` schema enriched (sameAs manelimirkhan/x/linkedin, affiliation DORNA). (2) Topic-cluster hubs `/[lang]/articles/category/[slug]` (11 cats × 3 langs = 33 pre-rendered) and `/[lang]/articles/tag/[slug]` (top-50 tags pre-rendered + ISR for the rest) with `BreadcrumbList` + `ItemList` JSON-LD. (3) Sitemap upgraded to 84 canonical URLs with hreflang on each. (4) `robots.txt` enriched: explicit Googlebot/Bingbot allow + GPTBot/ClaudeBot/CCBot block. (5) Layout `verification` reads `NEXT_PUBLIC_GSC_TOKEN` env var → user adds GSC token in Vercel dashboard without redeploy. (6) Org JSON-LD: `parentOrganization: DORNA` + founder `sameAs` enriched. (7) Footer trilingual "Affiliated with DORNA / Founded by Maneli Mirkhan" block with backlinks to dorna.eu + manelimirkhan.com. (8) `vercel.json` with security headers + legacy `/about|/methodology|/manifesto` 301 → `/fr/...`. (9) Three new ops docs: `docs/GOOGLE_SEARCH_CONSOLE.md`, `docs/BACKLINKS_FEEDERS.md`, `docs/DOMAIN_STRATEGY.md` (IranIntel/IranDecrypt 308 setup). Brand kept as "Iran Observatory · Decrypt & Intel", with `Iran Decrypt` / `Iran Intel` already in keywords ready for the 4 secondary domains. Pushed to GitHub commits `8dcb23b` + `b7cc1a4` → Vercel auto-deploy.
- **Brand rename for SEO collision (Feb 2026)**: Renamed everywhere to "Iran Observatory · Decrypt & Intel" to fight the astronomy facility name clash; alternateName covers "Iran Decrypt", "Iran Intel", "Iran Observatory by Maneli Mirkhan".
- **Next.js 15/16 frontend migration (Phase 1 — Feb 2026)**: Public frontend ported to Next.js App Router (`/app/frontend-next/`), deployed on Vercel via GitHub CI/CD. Multilingual routing, SSG with ISR, dynamic sitemap, strict editorial source rules carried over. Old React SPA kept only for Admin panel.
- **Editorial Charter pages (May 21, 2026)**: Three long-form editorial pages live in FR/EN/FA — `/a-propos` (institutional About), `/methodologie` (methodology with source typology, certainty scale, banned/attributed sources policy, public corrections, funding transparency), `/manifeste` (founder-signed manifesto by Maneli Mirkhan). Shared `Footer.js` component with The Observatory + Publications nav, three contact emails (contact/press/partnerships), language switcher, independence statement. Navigation lives in the footer only (per founder request). Sitemap updated. SEO complete: AboutPage JSON-LD, OpinionNewsArticle + Person JSON-LD on manifesto, breadcrumbs, hreflang FR/EN/FA. Founder launch letter (Pièce 4 of the charter) archived at `/app/memory/founder_launch_letter.md` for outreach (not published). Tests: 19/19 pass + iteration_5 editorial-policy tests still green.
- **Editorial Source Lockdown (May 21, 2026)**: Hard guardrails on source citations across ALL AI prompts (article generation, dashboard indexes ×2, weekly brief, RSS evaluator). Banned: MEK/Mojahedin/NCRI/Rajavi/Iran International. Regime sources (Tasnim/Fars/IRNA/Press TV/Mehr/ISNA/Tabnak/Kayhan) require automatic attribution ("selon les médias d'État iraniens X"). Implementation: `EDITORIAL_SOURCE_RULES` constant injected in every system_message + `_sanitize_editorial()` post-processor (sentence-level scrub + attribution prefix; idempotent). RSS feeds carry `is_regime_source` flag propagated to items and shown as ambré "RÉGIME" badge in admin. Tasnim + Fars seeded as monitored regime feeds via Google News RSS (globally reliable). Old `NCRI reports 2,201` hardcoded text removed from Dashboard. Test coverage: 17 new tests (11 sanitizer + 4 RSS API + 1 dashboard scan + 1 signals regression) all pass; legacy 24 tests still pass.
- **Strategic Signals module (May 2026)**: backend CRUD `/api/admin/signals` + public `/api/signals` + Dashboard public UI section. Admin UI for signals still pending (P0 carry-over).
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

### P1 (Next — Awaiting user action)
- **Verify Vercel deployment** of commits `8dcb23b` + `b7cc1a4` (auto-deploy triggered at push). Validate Lighthouse score, /fr/a-propos, /fr/manifeste, /fr/articles/category/sanctions all load < 2s.
- **Add GSC token in Vercel**: follow `frontend-next/docs/GOOGLE_SEARCH_CONSOLE.md` → Step 1-4 → submit sitemap. Optionally add Bing token.
- **Acquire IranIntel.com/.org + IranDecrypt.com/.org**: see `frontend-next/docs/DOMAIN_STRATEGY.md` for 308 redirect config. ~$45/year total.
- **Add backlinks feeders**: see `frontend-next/docs/BACKLINKS_FEEDERS.md` → update bios X/LinkedIn/Substack/Instagram + add DORNA "affiliated research" block on dorna.eu + manelimirkhan.com footer.
- **DNS switch** `iranobservatory.org` from old hosting to Vercel.
- **Connect Emergent Admin "Publish" button to Vercel revalidate** webhook (`/api/revalidate` → instant cache bust). See `/app/EMERGENT_REVALIDATE_INTEGRATION.md`.
- **Add Human Signatures / Author Bios** to articles for full Google E-E-A-T (Person schema per author).
- **Chantier 2 — RSS to Buffer + Telegram FA pipeline** (blocked on Buffer API + Telegram Bot token from user).

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
