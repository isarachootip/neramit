FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--experimental-require-module"
ENV NERAMIT_DATA_DIR="/app/data"

COPY package.json package-lock.json* ./
RUN npm install --include=dev --no-audit --no-fund

COPY . .
RUN mkdir -p /app/data/media && npm run build

VOLUME ["/app/data"]
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
