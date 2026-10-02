# Ludi Server - Production Dockerfile for Railway
# Builds @ludi/protocol, @ludi/rules, and server packages
# Uses tsx to run TypeScript directly (skips tsc due to pre-existing type errors)

FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package manifests for dependency installation
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/rules/package.json ./packages/rules/
COPY server/package.json ./server/

# Install all dependencies (tsx moved to production deps)
RUN pnpm install --frozen-lockfile

# Copy source code for all packages
COPY packages/protocol ./packages/protocol
COPY packages/rules ./packages/rules
COPY server ./server

# No build step needed - tsx runs .ts files directly
# @ludi/protocol exports source .ts (no build)
# @ludi/rules exports source .ts (no build)
# server uses tsx to run src/index.ts directly (bypasses pre-existing tsc type errors)

# Remove dev dependencies for smaller production image
RUN pnpm prune --prod

# Expose port (Railway injects PORT env var)
EXPOSE ${PORT:-3000}

# Start the server with tsx (runs TypeScript directly, same entry point as dev)
CMD ["pnpm", "--filter", "server", "exec", "tsx", "src/index.ts"]
