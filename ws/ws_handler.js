var clients = []; // keeps track of websocket clients

function handler(socket) {
  clients.push(socket);

  socket.emit('ackConnect', { data: 'connect acknowledged.' });

  socket.on('dataReceived', function (data) {
    console.log(data);
  });
}

module.exports = { handler: handler, clients: clients };
