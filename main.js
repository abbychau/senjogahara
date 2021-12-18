const app = require("express")();
const fs = require("fs");
const http = require("http").Server(app);
const io = require("socket.io")(http);

var ROOMS = {};
var USERNAMES = {};

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.emit('welcome', { msg: 'welcome' });
  const roomid = "x"
  socket.join(roomid);
  socket.on("data", function (data) {
    switch (data.action) {
      case "play":
        socket
          .broadcast
          .to(roomid)
          .emit("play", data);
      break;
      case "pass":
        socket
          .broadcast
          .to(roomid)
          .emit("data", { action: "pass", msg: "" });
      break;
      case "join":
        socket
          .broadcast
          .to(roomid)
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
