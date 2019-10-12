const socket = io.connect("http://localhost:3000");

const CHANGE_USERNAME = "CHANGE_USERNAME";
const POST_MESSAGE = "POST_MESSAGE";
const POST_FILE = "POST_FILE";
const REQUEST_HELPING = "REQUEST_HELPING";
const REQUEST_TIMETABLE = "REQUEST_TIMETABLE";
const REQUEST_SCORE = "REQUEST_SCORE";

const messageEl = $("#message"); // 消息输入框
const fileEl = $("#file"); // 文件输入框
let username = "";

// 初始化用户名
const initUsername = () => {
  // ask username
  const input = prompt("Please tell me your name");
  username = input;
  socket.emit(CHANGE_USERNAME, input); // 通过 socket 告诉服务器用户名
};

// 监听消息
const listenMessage = () => {
  // append the chat text message
  socket.on(POST_MESSAGE, message => {
    $("#messages").append(
      $("<li>").html(
        // 格式化消息
        typeof message === "object"
          ? `${moment(message.timestamp).format("H:mm:ss")} - ${
              message.message
            }`
          : message
      )
    );
  });
};

const getFile = () => fileEl.prop("files")[0]; // 获取用户上传的文件

const handleClickOnSendButton = e => {
  e.preventDefault();

  if (messageEl.val().startsWith("/")) {
    // 以 "/" 开头的约定为命令
    return handleCommand(messageEl.val());
  }
  if (messageEl.val()) {
    sendMessage(); // 发送消息
  }
  if (getFile()) {
    sendFile(); // 发送文件
  }

  return false;
};

const sendMessage = () => {
  socket.emit(POST_MESSAGE, messageEl.val()); // 通过 socket 向服务器发送消息
  $("#message").val("");
};

// 处理 command
const handleCommand = message => {
  const command = message.split(" ")[0];
  switch (command) {
    case "/help":
      socket.emit(REQUEST_HELPING);
      break;
    case "/课表":
    case "/kb":
      socket.emit(REQUEST_TIMETABLE, ...message.split(" ").slice(1));
    case "/成绩":
    case "/sc":
      socket.emit(REQUEST_SCORE);
    default:
      break;
  }

  $("#message").val("");
};

const sendFile = () => {
  var data = new FormData();
  data.append("file", getFile());

  // 将文件上传至服务器以在聊天室中共享
  fetch("/upload", {
    method: "POST",
    body: data
  })
    .then(res => res.json())
    .then(res =>
      socket.emit(
        POST_MESSAGE,
        `上传了 <a href="${res.path}" target="_blank">${res.fileName}</a>`
      )
    );
  $("#file").val("");
};

// 初始化一些工作
initUsername();
listenMessage();
$("form").submit(handleClickOnSendButton);
