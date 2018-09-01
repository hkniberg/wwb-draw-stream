/*
  The drawing stream protocol is a websocket-based means to send info about doodles being added/removed from a whiteboard.

  Messages:


  {action: "listenToWhiteboard", whiteboardId: ..., clientId: ....}
  {action: "stopListeningToWhiteboard", whiteboardId: ..., clientId: ....}
  {action: 'addDoodle', doodle: doodle, whiteboardId: ..., clientId: ...}
  {action: 'removeDoodle', whiteboardId: ...., doodleId: ..., clientId: ....}
  {action: 'clearDoodles', whiteboardId: ..., clientId: ...}

  clientId is an arbitrary unique string sent from the client. 
  When listening to a whiteboard, a client will never receive events that originated from the same client.

 */
const redisUtil = require("./redis-util")
var redisSubscriptionClient
var redisPublishClient

//An array of {whiteboardId, webSocket, clientId}
let clients = []

let log

function startDrawingStreamServer() {
  /*
  const port = process.env.DRAWING_STREAM_PORT
  console.assert(port, "DRAWING_STREAM_PORT env variable must be set")
  */
  const port = process.env.DRAW_PORT
  console.assert(port, "process.env.DRAW_PORT env variable must be set")
  console.log("Draw port: ", port)

  log = !!process.env.DRAW_LOGGING
  console.log("Draw logging = " + log)

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
  var httpServer = http.createServer(app);

  httpServer.listen(port);

  const WebSocket = require('ws');

  const webSocketServer = new WebSocket.Server({ server: httpServer });
  console.log("Drawing stream server listening on port " + port)

  webSocketServer.on('connection', function connection(webSocket) {
    if (log) console.log("A client connected to the drawing stream websocket")

    webSocket.on('message', function(messageString) {
      messageReceivedFromClient(webSocket, messageString)
    });
  });
}

function messageReceivedFromClient(webSocket, messageString) {
  const message = JSON.parse(messageString)
  if (log) console.log('messageReceivedFromClient at ' + webSocket._socket.remoteAddress + "\n", message);
  if (messageString == "hello") {
    //console.log("Got hello. Returning world.")
    webSocket.send("world")
    return
  }

  try {
    const message = JSON.parse(messageString)
    //console.log("action is ", message.action)
    if (message.action == "listenToWhiteboard") {
      if (log) console.log("Drawing stream server got listenToWhiteboard message", message)
      console.assert(message.whiteboardId, "Message is missing whiteboardId")
      clients.push({whiteboardId: message.whiteboardId, webSocket: webSocket, clientId: message.clientId})
      removeClientWhenWebSocketIsClosed(webSocket)

    } else if (message.action == "stopListeningToWhiteboard") {
      if (log) console.log("Drawing stream server got stopListeningToWhiteboard message", message)
      console.assert(message.whiteboardId, "Message is missing whiteboardId")
      stopListeningToWhiteboard(message.clientId, message.whiteboardId)

    } else if (message.action == "addDoodle") {
      publishMessageToRedis(message)

    } else if (message.action == "removeDoodle") {
      publishMessageToRedis(message)

    } else if (message.action == "clearDoodles") {
      publishMessageToRedis(message)

    } else {
      console.log("Received invalid message action: " + messageString)

      throw new Error("Invalid action: " + message.action + " in message " + messageString)
    }
  } catch (err) {
    console.log("Something went wrong while processing message from client", messageString, err)
  }
}

function stopListeningToWhiteboard(clientId, whiteboardId) {
  if (log) console.log("stopListeningToWhiteboard ", clientId, whiteboardId)

  console.assert(clientId, "clientID is required")
  console.assert(whiteboardId, "whiteboardId is required")

  if (log) console.log("  Clients before: " + clients.length)
  clients = clients.filter((client) => {
    const thisIsTheClientToRemove = (client.clientId == clientId && client.whiteboardId == whiteboardId)
    return !thisIsTheClientToRemove
  })
  if (log) console.log("  Clients after: " + clients.length)
}

function removeClientWhenWebSocketIsClosed(webSocket) {
  webSocket.addEventListener('close', function() {
    if (log) console.log("onClose. Clients before: " + clients.length)
    clients = clients.filter((client) => {
      return client.webSocket != webSocket
    })
    if (log) console.log("clients after: " + clients.length)
  })
}

function messageReceivedFromRedis(channel, messageString) {
  const message = JSON.parse(messageString)
  if (log) console.log("messageReceivedFromRedis: " + channel + "\n",  message);
  clients.forEach((client) => {
    if (message.clientId != client.clientId) {
      if (message.whiteboardId == client.whiteboardId) {
        if (log) console.log("Sending it to client " + client.clientId)
        client.webSocket.send(messageString)
      } else {
        if (log) console.log("NOT sending it to client " + client.clientId + " (since it's a different whiteboard)")
      }
    } else {
      if (log) console.log("NOT sending it to client " + client.clientId + " (since the message came from that client)")
    }
  })
}

function initRedis() {

  const redis = require("redis")


  const redisOptions =  {url: process.env.REDIS_URL}
  console.log("Using redis url" + redisOptions.url)
  redisSubscriptionClient = redis.createClient(redisOptions)
  redisUtil.watchRedisClientAndCatchErrors(redisSubscriptionClient, "Draw stream subscription client")

  redisPublishClient = redis.createClient(redisOptions)
  redisUtil.watchRedisClientAndCatchErrors(redisPublishClient, "Draw stream publisher client")

}

function publishMessageToRedis(message) {
  redisPublishClient.publish("drawings", JSON.stringify(message))
}

function subscribeToRedisMessages() {
  redisSubscriptionClient.subscribe("drawings");
  redisSubscriptionClient.on("message", messageReceivedFromRedis)
}

module.exports = startDrawingStreamServer
