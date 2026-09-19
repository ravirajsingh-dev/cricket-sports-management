FROM node:24-slim

WORKDIR /tt-server

COPY ./package*.json ./

RUN npm install

CMD ["npm", "run", "server"]
