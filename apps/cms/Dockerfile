FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/

# Copy cms app
COPY apps/cms/ ./apps/cms/

# Install all dependencies from root
RUN pnpm install --no-frozen-lockfile

# Build cms
RUN cd apps/cms && pnpm build

WORKDIR /app/apps/cms

ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/server.js"]
