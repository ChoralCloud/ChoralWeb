var io = require("socket.io");
var redisPS = require("./redisPubSub");

function sockConnection(server) {
    io = io(server);
    io.on("connection", function(socket) {
        // subscribe to devices here
        redisPS(socket);
        console.log('connected to socket');
    });
}

module.exports = {
  sockConnection: sockConnection
};
