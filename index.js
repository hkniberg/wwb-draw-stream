console.log("wwbstream starting up...")

const startDrawingStreamServer = require('./drawing_stream_server')
startDrawingStreamServer()

const initShareDb = require('./sharedb_server')
initShareDb()

//Create health check server
const healthPort = process.env.HEALTH_PORT
console.assert(healthPort, "process.env.HEALTH_PORT env variable must be set")

var http = require('http');
http.createServer(function (req, res) {
  res.write('www-stream works fine!'); //write a response to the client
  res.end(); //end the response
}).listen(healthPort); //the server object listens on port 8080

console.log("wwbstream running! Check health on port " + healthPort)



