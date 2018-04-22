console.log("wwbstream starting up...")

const startDrawingStreamServer = require('./drawing_stream_server')
startDrawingStreamServer()

const initShareDb = require('./sharedb_server')
initShareDb()

console.log("wwbstream running!")



