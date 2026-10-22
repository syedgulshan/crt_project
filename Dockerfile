# ==========================================
# Stage 1: Build Frontend Assets
# ==========================================
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Application Container
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

# Install native dependencies required for better-sqlite3 build
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

# Setup persistent volumes
RUN mkdir -p data uploads logs

EXPOSE 5000

CMD ["npx", "tsx", "server/src/index.ts"]
