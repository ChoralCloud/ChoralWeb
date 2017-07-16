# ChoralWeb

## Installation

It is now required that you are concurrently running [Choral Storm](https://github.com/ChoralCloud/ChoralStorm) see the readme for instructions to run this

You must also (temporarily) set the location of coral allegro in the docker compose file

You will need to create a new config file based on the template:

`cp config/index.js.example config/index.js`

Now overwrite the config file with the correct clientID and clientSecret (you will need to get them from google).

Finally run the command

`docker-compose up`

This will start the server in development mode.

## Running in Production

TODO: create a production docker compose file

checkout localhost:3000/chart_test for a chart demo

