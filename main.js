const app = require("express")();
const fs = require("fs");
const http = require("http").Server(app);
const io = require("socket.io")(http);
var USERNAMES = {};
var ROOMS = {};
var RECORDS = {}

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.emit("welcome", { msg: "welcome" });

  socket.on("data", function (data) {
    const roomid = ROOMS[socket.id];
    switch (data.action) {
      case "play":
        socket.broadcast.to(roomid).emit("play", data);

        //append to record
        if (RECORDS[roomid] === undefined) {
          RECORDS[roomid] = [];
        }
        RECORDS[roomid].push(data);
        console.log(RECORDS)
        break;
      case "clear":
        socket
        .broadcast
        .to(roomid)
        .emit("clear", data);
        break;
      case "replay":
        socket.broadcast.to(roomid).emit("replay", {});
        break;
      case "pass":
        socket.broadcast.to(roomid).emit("pass", {});
        break;
      case "takeback":
        socket.broadcast.to(roomid).emit("takeback", RECORDS[ROOMS[socket.id]]);
        break;
      case "join":
        ROOMS[socket.id] = data.roomid;
        socket.join(data.roomid);
        
        console.log(socket.id + " joined: " + data.roomid);

        socket.broadcast.to(ROOMS[socket.id]).emit("data", {
          action: "msg",
          msg: socket.id + "進入房間了!",
        });

        var record = RECORDS[ROOMS[socket.id]];
        console.log(record)
        if (record != null) {
          for (var i = 0; i < record.length; ++i) {
            socket.emit('play', record[i]);
          }
        }

        break;
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.get("/*", function (req, res) {
  var url = req.url;
  var pos = url.indexOf("?");
  if (pos != -1) {
    url = url.substring(0, pos);
  }
  if (url == "/") {
    url = "/index.html";
  }
  var path = __dirname + "/web" + url;
  if (fs.existsSync(path)) {
    res.sendFile(path);
  } else {
    res.writeHead(404);
    res.end();
  }
});
http.listen(3000, () => {
  console.log("listening");
});
