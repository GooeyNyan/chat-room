const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const { Handler, Message } = require("./handler/socket");

const PORT = 3000;
const CONNECTION = "connection";
const DISCONNECT = "disconnect";
const CHANGE_USERNAME = "CHANGE_USERNAME";
const POST_MESSAGE = "POST_MESSAGE";
const POST_FILE = "POST_FILE";
const REQUEST_HELPING = "REQUEST_HELPING";
const REQUEST_TIMETABLE = "REQUEST_TIMETABLE";
const REQUEST_SCORE = "REQUEST_SCORE";

app.use(express.static("public"));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
  })
);

app.get("/", (req, res) => res.render("index.ejs"));
app.post("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  let file = req.files.file;

  const uploadPath = `/temp/${file.name}`;
  file.mv(`${__dirname}/public${uploadPath}`, err => {
    if (err) return res.status(500).send(err);
    res.send(JSON.stringify({ path: uploadPath, fileName: file.name }));
  });
});

const messageHandler = new Message(io);

io.sockets.on("connection", socket => {
  const handler = new Handler(io, socket, messageHandler);
  handler.welcome();
  handler.emitHistory();

  socket.on(CHANGE_USERNAME, handler.changeUsername);
  socket.on(POST_MESSAGE, handler.postMessage);
  socket.on(REQUEST_HELPING, handler.help);
  socket.on(REQUEST_TIMETABLE, handler.timetable);
  socket.on(REQUEST_SCORE, handler.score);

  socket.on(DISCONNECT, handler.disconnect);
});

http.listen(PORT, () => console.log(`listening on http://localhost:${PORT}`));
