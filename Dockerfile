FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations

RUN npm run build

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

CMD ["npm", "start"]
