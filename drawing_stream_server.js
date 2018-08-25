/*
  The drawing stream protocol is a websocket-based means to send info about doodles being added/removed from a whiteboard.

  Messages:

  {action: "listenToWhiteboard", whiteboardId: ..., clientId: ....}
  {action: 'addDoodle', doodle: doodle, clientId: ...}
  {action: 'removeDoodle', whiteboardId: ...., doodleId: ..., clientId: ....}
  {action: 'clearDoodles', whiteboardId: ..., clientId: ...}

  clientId is an arbitrary unique string sent from the client. 
  When listening to a whiteboard, a client will never receive events that originated from the same client.

 */
var redisSubscriptionClient
var redisPublishClient

//An array of whiteboardId and webSocket
let clients = []

function startDrawingStreamServer() {
  /*
  const port = process.env.DRAWING_STREAM_PORT
  console.assert(port, "DRAWING_STREAM_PORT env variable must be set")
  */
  const port = process.env.DRAW_PORT
  console.assert(port, "process.env.DRAW_PORT env variable must be set")
  console.log("Draw port: ", port)

  startWebSocketServer(port)
  initRedis()
  subscribeToRedisMessages()
}

function startWebSocketServer(port) {
  console.assert(port, "port missing!")

  var fs = require('fs');
  var http = require('http')
  //var privateKey  = fs.readFileSync('keys/key.pem', 'utf8');
  //var certificate = fs.readFileSync('keys/cert.pem', 'utf8');

  //var credentials = {key: privateKey, cert: certificate};
  var express = require('express');
  var app = express();

  //... bunch of other express stuff here ...

  //pass in your express app and credentials to create an https server
  var httpServer = http.createServer({}, app);

  httpServer.listen(port);

  const WebSocket = require('ws');

  const webSocketServer = new WebSocket.Server({ server: httpServer });
  console.log("Drawing stream server listening on port " + port)

  webSocketServer.on('connection', function connection(webSocket) {
    console.log("A client connected to the drawing stream websocket")

    webSocket.on('message', function(messageString) {
      messageReceivedFromClient(webSocket, messageString)
    });
  });
}

function messageReceivedFromClient(webSocket, messageString) {
  //console.log('messageReceivedFromClient at ' + webSocket._socket.remoteAddress, messageString);
  if (messageString == "hello") {
    //console.log("Got hello. Returning world.")
    webSocket.send("world")
    return
  }

  try {
    const message = JSON.parse(messageString)
    //console.log("action is ", message.action)
    if (message.action == "listenToWhiteboard") {
      //console.log("Drawing stream server got listenToWhiteboard message", message)
      console.assert(message.whiteboardId, "Message is missing whiteboardId")
      clients.push({whiteboardId: message.whiteboardId, webSocket: webSocket, clientId: message.clientId})
      removeClientWhenWebSocketIsClosed(webSocket)
    } else {
      publishMessageToRedis(message)
    }
  } catch (err) {
    console.log("SOmething went wrong while processing message from client", messageString, err)
  }
}

function removeClientWhenWebSocketIsClosed(webSocket) {
  webSocket.addEventListener('close', function() {
    //console.log("onClose. Clients before: " + clients.length)
    clients = clients.filter((client) => {
      return client.webSocket != webSocket
    })
    //console.log("clients after: " + clients.length)
  })
}

function messageReceivedFromRedis(channel, messageString) {
  const message = JSON.parse(messageString)
  //console.log("messageReceivedFromRedis: " + channel,  message);
  clients.forEach((client) => {
    if (message.clientId != client.clientId) {
      //console.log("Sending it to client " + client.clientId)
      client.webSocket.send(messageString)
    } else {
      //console.log("NOT sending it to client " + client.clientId + " (since the message came from that client)")
    }
  })
}

function initRedis() {

  const redis = require("redis")


  const redisOptions =  {url: "redis://:wwbredispw@rdb-wwb-redis-2700.nodechef.com:2412/0"} // {url: process.env.REDIS_URL}
  console.log("Using redis url" + redisOptions.url)
  redisSubscriptionClient = redis.createClient(redisOptions)

  redisSubscriptionClient.on("error", function (err) {
    console.log("Redis subscriber error " + err);
  });
  redisPublishClient = redis.createClient(redisOptions)
  redisPublishClient.on("error", function (err) {
    console.log("Redis publisher error " + err);
  });

}

function publishMessageToRedis(message) {
  redisPublishClient.publish("drawings", JSON.stringify(message))
}

function subscribeToRedisMessages() {
  redisSubscriptionClient.subscribe("drawings");
  redisSubscriptionClient.on("message", messageReceivedFromRedis)
}



/*
export function initStreams() {
  //Create a stream for whiteboard events
  //that should be broadcasted directly between clients.
  //This is a way to keep the clients visually in sync without overloading the server with database writes,
  //and without overloading the livequery event queue.
  const whiteboardStream = new Meteor.Stream("whiteboardStream")

  //Any client can read from the whiteboard stream.
  //But they can only listen to events for their own whiteboard
  //(because that's the only whiteboard the client knows the ID of, and you use ID
  //when subscribing to stream events).
  whiteboardStream.permissions.read(function() {return true})

  //Any client can emit events on the whiteboard stream.
  //But the event name is the whiteboardId, so they can effectively only
  //broadcast to other clients watching the same whiteboard.
  whiteboardStream.permissions.write(function() {return true})

  const originalMethod = Meteor.default_server.method_handlers["stream-whiteboardStream"]
  log.debug("Wrapping the stream-whiteboardStream method so it unblocks")

  const wrapperMethod = function(subscriptionId, arguments) {
    log.trace(`whiteboardStream wrapper method called for subscription ${subscriptionId}`)
    this.unblock()
    originalMethod.apply(this, [subscriptionId, arguments])
    log.trace("...successfully unblocked and called original method")
  }
  Meteor.default_server.method_handlers["stream-whiteboardStream"] = wrapperMethod

  return whiteboardStream
}
*/

module.exports = startDrawingStreamServer
