# ==============================================================================
# Dockerfile Multi-Stage Build — ToDjuanda Smart Airport Navigation System
# Target: Lingkungan Staging & Production Container Deployment
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Image dengan dependensi sistem Linux Alpine
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Instalasi Dependensi Node.js
# ------------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install seluruh dependensi dan generate Prisma Client Engine
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 3: Kompilasi & Build Aplikasi Next.js
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variabel build-time
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client dan kompilasi build Next.js (Webpack)
RUN npx prisma generate
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Production Runner (Keamanan Non-Root & Minimal Image Footprint)
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Hardening: Menjalankan container dengan user non-root khusus (UID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Menyalin aset publik dan hasil build Next.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma

# Memberikan hak akses kepemilikan kepada user non-root
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Healthcheck untuk monitoring status container
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]
