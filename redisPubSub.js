const config = require('./config')
var redis = require('redis')
    , subscriber = redis.createClient(config.redisData.url)
    , r = redis.createClient(config.redisData.url)

redisPubSub = function() {
    // redis pub sub, for testing that we can listen to channel 0
    subscriber.on("message", function( channel, message ) {
        console.log("Message '" + message + "' on channel '" + channel + "' arrived!");
        r.hgetall("0", function(err,msg) {
            console.log(msg);
        });
    });
    subscriber.subscribe("0");
}

module.exports = redisPubSub;
