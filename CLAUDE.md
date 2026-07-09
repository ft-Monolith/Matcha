# CLAUDE.md — Matcha (42, sujet Web v6.0)

## 1. Projet & objectif

App de rencontre full-stack : inscription → profil → suggestions/recherche → like → match → chat + notifications temps réel.
Évaluation par les pairs, sujet `fr.subject.pdf` à la racine. **Toute faille de sécurité = note 0.**
Cible : partie obligatoire (IV.1 → IV.7) parfaite AVANT tout bonus.

## 2. ⛔ RÈGLES NON NÉGOCIABLES (violation = échec / 0)

- **Aucune faille de sécurité** : SQLi, XSS (injection HTML/JS dans variables non protégées), upload non autorisé, mot de passe en clair → **note 0 immédiate**.
- **Zéro error / warning / notice**, côté serveur ET console navigateur. Vérifier la console à chaque feature.
- **SQL écrit à la main + paramétré** (`$1, $2`…). **INTERDIT : TypeORM, Prisma, Sequelize, Knex, tout ORM/query builder.**
  NestJS est toléré UNIQUEMENT si on n'utilise aucun ORM, validateur ou module d'auth « magique » bundlé (pas de `@nestjs/typeorm`, pas de `class-validator` comme seule défense, pas de Passport clé en main non maîtrisé). Le sujet définit « micro-framework » = routeur + templating éventuel, SANS ORM/validateurs/gestionnaire de comptes — cette définition **fait autorité en soutenance**.
- **Mots de passe hashés** (argon2 recommandé, sinon bcrypt). Refuser les mots anglais courants comme mot de passe (check contre une wordlist).
- **`.env` + secrets/clés JAMAIS commités** (`.gitignore`). Fournir un `.env.example` sans valeurs sensibles.
- **DB peuplée avec ≥ 500 profils distincts** (script de seed obligatoire, rejouable).
- **Tout ce qui n'est pas explicitement autorisé par le sujet est interdit.** En cas de doute → relire le sujet, pas d'initiative.
- Compatible **dernières versions Firefox & Chrome**.
- Layout **header / main / footer** + **responsive mobile** sur toutes les pages.
- Validation de TOUS les formulaires et de TOUS les uploads.

## 3. Stack & bonnes pratiques par techno

### Backend — Node.js + TypeScript + NestJS (sans ORM)
- NestJS pour la structure (modules, controllers, services, guards, gateways) — rien de plus.
- Accès DB : **`pg` (node-postgres) avec un `Pool` unique** injecté via un provider Nest. Requêtes 100 % manuelles.
- ✅ `pool.query('SELECT … WHERE id = $1', [id])` — ❌ interpolation de chaînes, ❌ `sql = "..." + input`.
- Validation : à la main (fonctions/pipes maison), pas de lib « magique » de validation d'entités.
- Auth : **sessions + cookies** (pas de JWT). Cookie `httpOnly` + `secure` + `sameSite=lax|strict`. Store de session en DB ou Redis — pas en mémoire en prod.
- Erreurs : exception filters propres → jamais de stack trace ni de warning en sortie.

### PostgreSQL
- Migrations = fichiers `.sql` versionnés, appliqués dans l'ordre (script maison ou runner minimal sans ORM).
- Contraintes en DB (UNIQUE, FK, CHECK) = première ligne de défense, pas seulement du code applicatif.
- `EXPLAIN` sur les requêtes de suggestion/recherche ; index sur toutes les colonnes filtrées (voir §5).

### Frontend — React + TypeScript + Tailwind + shadcn (SPA)
- Hooks propres : dépendances d'effets exhaustives, cleanup des listeners/sockets dans le `return` du `useEffect`.
- État serveur ≠ état UI : centraliser les fetchs (hooks dédiés), pas de `useEffect` en cascade.
- **Jamais** `dangerouslySetInnerHTML` avec du contenu utilisateur. React échappe par défaut : ne pas contourner.
- shadcn : composants copiés dans `src/components/ui/`, personnalisation via Tailwind ; pas de CSS ad hoc dispersé.
- Zéro warning console : clés de listes, props inconnues, effets doublés (StrictMode) — tout doit être propre.

### socket.io (temps réel)
- **Authentifier la connexion WS via la session** (middleware socket.io qui lit le cookie de session) — jamais de socket anonyme qui reçoit des événements privés.
- Une room par user (`user:{id}`) → notifications ciblées ; une room par match pour le chat.
- Vérifier côté serveur, à CHAQUE événement : match actif, pas de block, droits sur la ressource. Ne jamais faire confiance au client.
- Suivre online/offline : connexion/déconnexion socket → `is_online` + `last_seen_at`.

### Nginx (Docker)
- Reverse proxy unique en frontal : `/` → frontend, `/api` → backend, `/socket.io` → backend avec headers `Upgrade`/`Connection` (WebSocket).
- Sert les photos uploadées en statique (`/uploads`) — le backend ne stream pas les images.
- `client_max_body_size` cohérent avec la taille max d'upload.

## 4. Architecture & arborescence

```
Matcha/
├── frontend/            # React SPA (Vite + TS + Tailwind + shadcn)
├── backend/             # NestJS + pg (src/modules/{auth,users,profile,browse,chat,notifications}/)
│   └── src/database/    # provider Pool pg, migrations/*.sql, seed/
├── nginx/               # nginx.conf (reverse proxy)
├── docker-compose.yml   # nginx + frontend + backend + postgres + mailpit (+ volumes)
├── .env.example         # modèle sans secrets
└── CLAUDE.md
```

- **Flux d'une requête** : navigateur → Nginx (:80/:443) → `/api/*` vers NestJS → `pg.Pool` → PostgreSQL. La SPA est servie par Nginx.
- **WebSockets** : gateway socket.io dans le backend NestJS (namespace unique), proxifiée par Nginx sur `/socket.io`.
- **Photos uploadées** : volume Docker partagé backend (écriture) ↔ Nginx (lecture seule), monté sur `/uploads`. Jamais dans le repo Git.
- Host = Node v12 (trop vieux) → **tout tourne dans Docker**, y compris le dev (bind mounts + hot reload).

### Contrat d'API (design d'équipe — sessions, pas de JWT)

| Groupe | Endpoints |
|---|---|
| Auth | `POST /register` (email, username, last_name, first_name, password) · `POST /login` (username, password) · `POST /verify-account` (token) · `POST /resend-verification` (email) · `POST /forgot-password` (email) · `POST /reset-password` (token + new password) · `POST /logout` |
| User | `GET /account` (tout mon profil + qui m'a visité + qui m'a liké) · `PUT /account` (compléter/éditer : gender, sexual_pref, bio, tags…) · `POST /photos` (upload) · `PUT /photos/order` (liste d'ids) · `DELETE /photos/:id` · `PUT /location` (lat/lng OU city — saisie manuelle) · `PUT /geoloc-consent` · `PUT /password` (old + new) |
| Match | `GET /browse` (suggestions paginées, tri/filtres en **query params**) · `GET /profiles/:username` (tout sauf email/mdp, enregistre la visite) · `POST /like` (username, toggle like/unlike) · `POST /block` (toggle) · `POST /report` (username) · `GET /liked` · `GET /matched` · `GET /search` (critères en **query params**) |
| Chat/Notif | `GET /chats` (liste + dernier msg + non-lus) · `GET /chats/:id/messages` (paginé) · `PUT /messages/read` · `GET /notifications` · `PUT /notifications/read` |
| WS | client → serveur : `send_message` · serveur → client : `new_message`, `new_notification` |

⚠️ Corrections vs le brouillon d'équipe :
- **Pas de body sur les GET** (`search`, `browse`) → tout en query params (`?ageMin=…&tags=…&sort=…`). Un GET avec body n'est pas envoyé par fetch/axios.
- **`logout` sans token dans le body** : auth par session/cookie → le serveur détruit la session, c'est tout.
- Chaque endpoint mutateur revérifie côté serveur : session valide, `account_complete`, photo de profil pour liker, pas de block, ressource possédée.

## 5. Base de données (schéma cible)

Schéma = celui du brouillon d'équipe (noms de colonnes conservés), + contraintes ajoutées ci-dessous.

| Table | Colonnes (brouillon équipe) | Contraintes |
|---|---|---|
| `users` | id PK, email, username, last_name, first_name, password_hash, birth_date, gender, sexual_pref (défaut `bisexual`), bio, popularity int (défaut 0), latitude/longitude nullable, city nullable, gps_consent bool, email_verified bool (défaut false), last_connection, is_online bool, account_complete bool, created_at | UNIQUE(username) **et UNIQUE(email)** ⚠️ manquait sur le brouillon |
| `photos` | id PK, user_id FK, url, is_profile_pic bool, position int (1–5), created_at | CHECK(position BETWEEN 1 AND 5) ; index partiel UNIQUE `(user_id) WHERE is_profile_pic` ; max 5/user (check applicatif) |
| `tags` | id PK, name (normalisé lowercase) | UNIQUE(name) |
| `user_tags` | user_id FK, tag_id FK | UNIQUE(user_id, tag_id) |
| `likes` | id PK, user_id FK (liker), liked_id FK, created_at | UNIQUE(user_id, liked_id), **+ CHECK(user_id <> liked_id)** |
| `visits` | id PK, visitor_id FK, visited_id FK, created_at | pas d'UNIQUE (multi-visites), **+ CHECK(visitor_id <> visited_id)** |
| `blocks` | id PK, blocker_id FK, blocked_id FK, created_at | UNIQUE(blocker_id, blocked_id) |
| `reports` | id PK, reporter_id FK, reported_id FK, reason nullable, created_at | **+ UNIQUE(reporter_id, reported_id)** (pas de spam de reports) |
| `messages` | id PK, sender_id FK, receiver_id FK, content, is_read bool (défaut false), created_at | index (sender_id, receiver_id, created_at) |
| `notifications` | id PK, user_id FK (destinataire), from_user_id FK (source), type (`like`\|`visit`\|`message`\|`match`\|`unlike`), is_read bool (défaut false), created_at | index (user_id, is_read) |
| `tokens` | id PK, user_id FK, **token_hash** (⚠️ hashé, pas en clair comme sur le brouillon), type (`email_verify`\|`password_reset`), expires_at, created_at | UNIQUE(token_hash) |

Règles :
- Migrations SQL versionnées (`001_init.sql`, `002_…`), rejouables sur DB vierge.
- **Seed ≥ 500 profils distincts** : noms, genres, orientations, bios, tags, photos, localisations et popularity variés (données crédibles pour la démo de matching).
- Index sur toutes les colonnes filtrées : `(latitude, longitude)` ou géo-index, `city`, `popularity`, `birth_date`, `user_tags(tag_id)`, `likes(liked_id)`, `visits(visited_id)`.
- Un « match/connecté » = deux lignes réciproques dans `likes` — pas de table dédiée, mais requête canonique réutilisée partout.
- `account_complete` : à passer à `true` quand profil complet (genre, bio, tags, localisation, ≥ 1 photo) ; **gate le browse/like** tant que false.

## 6. ✅ CHECKLIST FONCTIONNELLE OBLIGATOIRE (IV.1 → IV.7)

### IV.1 Inscription & connexion
- [ ] Inscription : email + username + nom + prénom + mot de passe sécurisé.
- [ ] Mots de passe = mots anglais courants **refusés**.
- [ ] Email de vérification avec **lien unique** (compte inactif avant clic).
- [ ] Login par **username + mot de passe**.
- [ ] Reset du mot de passe par email.
- [ ] **Logout en 1 clic depuis n'importe quelle page**.

### IV.2 Profil
- [ ] Renseigner : genre, préférences sexuelles, bio, **tags réutilisables** (#geek…).
- [ ] Jusqu'à **5 photos dont 1 photo de profil**.
- [ ] Tout modifiable à tout moment, **y compris nom, prénom, email**.
- [ ] Voir **qui a visité mon profil** et **qui m'a liké**.
- [ ] **Note de popularité publique** (définition à documenter, critères cohérents — voir §11).
- [ ] Géoloc GPS jusqu'au quartier **avec consentement explicite** ; si refus → **saisie manuelle OBLIGATOIRE** (ville/quartier), sinon le matching ne fonctionne pas. Modifiable à tout moment (RGPD).

### IV.3 Navigation / suggestions
- [ ] Ne montrer que des profils **compatibles avec l'orientation** (hétéro, homo, bi des deux côtés).
- [ ] **Orientation non renseignée = bisexuel par défaut**.
- [ ] Matching « intelligent » : proximité géo + max de tags communs + note de popularité.
- [ ] **Priorité aux profils de la même zone géographique**.
- [ ] Liste **triable** ET **filtrable** par : âge, localisation, popularité, tags communs.

### IV.4 Recherche avancée
- [ ] Critères multiples : tranche d'âge, plage de popularité, localisation, 1+ tags.
- [ ] Résultats **triables et filtrables** (mêmes 4 axes que IV.3).

### IV.5 Consultation de profil
- [ ] Afficher toutes les infos **SAUF email et mot de passe**.
- [ ] **Enregistrer la visite** dans l'historique du visité.
- [ ] Like de la photo de profil → like réciproque = « connectés » → chat.
- [ ] ⚠️ **Impossible de liker si je n'ai pas moi-même de photo de profil**.
- [ ] **Unlike** : coupe les notifications futures + **désactive le chat**.
- [ ] Voir la note de popularité de l'autre.
- [ ] Voir **en ligne / dernière connexion (date + heure)**.
- [ ] **Signaler** comme faux compte.
- [ ] **Bloquer** : disparaît des recherches/suggestions, plus aucune notification, chat impossible.
- [ ] Afficher clairement : « il m'a liké » / « nous sommes connectés » ; pouvoir unliker depuis là.

### IV.6 Chat
- [ ] Temps réel (**délai max 10 s**) entre users **connectés** (like mutuel) uniquement.
- [ ] Nouveau message **visible depuis n'importe quelle page**.

### IV.7 Notifications (temps réel, délai max 10 s)
- [ ] Reçu un like.
- [ ] Profil consulté.
- [ ] Message reçu.
- [ ] Like en retour d'un profil que j'ai liké (match).
- [ ] Un « connecté » me unlike.
- [ ] Badge **non-lu visible depuis n'importe quelle page**.

## 7. Sécurité (checklist détaillée)

- [ ] Hash argon2/bcrypt + politique de mot de passe (longueur, pas de mots anglais courants).
- [ ] **Validation stricte serveur** de TOUS les formulaires (type, longueur, format, whitelist) — la validation client n'est que du confort.
- [ ] Uploads : vérifier **MIME réel (magic bytes), extension, taille max** ; re-nommer le fichier (UUID) ; jamais de chemin fourni par le client ; images uniquement.
- [ ] Anti-XSS : échappement systématique (React par défaut + jamais de HTML brut depuis l'utilisateur) ; bio, messages, tags = texte pur.
- [ ] Anti-SQLi : 100 % requêtes paramétrées, zéro concaténation.
- [ ] CSRF : `sameSite` sur le cookie de session + token CSRF sur les mutations si nécessaire.
- [ ] **Rate-limiting** sur login, register, reset password, resend verification.
- [ ] Tokens (vérif email, reset) : aléatoires (crypto), **hashés en DB**, à expiration, usage unique (table `tokens`).
- [ ] Autorisation **par ressource** : un user ne modifie que SES données ; vérifier match/block côté serveur pour chat, like, visite.
- [ ] Pas d'infos sensibles dans les réponses API (jamais `password_hash`, jamais l'email d'autrui).
- [ ] Headers : pas de stack traces, erreurs génériques côté client.

## 8. Conventions

- Nommage : `camelCase` TS, `snake_case` SQL/DB, composants React en `PascalCase`, fichiers backend `kebab-case` (convention Nest).
- Commits : Conventional Commits (`feat:`, `fix:`, `chore:`, `db:`…), messages courts en anglais.
- Branches : `main` stable ; une branche par feature (`feat/chat`, `feat/browse`).
- **Aucun secret commité, jamais** — relire le diff avant chaque commit.
- Lint + format obligatoires avant commit (ESLint + Prettier front et back) ; zéro warning toléré.

## 9. Commandes utiles

Docker 29.3.0 **rootless** (ports < 1024 impossibles → site sur **http://localhost:8080**), Compose v5.1.1 (`docker compose`, pas `docker-compose`), Node hôte v12.22.9 → **trop vieux, tout passe par Docker**.
Images : `node:22-alpine`, `postgres:17-alpine`, `nginx:1.28-alpine`, `axllent/mailpit` (UI mails : http://localhost:8025).

```bash
docker compose up --build -d      # tout lancer (nginx, front, back, postgres, mailpit)
docker compose down               # tout arrêter (-v pour purger les volumes/DB)
docker compose logs -f backend    # logs d'un service
docker compose exec postgres psql -U matcha -d matcha    # console SQL
docker compose exec backend npm run migrate      # ⏳ jalon 2 (à implémenter)
docker compose exec backend npm run seed         # ⏳ jalon 2 : peupler ≥ 500 profils
docker compose exec backend npm run lint         # ⏳ jalon 2 (ESLint + Prettier)
docker compose exec frontend npm run lint        # ⏳ jalon 2
```

Dev front/back : bind mounts + hot reload actifs (Vite HMR / `nest start --watch`) — ne jamais lancer `npm run dev` sur l'hôte.
`node_modules` n'existe que dans les containers : pour l'IntelliSense de l'IDE, `docker run --rm -v "$PWD/backend:/app" -w /app node:22-alpine npm ci` (idem `frontend/`).

## 10. Definition of Done (par feature)

Une feature n'est « faite » que si TOUT est vrai :
1. Implémentée ET validée **end-to-end à la main** dans le navigateur (pas seulement le code écrit).
2. **Zéro error/warning/notice** : console navigateur + logs backend propres.
3. Sécurisée : entrées validées serveur, requêtes paramétrées, autorisations vérifiées.
4. **Responsive** (mobile testé) + layout header/main/footer intact.
5. Cases correspondantes cochées dans la checklist §6.

## 11. Décisions d'équipe (actées) & points restants

### ✅ Acté par l'équipe (cf. notes/screens) — ne pas re-débattre
- **Backend NestJS** — assumé, avec argumentaire de soutenance à tenir :
  - Le sujet interdit ORM / validateurs / gestionnaire de comptes **bundlés** ; il autorise « toutes les bibliothèques nécessaires ». NestJS core = routage + structure (DI), rien de plus n'est installé.
  - Preuves à montrer au correcteur : `package.json` **sans** `@nestjs/typeorm`, `class-validator`, `class-transformer`, `@nestjs/passport` ; SQL 100 % manuel dans `queries.ts` par module ; validation et sessions écrites à la main.
  - **Ban list de dépendances** (à faire respecter dans chaque PR) : tout ORM/query builder, class-validator, Passport, tout module d'auth clé en main.
- **socket.io sans broker** — backend mono-process, pas de Redis. Sessions stockées en DB (table `sessions`), jamais en MemoryStore (warning au boot = éliminatoire).
- **Photos sur volume Docker partagé** (backend écrit, nginx sert `/uploads` en lecture seule).

### ⏳ Encore à trancher
- [ ] **Définition exacte de la « note de popularité »** (`users.popularity`) : proposer p. ex. `likes reçus pondérés + visites + ratio matchs`, à figer et documenter — le sujet exige des critères cohérents et la note est publique.

## ⚠️ Bonus

Le bonus n'est évalué **QUE si l'obligatoire est PARFAIT** (implémenté à 100 %, zéro dysfonctionnement).
**Ne lister ni commencer AUCUN bonus** (OmniAuth, galerie drag-and-drop, carte interactive, chat vidéo/audio, planification de rendez-vous) tant que la checklist §6 n'est pas 100 % cochée et validée.
