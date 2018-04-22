console.log("hi")

const host = process.argv[2]
const port = process.argv[3]

const WebSocket = require('ws');

console.log("Sending hello to " + host + ":" + port)

const ws = new WebSocket('wss://' + host + ':' + port)

ws.on('open', function open() {
  ws.send('hello');
});

ws.on('message', function incoming(data) {
  console.log("Got: " + data);
});