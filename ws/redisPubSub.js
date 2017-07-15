const config = require('../config')
var ws = require('./sockets');
var redis = require('redis')
    , subscriber = redis.createClient(config.redisData.url)
    , r = redis.createClient(config.redisData.url)

clients = ws.clients;

redisSubscribe = function(deviceId, socket) {
    socket.on("disconnect", function() {
        console.log('disconnected from socket!');
        sub.unsubscribe(deviceId);
    });

    var sub = redis.createClient(config.redisData.url);
    sub.on("subscribe", function(channel, count) {
        console.log("Subscribed to " + channel + ". Now subscribe to " + count + " channel(s).");
    });

    sub.on('message', function(channel, jsonString) {
        data = JSON.parse(jsonString)
        socket.emit('chartData', {
            time: data.device_timestamp,
            value: data.device_data.sensor_data/500
        });
    });
    sub.subscribe(deviceId);
}

module.exports = {
    redisSubscribe: redisSubscribe
}
