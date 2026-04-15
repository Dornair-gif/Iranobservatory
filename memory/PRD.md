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

### P1 (High Priority)
- Favicon: en attente d'un logo carré fourni par l'utilisateur
- Scheduled RSS feed auto-fetching
- Email notifications for new draft articles
- Article image upload functionality

### P2 (Medium Priority)
- Persian social media feed (utilisateur a dit "plus tard")
- Newsletter subscription system
- Premium content gating (subscription)
- Article analytics dashboard

### P3 (Nice to Have)
- Direct social media API integration (bypass RSS)
- AI-powered article categorization
- Reader comments system
- Dark mode toggle
