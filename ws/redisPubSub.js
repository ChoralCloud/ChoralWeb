const config = require('../config')
var redis = require('redis')
    , subscriber = redis.createClient(config.redisData.url)
    , r = redis.createClient(config.redisData.url)

redisSubscribe = function(deviceId) {
    // redis pub sub, for testing that we can listen to channel 0
    subscriber.on("message", function( channel, message ) {
        r.hgetall(deviceId, function(err,msg) {
            console.log(msg);
        });
    });
    subscriber.subscribe(deviceId);
}

redisUnsubscribe = function(deviceId) {
    subscriber.unsubscribe(deviceId)
}

module.exports = {
    redisSubscribe: redisSubscribe,
    redisUnsubscribe: redisUnsubscribe
}
