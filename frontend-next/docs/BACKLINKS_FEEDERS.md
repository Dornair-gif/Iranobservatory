# Backlinks Feeders — Templates

Audit recommandation #8: *"Use your strongest assets as feeders. DORNA already lists the Observatory as 'affiliated research' and pulls its feed. Add prominent links from manelimirkhan.com and from your Substack and X bios so the Observatory inherits authority from properties that already rank."*

## Pourquoi ?

Google évalue l'autorité d'un nouveau site (Iran Observatory) en partie via les **backlinks** depuis des sites déjà établis (DORNA, manelimirkhan.com, Substack). Chaque lien depuis un site qui rank déjà transmet du "link juice" et accélère l'indexation + le ranking.

**Stratégie** : forcer 3-5 backlinks visibles depuis vos propres propriétés digitales dès maintenant, avant même que GSC ne commence à indexer. Cela donne à Googlebot un signal fort dès la première crawl.

---

## 1. manelimirkhan.com — Footer ou page "Projects"

**Ajouter un bloc** dans le footer ou sur la page "Projects/Engagements" :

```html
<section>
  <h3>Recherche</h3>
  <p>
    Fondatrice et directrice éditoriale d'<a href="https://iranobservatory.org" rel="me">
    <strong>Iran Observatory · Decrypt & Intel</strong></a>, plateforme indépendante
    d'intelligence stratégique sur l'Iran pour décideurs européens.
  </p>
  <p>
    <a href="https://iranobservatory.org/fr/a-propos">À propos d'Iran Observatory →</a>
  </p>
</section>
```

**Important** : utiliser `rel="me"` (web standard) pour confirmer à Google que c'est la même personne qui possède les deux sites. Cela amplifie l'effet E-E-A-T.

---

## 2. Substack — Bio + "About" page

### Bio courte (sous le nom dans chaque article)
> *Founder of Iran Observatory · Decrypt & Intel — iranobservatory.org. Strategic intelligence on Iran for European decision-makers.*

### Substack About page
Ajouter ce bloc en début de page :

```markdown
**This newsletter is the long-form companion to [Iran Observatory · Decrypt & Intel](https://iranobservatory.org)**, the independent platform for strategic intelligence on Iran founded in 2025. While the website publishes verified breaking events and structural analyses, this newsletter delivers exclusive long-horizon notes, founder essays, and behind-the-scenes editorial discussions.

→ [Read the manifesto](https://iranobservatory.org/en/manifesto)  
→ [Browse all analyses](https://iranobservatory.org/en/articles)  
→ [Methodology](https://iranobservatory.org/en/methodology)
```

### Auto-link sur chaque newsletter envoyée
Dans le footer de chaque envoi (Settings → Email):

```
—
Iran Observatory · Decrypt & Intel
https://iranobservatory.org
[Methodology](https://iranobservatory.org/en/methodology) · 
[About](https://iranobservatory.org/en/about) · 
[Manifesto](https://iranobservatory.org/en/manifesto)
```

---

## 3. X (Twitter) — Bios des comptes officiels

### @IrObservatory (EN)
```
Independent strategic intelligence on Iran 🇮🇷
Decrypt the regime. Intel for decision-makers.
🌐 iranobservatory.org
Founder: @ManeliMirkhan
```

### @ObservatoireIR (FR)
```
Décryptage stratégique de l'Iran 🇮🇷 — indépendant, vérifié, sourcé
🌐 iranobservatory.org
Pour décideurs européens. Fondatrice: @ManeliMirkhan
```

### @ManeliMirkhan (personal)
```
Strategic advisor on Iran & European policy
→ iranobservatory.org (research) 
→ dorna.eu (advocacy)
🌐 manelimirkhan.com
```

**Pourquoi ?** Le lien dans la bio X est crawlable par Googlebot et compte comme un backlink "social signal".

---

## 4. LinkedIn — Pages entreprise + perso

### Page "Iran Observatory" (LinkedIn Company Page)
- **Website** → `https://iranobservatory.org`
- **Description** → inclure `iranobservatory.org` en texte clair
- **About** → premier paragraphe doit contenir le nom exact de la marque + URL

### Profil perso (Maneli Mirkhan)
- **Section Experience** → ajouter "Founder, Iran Observatory · Decrypt & Intel" avec URL
- **Featured** → épingler 2-3 articles depuis `iranobservatory.org`

---

## 5. DORNA — Page "Affiliated Research" / Footer

Sur dorna.eu :

```html
<section>
  <h3>Affiliated research</h3>
  <p>
    DORNA collaborates with <a href="https://iranobservatory.org" rel="noopener">
    Iran Observatory · Decrypt & Intel</a>, an independent strategic-intelligence
    platform founded by Maneli Mirkhan. While DORNA advocates for democratic
    transition, Iran Observatory decrypts the regime without partisan stance.
  </p>
  <p><em>Editorial separation is strict: the Observatory decodes, DORNA proposes.</em></p>
</section>
```

Et dans le footer global de dorna.eu :
```html
<div class="affiliated">
  Affiliated research: <a href="https://iranobservatory.org">Iran Observatory · Decrypt & Intel</a>
</div>
```

---

## 6. Instagram bio — @iranobservatory

```
🇮🇷 Independent strategic intelligence on Iran
Decrypt · Intel · Foresight
🔗 iranobservatory.org
```

(Instagram bio link compte aussi comme backlink crawlable.)

---

## 7. Wikipedia (avancé, à faire après 3 mois)

Une fois la plateforme indexée et avec 30+ articles publiés, créer une **page Wikipedia "Iran Observatory"** ou ajouter une mention dans la page Wikipedia de Maneli Mirkhan. C'est le backlink le plus puissant qui existe (DA 91/100).

**Sources nécessaires** : 3+ articles dans la presse mentionnant Iran Observatory (Le Monde, Mediapart, AFP, etc.). Démarche : envoyer des pitch presse + offrir interview à des journalistes spécialisés Iran.

---

## Checklist d'exécution

- [ ] manelimirkhan.com — ajouter bloc footer/projects avec `rel="me"`
- [ ] Substack — bio + about page + footer email
- [ ] X bios (3 comptes) mises à jour
- [ ] LinkedIn — page entreprise + section "Experience" du profil perso
- [ ] DORNA — page affiliated research + footer
- [ ] Instagram bio
- [ ] Wikipedia — sous-tâche à 3 mois

**Impact attendu** : indexation Google sous 7 jours (vs 30+ sans backlinks), classement initial sur "Iran Observatory" entre position 20-40 (vs >100 sans).
