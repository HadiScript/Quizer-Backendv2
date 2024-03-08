const puppeteer = require("puppeteer");

const convertHtmlToWebp = async (htmlContent) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(htmlContent);
  const webpContent = await page.screenshot({ fullPage: true });

  await browser.close();

  return webpContent;
};

const convertHtmlToPDF = async (html) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html); // Set the HTML content
  const pdfBuffer = await page.pdf({ format: "A4" });

  await browser.close();
  return pdfBuffer;
};

module.exports = {
  convertHtmlToWebp,
  convertHtmlToPDF,
};
