# Iran Observatory — Next.js Frontend (Vercel)

Frontend public d'Iran Observatory, déployé sur Vercel.
Le backend FastAPI + MongoDB + admin restent sur Emergent (inchangés).

## 🏗️ Architecture

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│  Vercel (ce repo)           │         │  Emergent (inchangé)        │
│  iranobservatory.org        │  ◀──→   │  FastAPI + MongoDB          │
│  - SSR / ISR Next.js        │         │  - Admin panel              │
│  - SEO natif                │         │  - IA / RSS / Newsletter    │
│  - 0 € / mois               │         │                             │
└─────────────────────────────┘         └─────────────────────────────┘
                ↑
        Bouton "Publier" depuis Admin
        → POST /api/revalidate
        → Next.js rebuild la page immédiatement
```

## 📁 Structure

```
app/
├── layout.jsx              # Root layout (globals.css)
├── page.jsx                # Redirect / → /fr
├── not-found.jsx           # 404
├── sitemap.js              # /sitemap.xml dynamique (ISR 1h)
├── robots.js               # /robots.txt
├── [lang]/                 # FR / EN / FA — SEO-friendly
│   ├── layout.jsx          # Sets <html lang=… dir=…>
│   ├── page.jsx            # Home
│   ├── articles/page.jsx   # Liste articles
│   └── article/[slug]/     # Article single (ISR + JSON-LD)
│       └── page.jsx
└── api/
    └── revalidate/route.js # On-demand revalidation

components/
├── Header.jsx
├── Footer.jsx
├── ArticleCard.jsx
└── StudyHtmlFrame.jsx      # iframe sandboxé pour études HTML

lib/
├── api.js                  # Couche API (avec ISR + throw on bad response)
├── i18n.js                 # Traductions FR/EN/FA
├── imageUrl.js             # Normalisation des URLs d'images
└── sanitize.js             # DOMPurify isomorphique
```

## 🚀 Premier déploiement (étape par étape)

### 1. Créer le repo GitHub
```bash
cd /app/frontend-next
git init
git add .
git commit -m "Initial commit: Iran Observatory Next.js frontend"
git branch -M main
git remote add origin https://github.com/VOTRE_USER/iran-observatory-next.git
git push -u origin main
```

### 2. Connecter à Vercel
1. https://vercel.com/new
2. Import votre repo
3. Framework: **Next.js** (auto-détecté)
4. **Build settings** : tout par défaut
5. **Environment Variables** : ajouter
   ```
   REVALIDATE_SECRET = (générer avec `openssl rand -hex 32`)
   ```
6. Deploy

### 3. Domaine
1. Dans Vercel → Project → **Settings** → **Domains**
2. Ajouter `iranobservatory.org`
3. Suivre les instructions DNS (CNAME ou A record)

⚠️ **Avant de switcher le DNS**, testez d'abord sur l'URL Vercel temporaire (`iran-observatory-next.vercel.app`) pour vérifier que tout marche.

### 4. Côté Emergent — Ajouter le bouton "Publier"
Voir `/app/EMERGENT_REVALIDATE_INTEGRATION.md`.

## 🔄 Workflow de publication

1. Admin écrit/modifie un article sur Emergent (`/admin`)
2. Admin clique **« Publier »**
3. Le backend Emergent appelle `https://iranobservatory.org/api/revalidate?secret=...&path=/fr/article/SLUG`
4. Next.js régénère immédiatement la page concernée
5. Visiteurs voient l'article instantanément (pas d'attente ISR de 5 min)

Sans cliquer Publier, l'ISR rafraîchit automatiquement toutes les 5 min.

## 🌍 SEO

- ✅ Pages indexables (HTML SSR/SSG complet, pas de SPA vide)
- ✅ `<title>`, `<meta description>` spécifiques par page et par langue
- ✅ JSON-LD `NewsArticle` sur chaque article
- ✅ `hreflang` FR/EN/FA sur toutes les pages
- ✅ Sitemap dynamique avec tous les articles + alternates
- ✅ Open Graph + Twitter Cards
- ✅ `robots.txt` propre

## 💡 Pièges connus (lessons learned)

| Piège | Solution |
|---|---|
| `Module not found: '@/lib/api'` | Vérifier `jsconfig.json` à la racine |
| Sitemap vide | Backend `/api/articles` doit être joignable. Tester avec `curl https://iran-events-live.preview.emergentagent.com/api/articles?limit=1` |
| Images ne s'affichent pas | Ajouter le host dans `next.config.mjs` → `images.remotePatterns` |
| 404 sur articles existants | Le slug a un caractère bizarre. Vérifier `/api/articles/SLUG` côté backend |
| Build Vercel échoue | Local `yarn build` doit passer. Lancer en local pour reproduire |
| Cache poisoning (ISR stocke une 500) | `lib/api.js` fait `throw` sur réponse non-OK — ne JAMAIS retourner un fallback |
| Vercel preview ne marche pas | Hardcoder l'URL backend dans `next.config.mjs`, pas dans `.env` Vercel |

## 🧪 Test local

```bash
cd /app/frontend-next
yarn install
yarn dev
# → http://localhost:3000
```

Build de production :
```bash
yarn build && yarn start
```

## 🔐 Backend URL

Hardcodée dans `next.config.mjs` :
```js
const BACKEND_URL = "https://iran-events-live.preview.emergentagent.com";
```

⚠️ **Pour la prod** : changez cette URL vers l'URL du backend Emergent en production (ou un sous-domaine `api.iranobservatory.org` si vous en créez un).

## 📞 Support

- Build issues : `yarn build` en local d'abord
- Vercel logs : `vercel logs` ou dans le dashboard
- Backend logs : sur Emergent
