var clients = []; // keeps track of websocket clients

// websocket handler. called when a client connects for the first time
function handler(socket) {
  clients.push(socket);

  socket.emit('ackConnect', { data: 'connect acknowledged.' });

  socket.on('dataReceived', function (data) {
    console.log(data);
  });
}

// testing function to emit time series data to all websocket clients
function sendTestWSData(wsClients) {
  setTimeout(function() {
    var d = new Date();
    var time_ms = d.getTime(); // millis

    for (var i = 0; i < wsClients.length; i++) {
      var wsClient = wsClients[i];
      if (wsClient !== undefined) {
        wsClient.emit('chartData', {
          time: time_ms,
          value: Math.cos(time_ms) + 1
        });
      }
    }
    sendTestWSData(wsClients);
  }, 1000);
}

module.exports = {
  handler: handler,
  clients: clients,
  sendTestWSData: sendTestWSData
};
