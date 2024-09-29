# Etapa de construcción
FROM node:21.7.3 AS build
WORKDIR /app/src
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build:ssr

FROM node:21.7.3
WORKDIR /usr/app
COPY --from=build /app/src/dist/mi-carpeta ./
EXPOSE 4000
CMD ["node", "server/server.mjs"]