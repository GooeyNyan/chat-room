const POST_MESSAGE = "POST_MESSAGE";
const { getTimeTable } = require("./pupp"); // 课表爬虫

// 处理请求的类
class Handler {
  /**
   * @param {SocketIO.Server} io socket.io 服务器实例
   * @param {SocketIO.Socket} socket socket 实例
   * @param {Message} messageHanlder 消息处理实例
   */
  // 初始化赋值
  constructor(io, socket, messageHanlder) {
    this.io = io;
    this.socket = socket;
    this.username = "";
    this.message = messageHanlder;
  }

  // 向当前 socket 发送历史消息
  emitHistory = () => {
    this.message.emitHistory(this.socket);
  };

  // 向所有 sockets 发送消息
  emitMessage = message => {
    this.message.emitToAll(this.username, message);
  };

  // 变更用户名
  changeUsername = username => {
    this.username = username;
    // 并告知所有用户该用户加入聊天室
    this.emitMessage("🔵 <strong>" + this.username + "</strong> 加入聊天室");
  };

  // 发送消息
  postMessage = message => {
    this.emitMessage("<strong>" + this.username + "</strong>: " + message);
  };

  // 断开连接
  disconnect = () => {
    this.emitMessage("🔴 <i>" + this.username + " left the chat..</i>");
  };

  // 欢迎消息
  welcome = () =>
    this.message.emit(
      this.socket,
      `WELCOME! 输入 <strong>/help</strong> 查看帮助`
    );

  // 帮助消息
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

  // 课表
  timetable = async (username, password) => {
    this.message.emit(this.socket, "课表获取中，请稍后…");
    try {
      this.message.emit(this.socket, await getTimeTable(username, password));
    } catch (error) {
      this.message.emit(this.socket, "课表获取失败，请稍后再试");
    }
  };

  // TODO: 成绩
  score = () => {
    return;
  };
}

// 处理消息的实例
class Message {
  /**
   * @param {SocketIO.Server} io
   */
  constructor(io) {
    this.messages = [];
    this.io = io;
  }

  // 保存消息
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

  // 该用户的消息发给所有 sockets
  emitToAll = (username, message) => {
    const messageEntry = this.save(username, message);
    this.io.emit(POST_MESSAGE, messageEntry);
  };

  // 发送历史消息
  emitHistory = socket => {
    this.messages.forEach(message => {
      this.emit(socket, message);
    });
  };

  /**
   * 向特定 socket 发送单条消息
   * @param {SocketIO.Socket} socket
   * @param {object} message
   */
  emit = (socket, message) => {
    socket.emit(POST_MESSAGE, message);
  };
}

module.exports = { Handler, Message };
