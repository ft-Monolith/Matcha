FROM node:22-alpine AS dev

# pnpm etc...
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY src/backend/package.json ./src/backend/package.json
COPY src/frontend/package.json ./src/frontend/package.json

RUN pnpm install

CMD ["pnpm", "dev"]
