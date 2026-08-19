corepack enable pnpm
pnpm install
docker compose up -d
docker compose exec backend pnpm seed:profiles
