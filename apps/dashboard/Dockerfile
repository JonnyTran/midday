# Base image with Bun
FROM oven/bun:1.2.21 AS base

# Install turbo CLI globally using Bun
FROM base AS turbo-cli
RUN bun add -g turbo

# Builder stage
FROM turbo-cli AS builder
WORKDIR /app

# Copy only the files needed for turbo prune to work
# These files are required for turbo to understand the workspace structure
COPY package.json ./
COPY turbo.json ./
COPY bun.lock ./

# Copy workspace package.json files (turbo needs these to understand dependencies)
COPY apps/ ./apps/
COPY packages/ ./packages/

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

# Build arguments for environment variables
ARG RESEND_API_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_ID
ARG VERCEL_URL
ARG VERCEL_ENV

# Set environment variables for build
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_ID=$NEXT_PUBLIC_SUPABASE_ID
ENV VERCEL_URL=$VERCEL_URL
ENV VERCEL_ENV=$VERCEL_ENV

# Build the dashboard and its dependencies
RUN turbo build --filter="@midday/dashboard..."

# Runner stage
FROM base AS runner

USER root
RUN apt-get update && apt-get install -y ca-certificates --no-install-recommends
USER bun

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
