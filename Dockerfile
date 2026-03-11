FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
ARG VITE_PUBLIC_BASE_URL=
ENV VITE_PUBLIC_BASE_URL=${VITE_PUBLIC_BASE_URL}

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-deps
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 3001

CMD ["node", "backend/server.js"]
