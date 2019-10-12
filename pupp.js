const fs = require("fs");
const puppeteer = require("puppeteer");

const handleCaptcha = request => {
  console.log(request);
  // request
  //   .pipe(fs.createWriteStream("test.png"))
  //   .on("finish", () => console.log(token))
  //   .end(buffer);
};

(async () => {
  console.log("pupp");
  const browser = await puppeteer.launch({ headless: true });
  // const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", request => {
    if (request.url().includes("CheckCode.aspx")) {
      handleCaptcha(request);
      return request.continue();
    }

    if (["image", "stylesheet", "font"].includes(request.resourceType())) {
      return request.abort();
    }
    request.continue();
  });

  await page.goto("http://202.119.225.34/default2.aspx#a");
  await page.type("#txtUserName", "B16150212");
  await page.type("#TextBox2", "e*9FCtR#uhk41f@%");

  // await page.click("#dl");
  // await clickOnNavigateElement("#dl");

  // await browser.close();
})();
