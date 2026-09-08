FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @secure-browser/backend --docker

FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @secure-browser/backend exec prisma generate
RUN pnpm turbo run build --filter=@secure-browser/backend...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache docker-cli

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/apps/backend/dist ./apps/backend/dist
COPY --from=installer /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=installer /app/apps/backend/package.json ./apps/backend/package.json

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./apps/backend/prisma/schema.prisma && node apps/backend/dist/index.js"]
