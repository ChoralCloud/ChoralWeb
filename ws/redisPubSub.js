const config = require('../config')
var redis = require('redis')

var redisPSManager = function(socket) {
    var deviceIds = []
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
        console.log(jsonString);
        socket.emit('chartData', jsonString);
    });

    socket.on("subscribeToID", function(data) {
        console.log("Subscribing to: " + data.deviceId);
        deviceIds.push(data.deviceId);
        sub.subscribe(data.deviceId);
    });
}

module.exports = redisPSManager;
