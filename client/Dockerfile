FROM node:24-alpine

WORKDIR /tt-client

# install app dependencies
COPY ./package*.json ./

RUN npm install

CMD [ "npm", "run", "dev"]
