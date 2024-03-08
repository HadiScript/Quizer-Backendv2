const express = require("express");
const Template = require("../../models/templates");
const moment = require("moment");
const sharp = require("sharp");
const { convertHtmlToWebp } = require("../../config/helpers/converter");

const router = express.Router();

// get requests;
router.post("/create", async (req, res) => {
  const myTemplate = new Template({
    htmlContent: `<!DOCTYPE html>
    <html lang="en">
      <head>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            border: 1mm solid #164e63;
            height: 188mm;
          }
    
          .border-pattern {
            position: absolute;
            left: 4mm;
            top: -6mm;
            height: 200mm;
            width: 267mm;
            border: 1mm solid #164e63;
            /* http://www.heropatterns.com/ */
            background-color: #d6d6e4;
            background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h16v2h-6v6h6v8H8v-6H2v6H0V0zm4 4h2v2H4V4zm8 8h2v2h-2v-2zm-8 0h2v2H4v-2zm8-8h2v2h-2V4z' fill='%23164e63' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E");
          }
          .content {
            position: absolute;
            left: 10mm;
            top: 10mm;
            height: 178mm;
            width: 245mm;
            border: 1mm solid #164e63;
            background: white;
          }
    
          .inner-content {
            border: 1mm solid #164e63;
            margin: 4mm;
            padding: 10mm;
            height: 148mm;
            text-align: center;
          }
    
          h1 {
            text-transform: uppercase;
            font-size: 48pt;
            margin-bottom: 0;
          }
          h2 {
            font-size: 24pt;
            margin-top: 0;
            padding-bottom: 1mm;
            display: inline-block;
            border-bottom: 1mm solid #164e63;
          }
          h2::after {
            content: "";
            display: block;
            padding-bottom: 4mm;
            border-bottom: 1mm solid #164e63;
          }
          h3 {
            font-size: 20pt;
            margin-bottom: 0;
            margin-top: 10mm;
          }
          p {
            font-size: 16pt;
          }
    
          .badge {
            width: 40mm;
            height: 40mm;
            position: absolute;
            right: 10mm;
            bottom: 10mm;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' /%3E%3C/svg%3E");
          }
        </style>
      </head>
      <body>
        <div class="border-pattern">
          <div class="content">
            <div class="inner-content">
              <h1>Certificate</h1>
              <h2>of Excellence</h2>
              <h3>This Certificate Is Proudly Presented To</h3>
              <p>{{name}}</p>
              <h3>Has Completed</h3>
              <p>PrintCSS Basics Course</p>
              <h3>On</h3>
              <p>{{date}}</p>
              <div class="badge"></div>
            </div>
          </div>
        </div>
      </body>
    </html>
    `,
  });
  await myTemplate.save();
  res.json({ ok: true });
});

router.get("/get", async (req, res) => {
  const data = await Template.findById({ _id: "65e030d2ae8b20fbe066ab00" });
  let finalHtml = data.htmlContent;
  finalHtml = finalHtml.replace("{{name}}", "Hadi Raza");
  finalHtml = finalHtml.replace("{{date}}", moment(Date.now()).format("MMM Do YY"));

  const webpContent = await convertHtmlToWebp(finalHtml);

  const webPImageBuffer = await sharp(webpContent).webp().toBuffer();
  const imageBase64 = webPImageBuffer.toString("base64");
  res.send(`data:image/webp;base64,${imageBase64}`);
});

router.get("/", async (req, res) => {
  const templates = await Template.find({});
  let data = [];
  for (const template of templates) {
    const imageContent = await convertHtmlToWebp(template.htmlContent);
    const webPImageBuffer = await sharp(imageContent).webp().toBuffer();
    const imageBase64 = webPImageBuffer.toString("base64");
    let obj = {};
    obj._id = template._id;
    obj.image = `data:image/webp;base64,${imageBase64}`;
    data.push(obj);
  }
  res.send(data);
});

module.exports = router;
