const config = require('../config')
var ws = require('./sockets');
var redis = require('redis')
    , subscriber = redis.createClient(config.redisStore.url)
    , r = redis.createClient(config.redisStore.url)

clients = ws.clients;

redisPSManager = function(socket) {
    deviceIds = []
    socket.on("disconnect", function() {
        console.log('disconnected from socket!');
        console.log('unsubscribing from deviceIds: ' + deviceIds);
        for( var i = 0; i < deviceIds.length; i+=1) {
            sub.unsubscribe(deviceIds[i]);
        }
    });

    var sub = redis.createClient(config.redisStore.url);
    sub.on("subscribe", function(channel, count) {
        console.log("Subscribed to " + channel + ". Now subscribed to " + count + " channel(s).");
    });

    sub.on('message', function(channel, jsonString) {
        data = JSON.parse(jsonString);
        console.log(data);
        socket.emit('chartData', {
            deviceId: data.device_id,
            time: data.device_timestamp,
            value: data.device_data.sensor_data/500
        });
    });

    socket.on("subscribeToID", function(data) {
        console.log("Subscribing to: " + data.deviceId);
        deviceIds.push(data.deviceId);
        sub.subscribe(data.deviceId);
    });
}

module.exports = {
    redisPSManager: redisPSManager
}
