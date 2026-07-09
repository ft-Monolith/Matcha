# Matcha — où on en est

App de rencontre (sujet 42 Web v6.0). **Jalon 1 fait : toute l'infra tourne.**
Réf complète : [CLAUDE.md](CLAUDE.md) (règles sujet, schéma DB, contrat API). Sujet : `fr.subject.pdf`.

## Démarrer (tout est dockerisé, rien à installer)

```bash
cp .env.example .env      # 1re fois seulement — demande-moi les valeurs
docker compose up -d --build
```

| URL | Quoi |
|---|---|
| http://localhost:8080 | le site (si "API + DB ✓" s'affiche, tout marche) |
| http://localhost:8025 | Mailpit — boîte mail de dev (voir plus bas) |

⚠️ Jamais de `npm run dev` sur ta machine : tout tourne dans Docker (hot reload déjà actif des deux côtés — édite un fichier dans `src/`, c'est tout).

## Stack (choix actés, on ne re-débat pas)

| Techno | Pourquoi |
|---|---|
| React + TS + Tailwind (SPA) | frontend, servi via nginx |
| NestJS + TS | backend — **sans** ORM/validateur/auth bundlés (règle sujet) |
| PostgreSQL + `pg` | **SQL écrit à la main, paramétré (`$1,$2`) — AUCUN ORM, jamais** |
| Sessions + cookies httpOnly | auth — **pas de JWT** |
| socket.io | chat + notifs temps réel (pas encore branché) |
| nginx | point d'entrée unique : `/` front, `/api` back, `/socket.io` WS |
| Mailpit | faux serveur mail de dev : capte les mails envoyés par l'app et les affiche sur :8025 — indispensable pour tester vérif email + reset mdp sans vrai SMTP |

## Les règles qui donnent 0 (résumé)

- Toute faille (SQLi, XSS, upload non validé, mdp en clair) = **note 0**
- **Zéro** error/warning en console navigateur ET logs serveur
- `.env` jamais commité (le `.gitignore` le bloque déjà)
- Mots de passe hashés + refuser les mots anglais courants

## Qui fait quoi

- Backend DB : `backend/src/database/database.service.ts` = seul point d'accès (SQL manuel)
- Nouveau module backend : dossier dans `backend/src/modules/` (voir `health/` comme modèle)
- Pages front : `frontend/src/` (Tailwind, layout header/main/footer obligatoire)

## Pour ta page d'inscription (IV.1)

Endpoints prévus (contrat complet dans CLAUDE.md §4) :
`POST /api/register` (email, username, first_name, last_name, password) → mail de vérif avec lien unique · `POST /api/verify-account` · `POST /api/login` (username + mdp) · `POST /api/forgot-password` / `reset-password` · `POST /api/logout` (1 clic, depuis toute page)

Pièges du sujet à ne pas rater :
- Compte inutilisable tant que l'email n'est pas vérifié (lien unique, expirant)
- Mdp "password", "monkey"… = refusés (check wordlist), hash argon2/bcrypt
- Validation **côté serveur** de tous les champs (le front ne suffit pas)
- Ton cycle de test : s'inscrire avec une adresse bidon → ouvrir localhost:8025 → cliquer le lien dans le mail capté par Mailpit

## Commandes utiles

```bash
docker compose ps                  # état des 5 services
docker compose logs -f backend     # logs live
docker compose exec postgres psql -U matcha -d matcha   # console SQL
docker compose down                # stop (down -v = purge la DB)
```

IntelliSense IDE (node_modules n'existe que dans Docker) :
`docker run --rm -v "$PWD/backend:/app" -w /app node:22-alpine npm ci` (idem `frontend/`)
