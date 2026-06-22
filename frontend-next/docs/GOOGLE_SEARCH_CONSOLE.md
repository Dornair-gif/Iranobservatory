# Google Search Console — Setup Guide

Audit recommandation #9: *"Register Search Console and submit a sitemap so you can see exactly which queries, if any, currently reach it."*

## Étape 1 — Ajouter la propriété dans Search Console

1. Aller sur https://search.google.com/search-console
2. **Add property** → choisir **URL prefix** (pas Domain — plus simple)
3. Coller : `https://iranobservatory.org`
4. Google propose plusieurs méthodes de vérification. **Choisir "HTML tag"** (le plus simple avec Next.js).
5. Copier le `content="..."` du méta tag proposé (chaîne ~50 caractères, format `abcDEF...123`).

## Étape 2 — Ajouter le token dans Vercel

1. Aller sur **vercel.com → Project Iranobservatory → Settings → Environment Variables**
2. Ajouter :
   - **Key** : `NEXT_PUBLIC_GSC_TOKEN`
   - **Value** : la chaîne `abcDEF...123` (sans guillemets ni `content=`)
   - **Environment** : Production (cocher uniquement)
3. Cliquer **Save**.
4. Vercel **redéploie automatiquement** (~1 min).

## Étape 3 — Vérifier dans Search Console

1. Retourner sur Search Console, cliquer **Verify**.
2. Google va lire `<meta name="google-site-verification" content="...">` dans le HTML de la home.
3. Statut → **Ownership verified** ✅

## Étape 4 — Soumettre le sitemap

1. Dans Search Console → menu de gauche → **Sitemaps**
2. **Add a new sitemap** : coller `sitemap.xml`
3. Cliquer **Submit**.
4. Google va scanner toutes les URLs (~84 URLs canoniques avec hreflang multilingue).

**Note** : le sitemap est dynamique et inclut :
- Toutes les pages éditoriales (FR/EN/FA) — `/a-propos`, `/methodologie`, `/manifeste`
- Les hubs catégories — 11 catégories × 3 langues = 33 URLs
- Toutes les pages articles + tags
- Avec `<lastmod>` automatique sur chaque article

## Étape 5 — Bing Webmaster Tools (bonus)

Bing/DuckDuckGo représentent ~10% du trafic mais reposent sur le même fichier sitemap.

1. https://www.bing.com/webmasters → Add Site
2. Choisir **Add tag method**
3. Copier le `content="..."` du méta `msvalidate.01`
4. Ajouter dans Vercel : `NEXT_PUBLIC_BING_TOKEN` = cette valeur

## Étape 6 — Surveillance hebdomadaire

Une fois indexé (24-72h), surveiller dans Search Console :

| Métrique | Cible 1 mois | Cible 3 mois |
|---|---|---|
| Pages indexées | > 30 | > 80 |
| Impressions | > 100/jour | > 1000/jour |
| Clics | > 5/jour | > 50/jour |
| Position moyenne sur "Iran Observatory" | < 30 | < 10 |

**Action si pas d'indexation après 7 jours** : utiliser le **URL Inspection Tool** dans GSC pour forcer l'indexation des pages clés (`/fr`, `/fr/a-propos`, `/fr/manifeste`, `/fr/articles/category/sanctions`).

## Étape 7 — Demander l'indexation manuellement (URL Inspection)

Pour chaque page importante :
1. GSC → barre de recherche en haut → coller l'URL
2. Cliquer **Request Indexing**
3. Limite : ~10 URLs/jour, à étaler sur 7-10 jours pour ne pas être ratelimited

URLs prioritaires :
- `https://iranobservatory.org/fr`
- `https://iranobservatory.org/fr/a-propos`
- `https://iranobservatory.org/fr/manifeste`
- `https://iranobservatory.org/fr/methodologie`
- `https://iranobservatory.org/en`
- `https://iranobservatory.org/en/manifesto`
- `https://iranobservatory.org/fr/articles/category/sanctions`
- `https://iranobservatory.org/fr/articles/category/politics`
- `https://iranobservatory.org/fr/articles/category/rights`
- `https://iranobservatory.org/fr/articles/category/diplomacy`
