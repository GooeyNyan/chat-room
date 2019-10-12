const POST_MESSAGE = "POST_MESSAGE";
const { getTimeTable } = require("./pupp");

class Handler {
  /**
   * @param {SocketIO.Server} io
   * @param {SocketIO.Socket} socket
   * @param {Message} messageHanlder
   */
  constructor(io, socket, messageHanlder) {
    this.io = io;
    this.socket = socket;
    this.username = "";
    this.message = messageHanlder;
  }

  emitHistory = () => {
    this.message.emitHistory(this.socket);
  };

  emitMessage = message => {
    this.message.emitToAll(this.username, message);
  };

  changeUsername = username => {
    this.username = username;
    this.emitMessage("🔵 <strong>" + this.username + "</strong> 加入聊天室");
  };

  postMessage = message => {
    this.emitMessage("<strong>" + this.username + "</strong>: " + message);
  };

  disconnect = () => {
    this.emitMessage("🔴 <i>" + this.username + " left the chat..</i>");
  };

  welcome = () =>
    this.message.emit(
      this.socket,
      `WELCOME! 输入 <strong>/help</strong> 查看帮助`
    );

  help = () =>
    this.message.emit(
      this.socket,
      `
<div>
  <p>输入 <strong>/课表 B161502xx password</strong> 或 <strong>/kb ...</strong> 查看本学期课表</p>
</div>
`
      // <p>输入 <strong>/成绩</strong> 或 <strong>/cj</strong> 查询本学期成绩</p>
    );

  timetable = async (username, password) => {
    this.message.emit(this.socket, "课表获取中，请稍后…");
    try {
      this.message.emit(this.socket, await getTimeTable(username, password));
    } catch (error) {
      this.message.emit(this.socket, "课表获取失败，请稍后再试");
    }
  };

  score = () => {
    return;
  };
}

class Message {
  /**
   * @param {SocketIO.Server} io
   */
  constructor(io) {
    this.messages = [];
    this.io = io;
  }

  save = (username, message) => {
    const messageEntry = {
      key: `${Date.now()}-${username}`,
      timestamp: Date.now(),
      username: username,
      message
    };
    this.messages.push(messageEntry);
    return messageEntry;
  };

  emitToAll = (username, message) => {
    const messageEntry = this.save(username, message);
    this.io.emit(POST_MESSAGE, messageEntry);
  };

  emitHistory = socket => {
    this.messages.forEach(message => {
      this.emit(socket, message);
    });
  };

  /**
   * @param {SocketIO.Socket} socket
   * @param {object} message
   */
  emit = (socket, message) => {
    socket.emit(POST_MESSAGE, message);
  };
}

module.exports = { Handler, Message };
