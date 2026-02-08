# ===========================================
# SmartProperty Frontend - Dockerfile (Development)
# ===========================================
# Multi-stage: deps → dev (with HMR) → prod (nginx)

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only (cached layer)
COPY package.json package-lock.json* ./
RUN npm install

# Development stage with Vite HMR
FROM base AS dev
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production build stage
FROM base AS build
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
