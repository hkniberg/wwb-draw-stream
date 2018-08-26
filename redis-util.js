module.exports = {
  watchRedisClientAndCatchErrors(redisClient, clientName) {
    redisClient.on("error", function(err) {
      console.log(clientName + ": " + err)
    })

    redisClient.on("ready", function(err) {
      console.log(clientName + ": ready")
    })

    redisClient.on("connect", function(err) {
      console.log(clientName + ": connected to the server")
    })

    redisClient.on("connect", function(err) {
      console.log(clientName + ": reconnecting to the server...")
    })

    redisClient.on("end", function(err) {
      console.log(clientName + ": server connected ended")
    })
  }
}



