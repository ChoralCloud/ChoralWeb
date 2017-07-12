# create a file named Dockerfile
FROM node:argon
RUN npm install --global nodemon

RUN mkdir /app
WORKDIR /app

EXPOSE 3000
