FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p logs && \
    chmod -R 777 logs

ENV NODE_ENV=production

CMD ["npm", "start"] 