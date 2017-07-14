const config = require('../config')
var ws = require('./sockets');
var redis = require('redis')
    , subscriber = redis.createClient(config.redisData.url)
    , r = redis.createClient(config.redisData.url)

clients = ws.clients;

redisSubscribe = function(deviceId) {
    // redis pub sub, for testing that we can listen to channel 0
    subscriber.on("message", function( channel, message ) {
        r.hgetall(deviceId, function(err,data) {
            for( var i = 0; i < clients.length; i++ ) {
                clients[i].emit('chartData', {
                    time: data.device_timestamp,
                    value: data.sensor_data/500
                });
            }
            console.log(data);
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
