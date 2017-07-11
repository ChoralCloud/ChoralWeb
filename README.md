# ChoralWeb

## Installation
You need a instance of redis running easiest way to get it is with docker:

```
docker run -d --name redis -p 6379:6379 redis
```

This starts up a instance on localhost:6379 which is the defaut for the app

You will also need  a running MongoDB instance, with a database named 'choralweb'.

```
git clone git@github.com:ChoralCloud/ChoralWeb.git \
&& cd ChoralWeb \
&& npm install
```

You will need to creat a new config file based on the template:
```
cp config/index.js.example config/index.js
```
Now overwrite the config file with the correct clientID and clientSecret you will need to get them from google.

Start the server.
```
DEBUG=choralweb:* REDIS_STORE_SECRET="whateveryouwant" npm start
```

The server should be listening on localhost:3000.

checkout localhost:3000/chart_test for a chart demo

