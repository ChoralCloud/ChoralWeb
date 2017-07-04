const config = {}

config.redisStore = {
  url: process.env.REDIS_STORE_URI,
  secret: process.env.REDIS_STORE_SECRET
}

config.google = {
  clientID: you need to get the clientID,
  clientSecret: you need to get the client secret,
  callbackURL: "http://localhost:3000/auth/google/callback"
}


module.exports = config
