# Audit de conformité Matcha — prompt à copier-coller

> À lancer dans une session fraîche à la racine du repo.
> Objectif : savoir si le projet est prêt pour la soutenance, sans angle mort.

---

Tu réalises un **audit de conformité au sujet** du projet Matcha (école 42).
Le sujet est `fr.subject.pdf` à la racine — lis-le en entier avant de commencer
(`pdftotext -layout fr.subject.pdf -`).

## Contexte technique

- **Monorepo pnpm** : `src/backend` (Express + PostgreSQL, SQL écrit à la main),
  `src/frontend` (React 19 + Vite + Tailwind v4 + shadcn/ui), `src/common` (DTOs partagés)
- **Tout tourne dans Docker.** Aucune commande `pnpm` sur l'hôte :
  `docker compose exec -T backend pnpm <script>` · `docker compose exec -T frontend pnpm <script>`
  SQL : `docker compose exec -T postgres psql -U matcha -d matcha -c "..."`
- nginx en reverse proxy, HTTPS sur `https://localhost:8443` (certificat auto-signé → `curl -k`)
- Mailpit (faux SMTP) sur `http://localhost:8025`
- Comptes de test : e-mails `@seed.matcha.local`, mot de passe commun `Password1!`

## Méthode imposée — non négociable

1. **Aucune conclusion sans preuve.** Chaque verdict cite un `fichier:ligne` ou la sortie
   d'une commande que tu as réellement exécutée. Interdiction de dire « ça a l'air
   implémenté » ou « probablement ».
2. **Trois verdicts seulement** : ✅ CONFORME · ⚠️ PARTIEL · ❌ MANQUANT.
   Pour ⚠️ et ❌, précise ce qui manque exactement et où.
3. **Vérifie back ET front** pour chaque exigence. Une route backend sans écran, ou un
   écran sans route, comptent comme ⚠️ PARTIEL.
4. **Ce que tu ne peux pas vérifier toi-même** (rendu visuel, comportement navigateur,
   temps réel) : dis-le explicitement et donne le protocole de test manuel exact.
5. Ne corrige rien. C'est un audit, pas une session de développement.

---

## A — Instructions générales (chapitre III)

- [ ] Aucune erreur / warning / notice **côté serveur** : lance le back, exerce les routes,
      lis `docker compose logs backend`
- [ ] Aucune erreur / warning **côté client** : cherche les `console.*` et vérifie qu'aucun
      warning React n'est produit (clés manquantes dans les `.map`, dépendances de hooks,
      `<StrictMode>` qui révèle des effets impurs)
- [ ] **Micro-framework respecté** : Express OK, mais **aucun ORM, aucun validateur
      automatique de schéma DB, aucun gestionnaire de comptes tout fait**. Vérifie
      `src/backend/package.json` dépendance par dépendance et signale tout ce qui
      ressemble à un ORM (Prisma, TypeORM, Sequelize, Drizzle…)
- [ ] **Requêtes SQL écrites à la main** — confirme qu'il n'y a pas de couche d'abstraction
      qui génère le SQL
- [ ] **Base ≥ 500 profils distincts** :
      `SELECT count(*) FROM users;` et `SELECT count(*) FROM profiles;`
- [ ] Mise en page : **header + main + footer** présents (`AppLayout.tsx`)
- [ ] **Responsive** : vérifie les breakpoints Tailwind, signale tout `w-[…px]` figé ou
      toute grille sans `max-w-*` qui s'étale à l'infini en plein écran
- [ ] Compatible Firefox + Chrome : signale toute API JS/CSS non standard

### Sécurité — toute faille = 0 au projet

- [ ] **Mots de passe hachés** (argon2/bcrypt), jamais en clair. Vérifie aussi qu'aucun
      log n'affiche un mot de passe
- [ ] **Injection SQL** : vérifie que TOUTES les requêtes sont paramétrées. Cherche
      spécifiquement les concaténations de chaînes et les `${}` dans du SQL construit
      manuellement (attention : les *tagged templates* de la lib `postgres` sont sûrs,
      pas les `sql.unsafe()` ni les chaînes assemblées)
- [ ] **XSS** : cherche `dangerouslySetInnerHTML`, `innerHTML`, `eval`. Vérifie que la bio,
      le username et les tags sont échappés à l'affichage
- [ ] **Upload de fichiers** : type MIME vérifié côté serveur (pas seulement l'extension),
      taille limitée, nom de fichier régénéré, pas d'exécution possible depuis `uploads/`
- [ ] **Validation de TOUS les formulaires**, côté client **et** côté serveur. Le serveur ne
      doit jamais faire confiance au client
- [ ] **`.env` non versionné** : `git check-ignore -v .env` et
      `git log --all --full-history -- .env` (aucun secret n'a jamais été commité)
- [ ] Cherche des secrets en dur dans le code : clés, mots de passe, tokens
- [ ] Contrôle d'accès : une route protégée est-elle réellement protégée ? Peut-on lire
      le profil d'autrui via l'API sans être connecté ? Peut-on modifier le profil d'un
      autre utilisateur en changeant un id ?
- [ ] Cookies de session : `httpOnly`, `secure`, `sameSite`

---

## B — IV.1 Inscription et connexion

- [ ] Inscription avec **e-mail, username, nom, prénom, mot de passe**
- [ ] **Les mots anglais courants sont refusés** comme mot de passe
- [ ] E-mail de vérification avec **lien unique** envoyé après inscription
- [ ] Le compte non vérifié ne peut pas se connecter
- [ ] Connexion par **username + mot de passe**
- [ ] Demande de réinitialisation de mot de passe par e-mail
- [ ] **Déconnexion en un clic depuis n'importe quelle page**
- [ ] Le jeton de vérification et celui de reset sont à usage unique et expirent

---

## C — IV.2 Profil utilisateur

- [ ] Genre · préférences sexuelles · biographie
- [ ] **Tags réutilisables** (table dédiée, pas du texte libre dupliqué)
- [ ] **Jusqu'à 5 photos**, dont **une désignée comme photo de profil** — la limite est-elle
      appliquée côté serveur ?
- [ ] Modification de toutes ces infos à tout moment, **+ nom, prénom, e-mail**
- [ ] **Voir qui a consulté son profil** (historique de visites)
- [ ] **Voir qui l'a liké**
- [ ] **Note de popularité publique**, avec des critères cohérents — explique la formule
      trouvée dans le code et juge sa cohérence
- [ ] **Géolocalisation GPS avec consentement explicite**
- [ ] **Repli manuel** si l'utilisateur refuse le GPS (ville/quartier saisis à la main)
- [ ] Modification de la localisation à tout moment

---

## D — IV.3 Navigation (suggestions)

- [ ] Liste de profils suggérés accessible facilement
- [ ] **Filtrage par orientation** : une femme hétéro ne voit que des hommes.
      **La bisexualité est gérée.** **Orientation non renseignée = bisexuel par défaut**
- [ ] Tri intelligent combinant **proximité géographique + tags communs + popularité**
- [ ] **Priorité à la même zone géographique**
- [ ] **Triable** par âge, localisation, popularité, tags communs
- [ ] **Filtrable** par âge, localisation, popularité, tags communs
- [ ] Les profils bloqués n'apparaissent pas

---

## E — IV.4 Recherche

- [ ] Recherche par tranche d'âge, plage de popularité, localisation, tags
- [ ] Résultats **triables et filtrables** sur les 4 mêmes critères
- [ ] Combinaison de plusieurs critères simultanément

---

## F — IV.5 Consultation de profil

- [ ] Affiche **toutes** les infos **sauf e-mail et mot de passe** — vérifie que l'API ne
      fuite pas l'e-mail dans le DTO public
- [ ] La consultation est **enregistrée dans l'historique de visites**
- [ ] Like de la photo de profil
- [ ] **Impossible de liker si on n'a pas soi-même de photo de profil**
- [ ] Like mutuel → « connectés » → chat débloqué
- [ ] **Unlike** → coupe les notifications ET désactive le chat
- [ ] Note de popularité de l'autre visible
- [ ] **Statut en ligne**, et **date/heure de dernière connexion** sinon
- [ ] Signaler comme faux compte
- [ ] **Bloquer** : disparaît des résultats, plus de notifications, chat impossible
- [ ] L'utilisateur voit clairement s'il est liké et s'il est connecté

---

## G — IV.6 Chat

- [ ] Chat **uniquement entre utilisateurs connectés** (like mutuel)
- [ ] **Temps réel, délai max 10 secondes**
- [ ] **Depuis n'importe quelle page**, on voit qu'un nouveau message est arrivé
- [ ] L'historique des messages est persistant
- [ ] Un utilisateur bloqué ou unliké ne peut plus écrire

---

## H — IV.7 Notifications

Les **5** événements sont-ils tous notifiés, en temps réel (≤ 10 s) ?

- [ ] Reçoit un like
- [ ] Son profil a été consulté
- [ ] Reçoit un message
- [ ] Un utilisateur qu'il a liké le like en retour
- [ ] Un utilisateur connecté le unlike
- [ ] **Depuis n'importe quelle page**, le compteur de notifications non lues est visible

---

## I — Hygiène du dépôt

- [ ] `docker compose exec -T frontend pnpm typecheck` → silencieux
- [ ] `docker compose exec -T backend pnpm typecheck` → silencieux
- [ ] `docker compose exec -T backend sh -c 'cd /app && pnpm lint'` → silencieux
- [ ] `git status` propre, rien d'oublié
- [ ] Aucun fichier parasite versionné (`package-lock.json` dans un projet pnpm,
      `node_modules`, `dist`, `uploads`, certificats)
- [ ] `docker compose down && docker compose up` repart d'un état sain
- [ ] Le README explique comment lancer le projet

---

## Livrable attendu

1. **Un tableau de synthèse par section** (A → I) : exigence | verdict | preuve (`fichier:ligne`
   ou commande + sortie)
2. **La liste des ❌ MANQUANT**, triée par gravité, avec pour chacun l'endroit exact où
   intervenir
3. **La liste des ⚠️ PARTIEL**, avec ce qu'il manque précisément
4. **Une section « failles de sécurité »** à part — c'est le seul point qui vaut 0 au projet
5. **La liste de ce que tu n'as pas pu vérifier**, avec le protocole de test manuel
6. Un verdict final : **prêt / pas prêt** pour la soutenance, et pourquoi

Ne propose aucun correctif de code. Décris seulement ce qui manque et où.
