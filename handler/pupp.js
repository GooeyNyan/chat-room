const fs = require("fs");
const puppeteer = require("puppeteer");
const captcha = require("trek-captcha");

const handleCaptcha = async response => {
  const imageBuffer = await response.buffer();
  fs.writeFileSync("captcha.gif", imageBuffer);

  const { token, buffer } = await captcha();
  return new Promise(resolve => {
    fs.createWriteStream("captcha.gif")
      .on("finish", () => resolve(token))
      .end(buffer);
  });
};

const getTimeTable = async (username, password) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let captchaResolve = null;
  let loginResolve = null;
  let captcha = new Promise(resolve => (captchaResolve = resolve));
  let login = new Promise(resolve => (loginResolve = resolve));

  await page.setRequestInterception(true);
  page.on("request", request => {
    // if (request.url().includes("CheckCode.aspx")) {
    //   return request.continue();
    // }

    if (["image", "stylesheet", "font"].includes(request.resourceType())) {
      return request.abort();
    }
    request.continue();
  });

  // page.on("response", async response => {
  //   if (response.url().includes("CheckCode.aspx")) {
  //     const code = await handleCaptcha(response);
  //     console.log(code);
  //     captchaResolve(code);
  //   }
  // });

  page.on("dialog", async dialog => {
    if (dialog.message().includes("信息维护")) {
      loginResolve();
    }
    // console.log(dialog.message());
    await dialog.dismiss();
  });

  console.log(`正在爬取 ${username} 的课表…`);
  // await page.goto("http://202.119.225.34/default2.aspx#a");
  await page.goto("http://202.119.225.34/default_vsso.htm");
  await page.waitFor(1000);
  await page.type("#TextBox1", username);
  // await page.evaluate(
  //   () => (document.querySelector("#TextBox2").style.display = "inline")
  // );
  await page.type("#TextBox2", password);
  // await page.type("#txtSecretCode", await captcha);
  await page.click("#Button1");

  await login;
  console.log(">>>>>>>>>> login");
  const linkHandlers = await page.$x("//a[contains(text(), '学生个人课表')]");
  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error("Link not found");
  }
  await page.waitFor(1000);
  console.log(">>>>>>>>>> timetable iframe");
  const elementHandle = await page.$("#iframeautoheight");
  const frame = await elementHandle.contentFrame();
  await page.goto(frame.url());
  const table = await page.evaluate(
    () => document.querySelector("#Table1").outerHTML
  );
  console.log(">>>>>>>>>> getTimetable");

  await browser.close();
  return table;
};

module.exports = {
  getTimeTable
};
