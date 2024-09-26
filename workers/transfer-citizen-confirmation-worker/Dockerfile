FROM node:18

RUN apt-get update && apt-get install -y apt-transport-https ca-certificates

RUN apt-get update && apt-get install -y netcat-openbsd

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .

CMD npm start