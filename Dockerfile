FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY shared ./shared
COPY database ./database
COPY ai-worker ./ai-worker
COPY game-server ./game-server
COPY api ./api
COPY web ./web
COPY server.mjs ./

ENV NODE_ENV=production
ENV PORT=7860
ENV AI_ARENA_DB_PATH=/tmp/ai_arena_3.sqlite

EXPOSE 7860 3300

CMD ["node", "server.mjs"]
