# Domain Strategy — IranIntel.com / .org + IranDecrypt.com / .org

## Stratégie SEO

L'auditeur recommande de différencier "Iran Observatory" pour échapper à la collision avec l'observatoire astronomique iranien. Plutôt que renommer (ce qui sacrifie l'autorité déjà accumulée), nous gardons `iranobservatory.org` comme **canonical** et acquérons 4 domaines secondaires qui pointent vers lui via **redirects 301 permanents**.

## Domaines à acquérir

| Domaine | Statut | Stratégie |
|---|---|---|
| `iranobservatory.org` | Possédé ✅ | **Canonical** — toutes les autres redirigent ici |
| `iranintel.com` | À acheter | 301 → iranobservatory.org |
| `iranintel.org` | À acheter | 301 → iranobservatory.org |
| `irandecrypt.com` | À acheter | 301 → iranobservatory.org |
| `irandecrypt.org` | À acheter | 301 → iranobservatory.org |

**Où acheter** :
- Cloudflare Registrar (https://dash.cloudflare.com → Domains) — prix au coût, pas de margin
- Namecheap — fiable, support correct
- ❌ **Pas GoDaddy** — markup élevé + UX vieille

**Coût estimé** : ~$40-60/an total pour les 4 domaines.

## Configuration sur Vercel (étape par étape)

### 1. Ajouter chaque domaine dans Vercel

Pour chacun des 4 nouveaux domaines :

1. Vercel Dashboard → **Iranobservatory project** → **Settings → Domains**
2. **Add Domain** → entrer `iranintel.com` (par exemple)
3. Vercel demande de configurer les DNS chez le registrar :
   - **Apex record (`@`)** : type `A`, valeur `76.76.21.21`
   - **www subdomain** : type `CNAME`, valeur `cname.vercel-dns.com`
4. Après ajout DNS, retourner sur Vercel → cliquer **Refresh** → statut devient ✅ "Valid Configuration"

### 2. Configurer la redirection 301

C'est l'étape critique pour le SEO :

1. Sur la même page Vercel **Settings → Domains**
2. Cliquer sur `iranintel.com` → **Edit**
3. Trouver l'option **"Redirect to"** (apparaît seulement quand le domaine n'est pas le primary)
4. Sélectionner `iranobservatory.org`
5. **Status code** : `308 Permanent Redirect` (équivalent SEO d'un 301)
6. **Save**

Vercel redirige alors **automatiquement** :
- `https://iranintel.com/fr/articles` → `https://iranobservatory.org/fr/articles`
- `https://iranintel.com/manifeste` → `https://iranobservatory.org/manifeste`
- etc. (le path est préservé)

### 3. Répéter pour les 3 autres domaines

`iranintel.org`, `irandecrypt.com`, `irandecrypt.org` — même procédure.

## Pourquoi ça aide le SEO

1. **Capture le tape-in traffic** : un utilisateur qui tape `irandecrypt.com` arrive directement chez nous.
2. **Bloque les squatters** : empêche un concurrent ou un opposant idéologique d'acheter ces noms pour vous discréditer.
3. **Link juice transfer** : tout lien externe pointant vers `iranintel.com` est compté comme un backlink vers `iranobservatory.org` grâce au 308.
4. **Brand reinforcement** : les keywords "Iran Decrypt" et "Iran Intel" sont **déjà dans nos keywords meta + Organization JSON-LD alternateName** (cf. `app/layout.jsx`). Google associe les 4 expressions à un seul brand.
5. **Anti-collision** : "Iran Observatory" reste recherchable mais on capture aussi tout le trafic "Iran Intel" + "Iran Decrypt" qui n'a pas de concurrent direct.

## Erreurs à ne pas faire

❌ **NE PAS** faire pointer les 4 domaines vers le même serveur sans 301 → Google détecte le duplicate content et déclasse tout.

❌ **NE PAS** mettre `iranintel.com` comme primary à la place d'`iranobservatory.org` → vous perdriez 8 mois d'autorité accumulée sur le canonical actuel.

❌ **NE PAS** acheter `iran-observatory.org` (avec tiret) → pas de gain SEO et risque de phishing.

## Checklist d'exécution

- [ ] Acheter `iranintel.com` (~$10)
- [ ] Acheter `iranintel.org` (~$13)
- [ ] Acheter `irandecrypt.com` (~$10)
- [ ] Acheter `irandecrypt.org` (~$13)
- [ ] Ajouter les 4 dans Vercel (DNS + Domains tab)
- [ ] Configurer 308 Permanent Redirect → iranobservatory.org
- [ ] Tester chaque redirect avec `curl -I https://iranintel.com` (doit retourner `308` + `location: https://iranobservatory.org`)
- [ ] Mettre à jour les bios sociales avec les 4 URLs (cohérence brand)

## Test post-déploiement

```bash
# Doit retourner 308 + Location header
curl -I https://iranintel.com
curl -I https://iranintel.org
curl -I https://irandecrypt.com
curl -I https://irandecrypt.org

# Doit retourner 200 + HTML normal
curl -I https://iranobservatory.org
```
