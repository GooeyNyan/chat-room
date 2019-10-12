const socket = io.connect("http://localhost:3000");

const CHANGE_USERNAME = "CHANGE_USERNAME";
const POST_MESSAGE = "POST_MESSAGE";
const POST_FILE = "POST_FILE";
const REQUEST_HELPING = "REQUEST_HELPING";
const REQUEST_TIMETABLE = "REQUEST_TIMETABLE";
const REQUEST_SCORE = "REQUEST_SCORE";

const messageEl = $("#message");
const fileEl = $("#file");
let username = "";

const initUsername = () => {
  // ask username
  const input = prompt("Please tell me your name");
  username = input;
  socket.emit(CHANGE_USERNAME, input);
};

const listenMessage = () => {
  // append the chat text message
  socket.on(POST_MESSAGE, message => {
    $("#messages").append(
      $("<li>").html(
        typeof message === "object"
          ? `${moment(message.timestamp).format("H:mm:ss")} - ${
              message.message
            }`
          : message
      )
    );
  });
};

const getFile = () => fileEl.prop("files")[0];

const handleClickOnSendButton = e => {
  e.preventDefault(); // prevents page reloading

  if (messageEl.val().startsWith("/")) {
    return handleCommand(messageEl.val());
  }
  if (messageEl.val()) {
    sendMessage();
  }
  if (getFile()) {
    sendFile();
  }

  return false;
};

const sendMessage = () => {
  socket.emit(POST_MESSAGE, messageEl.val());
  $("#message").val("");
};

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

initUsername();
listenMessage();
$("form").submit(handleClickOnSendButton);
