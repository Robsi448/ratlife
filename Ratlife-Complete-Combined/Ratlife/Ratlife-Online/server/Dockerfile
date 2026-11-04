FROM node:24-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev --ignore-scripts
COPY server/src ./server/src
COPY shared ./shared
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data
EXPOSE 8080
CMD ["node","server/src/index.js"]
