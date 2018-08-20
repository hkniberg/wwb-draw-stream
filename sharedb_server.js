function initShareDb() {
  const ShareDB = require('sharedb');

  const mongoUrl = process.env.MONGO_URL
  console.assert(mongoUrl, "MONGO_URL must be set")

  const db = require('sharedb-mongo')(mongoUrl);


  const redis = require("redis")
  const redisUrl = process.env.REDIS_URL
  console.assert(redisUrl, "REDIS_URL must be set")

  const redisOptions = {url: redisUrl}
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