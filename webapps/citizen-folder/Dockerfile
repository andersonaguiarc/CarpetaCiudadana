# Etapa de construcción
FROM node:21.7.3 AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de package.json y package-lock.json
COPY package*.json ./
<<<<<<< HEAD
RUN npm ci
COPY . ./
RUN npm run build
=======

# Instalar las dependencias
RUN npm install

# Copiar el resto de los archivos de la aplicación
COPY . .

# Construir la aplicación Angular en modo producción
RUN npm run build:ssr
>>>>>>> f60ea8b4bd4594b0e5fb9d3c62e37c3bd5bed13d

# Listar el contenido de la carpeta dist para verificar la construcción
RUN ls -la /app/dist/mi-carpeta
RUN ls -la /app/dist/mi-carpeta/server

# Etapa de producción
FROM node:21.7.3
<<<<<<< HEAD
WORKDIR /usr/app
COPY --from=build /app/src/dist/mi-carpeta ./

=======

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos construidos desde la etapa de construcción
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package*.json ./

# Instalar las dependencias de producción
RUN npm install --only=production

# Exponer el puerto 4000
>>>>>>> f60ea8b4bd4594b0e5fb9d3c62e37c3bd5bed13d
EXPOSE 4000

# Comando por defecto para ejecutar el servidor
CMD ["node", "dist/citizen-folder/server/main.js"]