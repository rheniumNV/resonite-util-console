ARG NODE_VERSION=22

# ---- deps: all dependencies (including dev) for the build ----
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: build the Next.js app ----
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx next build \
 && rm -rf .next/cache

# ---- prod-deps: runtime dependencies only ----
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
# The SWC compiler binaries are only used at build time, and sharp is only
# used by next/image, which this app does not use.
RUN npm ci --omit=dev \
 && rm -rf node_modules/@next/swc-* node_modules/@img

# ---- runner: minimal runtime image ----
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Package managers are not needed at runtime.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
    /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

# Application files stay root-owned (read-only for the app user); only .next
# is writable because Next.js writes its runtime cache there.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY package.json server.js ./
COPY --from=builder --chown=node:node /app/.next ./.next

USER node
EXPOSE 3000
CMD ["node", "server.js"]
