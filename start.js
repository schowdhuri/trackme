const puppeteer = require("puppeteer");
const zeropad = require("zeropad");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log(msg.text()));

  await page.exposeFunction('screenshot', (index) => {
    const filename = `tiles/tile-${zeropad(index, 4)}.jpg`;
    console.log("Capturing: ", filename)
    page.screenshot({path: filename, type: 'jpeg', clip: {
      x: 300,
      y: 130,
      width: 340,
      height: 340
    }});
    return index
  });

  let done;

  await page.goto('http://localhost:8989/index.html', { waitUntil: 'networkidle0' });

  await page.$eval("#botLeftLat", el => el.value = "12.919345");
  await page.$eval("#botLeftLng", el => el.value = "77.627323");
  await page.$eval("#topRightLat", el => el.value = "12.930120");
  await page.$eval("#topRightLng", el => el.value = "77.638865");
  await page.$eval("#initZoom", el => el.value = "19");
  await page.click("#showBounds");
  await page.click("#btnRender");
  await page.waitForFunction("window.mapReady === true");
  console.log("mapReady");
  await page.click("#btnStart");
  console.log(done)
  await done;
  await page.waitForFunction("window.endSession === true", {
    timeout: 0,
    polling: 2000
  });

  await browser.close();
})();
