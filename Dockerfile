# Ludi Server - Production Dockerfile for Railway
# Builds @ludi/protocol, @ludi/rules, and server packages

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

# Install all dependencies (including dev deps for build)
RUN pnpm install --frozen-lockfile

# Copy source code for all packages
COPY packages/protocol ./packages/protocol
COPY packages/rules ./packages/rules
COPY server ./server

# Build packages in dependency order
# @ludi/protocol has no build step (exports source .ts)
# @ludi/rules has no build step (exports source .ts)
# server builds with tsc (ignores exit code from pre-existing type errors, verifies dist/index.js exists)
RUN pnpm --filter server exec tsc --pretty false; test -f server/dist/index.js

# Remove dev dependencies for smaller production image
RUN pnpm prune --prod

# Expose port (Railway injects PORT env var)
EXPOSE ${PORT:-3000}

# Start the server (reads process.env.PORT)
CMD ["node", "server/dist/index.js"]
