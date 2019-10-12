const fs = require("fs");
const puppeteer = require("puppeteer");
const captcha = require("trek-captcha");

// 处理验证码的逻辑
const handleCaptcha = async response => {
  const imageBuffer = await response.buffer(); // 将图片转换成 buffer
  fs.writeFileSync("captcha.gif", imageBuffer); // 将 buffer 临时保存到 captcha.gif

  const { token, buffer } = await captcha();
  return new Promise(resolve => {
    fs.createWriteStream("captcha.gif") // 创建 writeStream
      .on("finish", () => resolve(token)) // 解析 token（验证码）
      .end(buffer);
  });
};

// 获取课表的函数
const getTimeTable = async (username, password) => {
  /**
   * 以真实的 chromium 环境来请求网页，通过 Chrome Devtools Protocol 来控制与交互
   * 摆脱传统的 Selenium, phantomjs 模拟环境的限制，提供更强大的 API
   */
  // 创建 puppeteer 的 headless 浏览器实例
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage(); // 新建页面
  // let captchaResolve = null;
  // let captcha = new Promise(resolve => (captchaResolve = resolve));
  let loginResolve = null;
  // 登录的 Promise，以保证正方系统已登录。page.waitForNavigation({ waitUntil: "..." }) 不顶用
  let login = new Promise(resolve => (loginResolve = resolve));

  /**
   * 允许中断请求，以定制化请求
   * 例如减少不必要的请求以加快爬取速度
   */
  await page.setRequestInterception(true);
  page.on("request", request => {
    // 放过验证码的请求
    // if (request.url().includes("CheckCode.aspx")) {
    //   return request.continue();
    // }

    // 取消图片、样式、字体等不影响页面主体功能的请求以加快爬取速度
    if (["image", "stylesheet", "font"].includes(request.resourceType())) {
      return request.abort();
    }
    request.continue();
  });

  // 特别处理验证码的请求
  // page.on("response", async response => {
  //   if (response.url().includes("CheckCode.aspx")) {
  //     const code = await handleCaptcha(response);
  //     console.log(code);
  //     captchaResolve(code);
  //   }
  // });

  // 处理 alert
  page.on("dialog", async dialog => {
    if (dialog.message().includes("信息维护")) {
      loginResolve();
    }
    // console.log(dialog.message());
    await dialog.dismiss();
  });

  console.log(`正在爬取 ${username} 的课表…`);
  // await page.goto("http://202.119.225.34/default2.aspx#a");
  await page.goto("http://202.119.225.34/default_vsso.htm"); // 正方的地址
  await page.waitFor(1000);
  await page.type("#TextBox1", username); // 输入用户名
  await page.type("#TextBox2", password); // 输入密码
  // await page.evaluate(
  //   () => (document.querySelector("#TextBox2").style.display = "inline")
  // );
  // await page.type("#txtSecretCode", await captcha);
  await page.click("#Button1"); // 点击登录按钮

  await Promise.race([page.waitFor(2000), login]); // 等待登录
  console.log(">>>>>>>>>> login");
  const linkHandlers = await page.$x("//a[contains(text(), '学生个人课表')]"); // 请求课表
  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error("Link not found");
  }
  await page.waitFor(1000);
  console.log(">>>>>>>>>> timetable iframe");
  // 从 iframe 中提取课表信息
  const elementHandle = await page.$("#iframeautoheight");
  const frame = await elementHandle.contentFrame();
  await page.goto(frame.url());
  const table = await page.evaluate(
    () => document.querySelector("#Table1").outerHTML // 课表的 HTML
  );
  console.log(">>>>>>>>>> getTimetable");

  await browser.close();
  return table;
};

module.exports = {
  getTimeTable
};
