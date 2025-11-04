# Multi-stage build for Angular Frontend
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Skip Husky in Docker
ENV HUSKY=0

# Copy all workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/frontend ./apps/frontend

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# Build application for production
WORKDIR /app/apps/frontend
RUN pnpm run build

# ============================================
# Production Stage with nginx
# ============================================
FROM nginx:alpine AS production

# Copy custom nginx config
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/apps/frontend/dist/apps/frontend/browser /usr/share/nginx/html

# Environment variables
ENV NODE_ENV=production

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
