# Matcha

Site de rencontre (projet 42). Monorepo **pnpm** : back **Express** dans `src/backend`,
front **Vite + React** dans `src/frontend`, contrat partagé dans `src/common`.
Tout tourne en Docker.

> **Pourquoi Express et pas NestJS** : le sujet définit le framework autorisé comme
> « un routeur + éventuellement du templating, **sans ORM, sans validateurs, sans
> gestionnaire de comptes** » — définition qui **fait autorité à la soutenance**.
> Corollaire : **aucun ORM**, toutes les requêtes SQL sont écrites à la main.

## Démarrage

```bash
cp .env.example .env          # secrets locaux — jamais commités
docker compose up -d --build  # nginx, frontend, backend, postgres, mailpit
```

| Service | URL |
|---|---|
| App | http://localhost:8080 |
| Santé API | http://localhost:8080/api/health |
| Mailpit (fausse boîte mail) | http://localhost:8025 |

Le fonctionnement détaillé du setup Docker est expliqué dans [docs/docker.md](docs/docker.md).

## Structure

```
/                       racine du workspace pnpm (pas une app)
  package.json          scripts d'orchestration + outillage repo (eslint)
  pnpm-workspace.yaml   packages : src/backend, src/frontend
  eslint.config.js      un seul lint pour tout le repo
  docker/Dockerfile     image dev unique, partagée front & back
  nginx/nginx.conf      le portier (:8080)
  docker-compose.yml

  src/
    common/             PARTAGÉ front↔back — PAS un package npm (voir ci-dessous)
      dto/  type/  routes/  constant/
    backend/            API Express (package "backend")
      src/main.ts       composition root
      tsconfig.json
    frontend/           SPA React (package "frontend")
      index.html  main.tsx  index.css
      vite.config.ts  tsconfig.json
      Web/  shadcn/
```

### `src/common` n'est pas un package — c'est un **alias**

Seuls `src/backend` et `src/frontend` sont des packages pnpm. `src/common` est du code TS
partagé, résolu par **alias** — donc **zéro build intermédiaire** à maintenir.

L'alias est déclaré à **3 endroits** qui doivent rester synchronisés :

| Fichier | Rôle |
|---|---|
| `src/backend/tsconfig.json` | `paths: { "@common/*": ["../common/*"] }` |
| `src/frontend/tsconfig.json` | idem (+ `@web`, `@shadcn`) |
| `src/frontend/vite.config.ts` | `resolve.alias` — **c'est lui qui résout vraiment** au runtime/build ; TS ne sert qu'au typecheck |

Dans Docker, `src/common` est visible des deux containers parce que le bind mount monte
**tout le monorepo** (`.:/app`).

## Stack (versions **figées**, pas de `^`)

| Back | Front |
|---|---|
| Express **5.2.1** · postgres.js **3.4.9** | React **19.2.7** · Vite **8.1.4** |
| class-validator · helmet · cors · multer | Tailwind **4.3.2** · react-router-dom **7** |
| tsx · vitest | Legend-State **2.1.15** · zod **4** |

`.npmrc` contient `save-exact=true` → tout `pnpm add` futur écrira une version **exacte**.
La version de pnpm est épinglée par `packageManager` dans le `package.json` racine.

### ⚠️ Deux pièges de version à connaître

- **Express 5** : les rejets de promesse sont **catchés nativement** → **pas besoin d'un
  `asyncHandler`**. Écris `router.get("/", async (req, res) => …)`, une erreur part toute
  seule dans le middleware d'erreurs. Attention aussi aux routes (path-to-regexp v8) :
  `*` seul est interdit (utilise `/*splat`), et `:param?` optionnel n'existe plus.
- **Tailwind 4** : **il n'y a pas de `tailwind.config.ts`**. La config vit dans le CSS
  (`@import "tailwindcss";` + bloc `@theme`), et le plugin `@tailwindcss/vite` remplace
  PostCSS + autoprefixer.

## Commandes

```bash
# depuis la racine — le workspace s'occupe des deux packages
pnpm install                  # installe backend + frontend en une passe
pnpm typecheck                # -r → typecheck des deux packages
pnpm lint                     # 0 erreur ET 0 warning (exigence du sujet)
pnpm -r test

# cibler un package précis
pnpm --filter backend add express
pnpm --filter frontend add react

# docker
docker compose logs -f backend
docker compose exec backend sh
docker compose down           # -v pour purger aussi la DB
```

### Si `pnpm install` râle sur les build-scripts

pnpm refuse d'exécuter les `postinstall` non approuvés (sécurité supply-chain) :

```bash
pnpm approve-builds --all     # écrit `allowBuilds` dans pnpm-workspace.yaml
```

### IntelliSense dans l'éditeur

`node_modules` vit dans les containers. Pour que VSCode arrête d'afficher
`Cannot find module`, installe les deps localement une fois :

```bash
corepack enable && pnpm install
```

## Contraintes du sujet à ne jamais perdre de vue

- **Aucun ORM** — SQL écrit à la main, **toujours paramétré** (anti-injection).
- **Mots de passe jamais en clair** en base.
- **0 erreur / 0 warning**, côté serveur comme dans la console du navigateur.
- Layout **header + main + footer**, responsive mobile.
- **≥ 500 profils** en base pour l'évaluation.
- Les secrets restent dans `.env` (git-ignoré) — un secret commité = projet à 0.
