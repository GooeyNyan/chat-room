# 网络应用作业

```bash
yarn install

yarn start

open http://localhost:3000
```

## 课题

> **基于TCP协议C/S模式的聊天程序的设计**  

## 介绍

基于 TCP 协议，利用 socket，连接客户端和服务端，进行全双工的通信。

## 流程

先启动服务端 http 服务，同时启动 socket 服务器，并在用户连接时开始监听特定的用户事件。

之后客户端请求页面，连接 socket 服务器，触发特定事件，并通过 socket 告知服务器，服务器做出诸如修改用户名、用户登入、发送消息、发送文件、用户帮助、学生课表等诸多操作。

在满足基础聊天功能的同时，利用 puppeteer 构建爬虫功能，将学生常用的课表等功能，让学生可以通过一个简单的命令就获取到自己的课表。



## 文件介绍

``` 
.
├── README.md 说明
├── handler 处理逻辑的代码所在的文件夹
│   ├── pupp.js 爬虫相关
│   └── socket.js socket 请求相关
├── index.js 主文件，入口文件
├── package.json 依赖说明的 json
├── public  静态资源
│   ├── index.js 页面相关逻辑的js
│   └── temp 临时文件夹，存储上传的文件
├── views
│   └── index.ejs 静态页面，主页
└── yarn.lock 依赖的版本lock
```

