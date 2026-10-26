FROM node:22-bookworm-slim

WORKDIR /app
COPY livrables/backend/src ./livrables/backend/src
COPY livrables/frontend ./livrables/frontend

WORKDIR /app/livrables/backend
ENV PORT=8080
ENV SQLITE_PATH=/data/vocab.sqlite
EXPOSE 8080
CMD ["node", "src/server.js"]
