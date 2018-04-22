function initShareDb() {
  const ShareDB = require('sharedb');

  const db = require('sharedb-mongo')(process.env.MONGO_URL);


  const redis = require("redis")

  const redisOptions = {url: process.env.REDIS_URL}
  const pubsub = require('sharedb-redis-pubsub')(redisOptions); // Redis client being an existing redis client connection

  const share = new ShareDB({db, pubsub});


  console.log("Starting websocket")

  const port = process.env.TEXT_PORT
  console.log("sharePort", port)
  console.assert(port, "Env variable TEXT_PORT must be set!")

  var WebSocketJSONStream = require('websocket-json-stream');

  const WebSocket = require('ws')
  const wss = new WebSocket.Server({ port: port })

  wss.on('connection', function(wsConnection) {
    console.log("Got ws connection!")
    var stream = new WebSocketJSONStream(wsConnection);

    wsConnection.on('error', function(err) {
      console.log("websocket fired 'error' event", err)
    })

    /*
     share.use('connect', function() {
     console.log('* connect')
     })
     share.use('op', function() {
     console.log('* op')
     })
     share.use('doc', function() {
     console.log('* doc')
     })
     */


    share.listen(stream)
    console.log("sharedb listening")
  })




  console.log("Got ws stream")

}

module.exports = initShareDb