# Emergent → Vercel : intégration du bouton « Publier »

Le frontend Next.js sur Vercel utilise ISR (Incremental Static Regeneration).
Quand l'admin publie/édite un article depuis Emergent, on déclenche un
**revalidate immédiat** côté Vercel pour que les visiteurs voient le nouvel
article sans attendre les 5 min d'ISR.

## Étape 1 — Variables d'environnement

Dans `/app/backend/.env` (Emergent), ajouter :

```
# URL du frontend Vercel (le domaine de production)
NEXT_FRONTEND_URL=https://iranobservatory.org

# Doit être EXACTEMENT la même valeur que dans Vercel → Settings → Env Vars
REVALIDATE_SECRET=<la_même_chaîne_qu_a_vercel>
```

Générer le secret avec :
```bash
openssl rand -hex 32
```
Mettre cette valeur **identique** sur Vercel ET sur Emergent.

## Étape 2 — Endpoint backend qui notifie Vercel

À ajouter dans `/app/backend/server.py` (ou dans la route admin existante) :

```python
import httpx
import os

NEXT_FRONTEND_URL = os.environ.get("NEXT_FRONTEND_URL", "")
REVALIDATE_SECRET = os.environ.get("REVALIDATE_SECRET", "")


async def notify_vercel_revalidate(paths: list[str]):
    """Fire-and-forget revalidation calls to the Next.js frontend.
    Failures are logged but don't block the API response (ISR will eventually
    catch up automatically)."""
    if not NEXT_FRONTEND_URL or not REVALIDATE_SECRET:
        return
    async with httpx.AsyncClient(timeout=5.0) as client:
        for path in paths:
            try:
                await client.post(
                    f"{NEXT_FRONTEND_URL}/api/revalidate",
                    params={"secret": REVALIDATE_SECRET, "path": path},
                )
            except Exception as e:
                logger.warning(f"Revalidate {path} failed: {e}")


# Then on every article publish/update, call:
#   paths = [f"/{lang}/article/{slug}" for lang in ('fr','en','fa')] + ["/fr", "/en", "/fa"]
#   await notify_vercel_revalidate(paths)
```

## Étape 3 — Hook dans la route de publication

Modifier l'endpoint qui publie ou met à jour un article :

```python
@api_router.put("/articles/{article_id}")
async def update_article(article_id: str, data: ArticleUpdate, request: Request):
    user = await get_current_user(request)
    # … logique existante de mise à jour …
    
    # NEW: notify Vercel
    if article.get("status") == "published":
        slug = article.get("slug") or article_id
        paths = [
            "/fr", "/en", "/fa",                           # home
            "/fr/articles", "/en/articles", "/fa/articles", # listing
            f"/fr/article/{slug}",
            f"/en/article/{slug}",
            f"/fa/article/{slug}",
        ]
        # Schedule but don't wait — Vercel responds in ~200ms
        asyncio.create_task(notify_vercel_revalidate(paths))
    
    return updated_article
```

## Étape 4 — Test

```bash
curl -X POST "https://iranobservatory.org/api/revalidate?secret=XXX&path=/fr"
# Response: {"revalidated": true, "path": "/fr"}
```

## Bouton « Publier maintenant » dans l'Admin (optionnel)

Pour donner à l'admin un bouton qui force le revalidate sans publier, ajouter
un endpoint dédié :

```python
@api_router.post("/admin/revalidate-all")
async def trigger_full_revalidate(request: Request):
    """Manual trigger: revalidate the homepage and articles index in all langs."""
    await get_current_user(request)
    paths = ["/fr", "/en", "/fa", "/fr/articles", "/en/articles", "/fa/articles"]
    await notify_vercel_revalidate(paths)
    return {"ok": True, "paths": paths}
```

Et un bouton dans `Admin.js` :
```jsx
<button onClick={async () => {
  await axios.post(`${API}/admin/revalidate-all`, {}, axiosConfig);
  alert("Site rafraîchi !");
}}>
  Publier maintenant
</button>
```
