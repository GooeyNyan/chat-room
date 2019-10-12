/**
 * 代码总入口
 * CS模式的聊天室
 */
const express = require("express"); // 后端框架
const fileUpload = require("express-fileupload"); // 文件上传
const app = express(); // 新建一个服务实例
const httpServer = require("http").Server(app); // 以 http 协议启动这个服务实例
const io = require("socket.io")(httpServer); // socket 实例，传入服务实例
/**
 * Handler 处理 socket 请求相关的逻辑
 * Message 处理消息相关的逻辑
 */
const { Handler, Message } = require("./handler/socket");

// 常量们 :p
const PORT = 3000; // 服务监听的端口
const DISCONNECT = "disconnect"; // 聊天室断开连接
const CHANGE_USERNAME = "CHANGE_USERNAME"; // 变更用户名
const POST_MESSAGE = "POST_MESSAGE"; // 发送消息
const REQUEST_HELPING = "REQUEST_HELPING"; // 请求帮助信息
const REQUEST_TIMETABLE = "REQUEST_TIMETABLE"; // 请求课表
const REQUEST_SCORE = "REQUEST_SCORE"; // 请求成绩

// 静态资源在 /public 提供
app.use(express.static("public"));
// 文件上传序列化文件处理
app.use(
  fileUpload({
    useTempFiles: true, // 临时存储
    tempFileDir: "/tmp/"
  })
);

// 主页路由
app.get("/", (req, res) => res.render("index.ejs")); // 渲染 /views/index.ejs
// 上传文件的路由
app.post("/upload", (req, res) => {
  // 判断请求中是否上传了文件
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  let file = req.files.file;

  // 文件保存路径
  const uploadPath = `/temp/${file.name}`;
  // 将文件移动到需要保存的文件夹
  file.mv(`${__dirname}/public${uploadPath}`, err => {
    if (err) return res.status(500).send(err);
    // 序列化文件保存信息
    res.send(JSON.stringify({ path: uploadPath, fileName: file.name }));
  });
});

// 多 socket 共用一个 messageHandler 来处理、共享消息
const messageHandler = new Message(io);

// 当 socket 连接上时，做以下操作
io.sockets.on("connection", socket => {
  // 实例化一个 Handler 来处理相应请求
  const handler = new Handler(io, socket, messageHandler);
  // 发送欢迎消息
  handler.welcome();
  // 发送历史消息
  handler.emitHistory();

  // 监听对应事件，并做相应操作
  // 变更用户名
  socket.on(CHANGE_USERNAME, handler.changeUsername);
  // 发送消息
  socket.on(POST_MESSAGE, handler.postMessage);
  // 帮助
  socket.on(REQUEST_HELPING, handler.help);
  // 课表
  socket.on(REQUEST_TIMETABLE, handler.timetable);
  // 成绩
  socket.on(REQUEST_SCORE, handler.score);
  // 断开连接
  socket.on(DISCONNECT, handler.disconnect);
});

// 启动服务器，并监听 `PORT` 端口
httpServer.listen(PORT, () =>
  console.log(`listening on http://localhost:${PORT}`)
);
