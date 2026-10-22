FROM node:24-alpine

WORKDIR /app

# Install system dependencies (libc6-compat for compatibility with native modules)
RUN apk add --no-cache libc6-compat

# Enable corepack and activate pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Expose Next.js dev server port
EXPOSE 3456

CMD ["sh", "-c", "pnpm install && pnpm dev"]

