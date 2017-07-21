const config = require('../config')
var redis = require('redis')

var redisPSManager = function(socket) {
    var choralIds = []
    socket.on("disconnect", function() {
        console.log('disconnected from socket!');
        console.log('unsubscribing from choralIds: ' + choralIds);
        for( var i = 0; i < choralIds.length; i+=1) {
            sub.unsubscribe(choralIds[i]);
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
        console.log("Subscribing to: " + data.choralId);
        choralIds.push(data.choralId);
        sub.subscribe(data.choralId);
    });
}

module.exports = redisPSManager;
