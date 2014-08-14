###
#
# This simple server listens for publish messages on a redis channel
# and then pushes those to the connected socket.io clients
#
###

prefix = process.env.STREAMER_PREFIX or 'auction'
socketioPort = process.env.SOCKET_IO_PORT or 8040
redisPort = process.env.REDIS_PORT_6379_TCP_PORT or 6379
redisHost = process.env.REDIS_PORT_6379_TCP_ADDR or '127.0.0.1'

io = require("socket.io").listen(socketioPort)
redis = require('redis')
console.log "Will connect to redis at #{redisHost}:#{redisPort}"

io.on "connection", (socket) ->
    console.log "connection made!"
    redisClient = redis.createClient(redisPort, redisHost)
    console.log "redis client created"

    socket.emit "status", {
        state: "connected"
    }

    socket.on "listen", (itemID)->
        console.log "subscribing to #{prefix}-#{itemID}"
        redisClient.subscribe("#{prefix}-#{itemID}")

        redisClient.on "message", (channel, message)->
            console.log "heard #{message}"
            socket.emit "#{prefix}-update", JSON.parse(message)
            return

        redisClient.on "error", (e)->
            console.log "error",e
            socket.emit "status", {
                state: "disconnected"
                desc: "server disconnected from #{prefix} #{itemID}"
            }
            return

        redisClient.on "subscribe", (channel)->
            console.log "subscribed to #{channel}"
            socket.emit "status", {
                state: "listening"
                desc: "server connected to #{prefix} #{itemID}"
            }
            return

        return

    socket.on 'disconnect', ()->
        console.log "terminating connection"
        redisClient.quit()

    return



return
