FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p logs && \
    chmod -R 777 logs

ENV NODE_ENV=production

# Default to API Gateway, but allow override via environment variable
CMD npm run ${SERVICE_COMMAND:-start:api} 