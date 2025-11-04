# Multi-stage build for NestJS Backend
FROM node:20-alpine AS builder

# Install pnpm and dependencies for Prisma
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache openssl

WORKDIR /app

# Skip Husky in Docker
ENV HUSKY=0

# Copy all necessary files for install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/backend ./apps/backend

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build application
RUN pnpm run build

# Build seed script separately
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --resolveJsonModule --module commonjs --target es2020 --skipLibCheck

# ============================================
# Production Stage
# ============================================
FROM node:20-alpine AS production

# Install pnpm and openssl (required for Prisma)
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache openssl

WORKDIR /app

# Skip Husky and postinstall in Docker
ENV HUSKY=0
ENV SKIP_POSTINSTALL=true

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma

# Install ALL dependencies (including Prisma CLI for migrations)
ENV SKIP_POSTINSTALL=
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Copy built application from builder
WORKDIR /app
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json

WORKDIR /app/apps/backend

# Environment variables
ENV NODE_ENV=production
ENV PORT_API=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with migrations and seeding (only if DB is empty)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js || true && node dist/main.js"]
