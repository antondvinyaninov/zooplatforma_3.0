# ==========================================
# Stage 1: Build Frontend (Next.js)
# ==========================================
FROM node:20-alpine AS builder-frontend
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend (Golang)
# ==========================================
FROM golang:1.24-alpine AS builder-backend
WORKDIR /app/backend

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN go build -o /app/backend_binary ./cmd/api/main.go

# ==========================================
# Stage 3: Final Production Image
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Enable simple alpine commands if needed
RUN apk add --no-cache libc6-compat curl

# Set environment
ENV NODE_ENV=production

# 1. Copy Go backend binary
COPY --from=builder-backend /app/backend_binary /app/backend_binary

# 2. Copy Next.js frontend
WORKDIR /app/frontend
# Next.js standalone output copies all required node_modules and files to .next/standalone
COPY --from=builder-frontend /app/frontend/public ./public
COPY --from=builder-frontend /app/frontend/.next/standalone ./
COPY --from=builder-frontend /app/frontend/.next/static ./.next/static

# 3. Setup start script
WORKDIR /app
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Easypanel exposes ports defined by app config (let's expose 3000 and 8000 internally)
EXPOSE 3000
EXPOSE 8000

CMD ["/app/start.sh"]
