# ChoralWeb

## Installation

You will need to create a new config file based on the template:

`cp config/index.js.example config/index.js`

Now overwrite the config file with the correct clientID and clientSecret (you will need to get them from google).

Next open the docker-compose.yml file, and update the line STORM_REDIS_URI: <hostname where storm redis is exposed>

Finally run the command

`docker-compose up`

This will start the server in development mode.

## Running in Production

TODO: create a production docker compose file

checkout localhost:3000/chart_test for a chart demo

