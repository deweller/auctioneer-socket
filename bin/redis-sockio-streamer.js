// Generated by CoffeeScript 1.7.1

/*
 *
 * This simple server listens for publish messages on a redis channel
 * and then pushes those to the connected socket.io clients
 *
 */

(function() {
  var io, prefix, redis, redisHost, redisPort, socketioPort;

  prefix = process.env.STREAMER_PREFIX || 'auction';

  socketioPort = process.env.SOCKET_IO_PORT || 8040;

  redisPort = process.env.REDIS_PORT_6379_TCP_PORT || 6379;

  redisHost = process.env.REDIS_PORT_6379_TCP_ADDR || '127.0.0.1';

  io = require("socket.io").listen(socketioPort);

  redis = require('redis');

  console.log("Will connect to redis at " + redisHost + ":" + redisPort);

  io.on("connection", function(socket) {
    var redisClient;
    console.log("connection made!");
    redisClient = redis.createClient(redisPort, redisHost);
    console.log("redis client created");
    socket.emit("status", {
      state: "connected"
    });
    socket.on("listen", function(itemID) {
      console.log("subscribing to " + prefix + "-" + itemID);
      redisClient.subscribe("" + prefix + "-" + itemID);
      redisClient.on("message", function(channel, message) {
        console.log("heard " + message);
        socket.emit("" + prefix + "-update", JSON.parse(message));
      });
      redisClient.on("error", function(e) {
        console.log("error", e);
        socket.emit("status", {
          state: "disconnected",
          desc: "server disconnected from " + prefix + " " + itemID
        });
      });
      redisClient.on("subscribe", function(channel) {
        console.log("subscribed to " + channel);
        socket.emit("status", {
          state: "listening",
          desc: "server connected to " + prefix + " " + itemID
        });
      });
    });
    socket.on('disconnect', function() {
      console.log("terminating connection");
      return redisClient.quit();
    });
  });

  return;

}).call(this);
