# create a file named Dockerfile
FROM node:alpine
RUN npm install --global nodemon

RUN mkdir /app
WORKDIR /app

EXPOSE 3000
