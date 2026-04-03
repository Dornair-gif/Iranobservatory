# Iran Observatory / Observatoire d'Iran - PRD

## Original Problem Statement
Build a best-in-class website for Iran Observatory with real-time monitoring of Iran events, highly automated content generation, and integration with existing social media feeds (X, Instagram, LinkedIn).

## User Personas
- **Admin/Editor**: Manages content, reviews AI-generated drafts, publishes articles
- **Public Reader**: Consumes news in French, English, or Persian

## Core Requirements (Static)
1. AI-powered content generation with admin review before publishing
2. RSS feed integration for social media aggregation
3. Multi-language support (FR/EN/FA) with localized translations
4. Admin panel with JWT authentication
5. Professional news + modern aesthetic design

## What's Been Implemented (January 2026)
- ✅ Full-stack application (React + FastAPI + MongoDB)
- ✅ AI content generation with GPT-5.2 via Emergent LLM Key
- ✅ RSS feed management (add, fetch, delete feeds)
- ✅ Multi-language support with RTL for Persian
- ✅ JWT-based admin authentication
- ✅ Article workflow (draft → review → publish)
- ✅ Swiss/brutalist editorial design aesthetic
- ✅ Real-time social feed widget integration
- ✅ Responsive design for mobile

## Technology Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Motor (MongoDB async)
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Auth**: JWT with httpOnly cookies
- **Database**: MongoDB

## Prioritized Backlog

### P0 (Critical)
- All implemented ✅

### P1 (High Priority)
- Scheduled RSS feed auto-fetching
- Email notifications for new draft articles
- Article image upload functionality

### P2 (Medium Priority)
- Newsletter subscription system
- Premium content gating (subscription)
- Article analytics dashboard
- SEO optimization (meta tags, sitemap)

### P3 (Nice to Have)
- Direct social media API integration (bypass RSS)
- AI-powered article categorization
- Reader comments system
- Dark mode toggle

## Admin Credentials
- Email: admin@iranobservatory.org
- Password: IranObs2024!
