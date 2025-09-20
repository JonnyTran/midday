# Base image with Bun
FROM oven/bun:1.2.21 AS base

# Install turbo CLI globally using Bun
FROM base AS turbo-cli
RUN bun add -g turbo

# Builder stage
FROM turbo-cli AS builder
WORKDIR /app
# Copy all files
COPY . .
# Use turbo CLI from Bun global install to prune workspaces
RUN turbo prune @midday/dashboard --docker

# Installer stage
FROM builder AS installer
RUN apt-get update && apt-get install -y --no-install-recommends libexpat1 libvips-dev npm
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
# Don't copy the lockfile, allow Bun to generate a fresh one
RUN bun install

# Copy the full source code
COPY --from=builder /app/out/full/ .

ARG RESEND_API_KEY
ENV RESEND_API_KEY=$RESEND_API_KEY

# Build the dashboard and its dependencies
RUN turbo build --filter="@midday/dashboard..."

# Runner stage
FROM base AS runner
WORKDIR /app

# Copy the built application
COPY --from=installer /app/apps/dashboard/.next /app/.next
COPY --from=installer /app/apps/dashboard/public /app/public
COPY --from=installer /app/apps/dashboard/package.json /app/package.json
COPY --from=installer /app/node_modules /app/node_modules

# Set environment variables
ENV NODE_ENV=production
ENV VERCEL_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the port the dashboard runs on
EXPOSE 3000

# Start the dashboard
CMD ["bun", "run", "start"]
