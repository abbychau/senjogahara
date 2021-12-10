const app = require("express")();
const fs = require("fs");
const http = require("http").Server(app);
const io = require("socket.io")(http);

Array.prototype.remove = function() {
  var what, a = arguments, L = a.length, ax;
  while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
          this.splice(ax, 1);
      }
  }
  return this;
};

function leave(socket,data){
  let roomID = data.room
  socket.leave(roomID)
  ROOMS[roomID].users.remove(socket.id)
}
function join(socket, data) {
  var room = data.room;
  socket.join(room);
  socket.broadcast
    .to(room)
    .emit("data", { action: "msg", msg: getNameBySocket(socket) + msg });
  socket.emit("data", { action: "msg", msg: "您" + msg });
  var ids = io.sockets.adapter.rooms[room].sockets;
  for (var id in ids) {
    if (id == socket.id) {
      continue;
    }
    socket.emit("data", { action: "msg", msg: getNameBySocketId(id) + msg });
  }
  var record = getRecord(room);
  if (record != null) {
    for (var i = 0; i < record.length; ++i) {
      socket.emit("data", record[i]);
    }
  }
}

var ROOMS = {};
var USERNAMES = {};

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("data", function (data) {
    console.log(socket.id, data);
    switch (data.action) {
      case "play":
        socket.broadcast.to(ROOMS[socket.id]).emit("play", data);
        break;
      case "pass":
        socket.broadcast
          .to(ROOMS[socket.id])
          .emit("data", { action: "pass", msg: "" });
        break;
      case "leave":
        socket.leave(data.room)
        if(ROOMS[data.room].users.length == 0){
          delete ROOMS[data.room];
        }
      case "commitSetup":
        ROOMS[data.room].rules = data.rules;
      case "join":
        socket.join(data.room);
        socket.broadcast
          .to(ROOMS[socket.id])
          .emit("data", {
            action: "msg",
            msg: USERNAMES[socket.id] + "進入房間了!",
          });
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
http.listen(process.env.PORT || 3000, () => {
  console.log("listening");
});
