const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const fs = require("node:fs");
const cors = require("cors");

app.use(cors());

function readPagesFolder() {
  const pagesPath = path.join(__dirname, "public", "pages");

  let pages = fs.readdirSync(pagesPath);
  pages = JSON.stringify(pages);
  pages = pages.replace("[", "");
  pages = pages.replace("]", "");
  pages = pages.replace(/"/g, "");
  pages = pages.replace(/,/g, "\n");
  pages = pages.replace(/.suip/g, "");
  pages = pages.split(/\r?\n/);

  pages = "ROUTES=" + pages;

  return pages;
}

app.get("*", (req, res, next) => {
  let origin = req.headers["referer"];
  let host = process.env.HOST + ":" + process.env.PORT;

  if (req.url.includes("pages")) {
    //check req.url doesn't have any file requests like /pages/home,etc. send a list of pages
    if (req.url === "/pages") {
      let pages = readPagesFolder();

      res.send(pages);
    } else {
      // Construct the path to the .suip file based on the URL
      const pagePath = path.join(__dirname, "public", req.url + ".suip");
      // Check if the file exists
      if (!fs.existsSync(pagePath)) {
        return res.status(404).send("Not found");
      }
      // Read the .suip file content
      const pageContent = fs.readFileSync(pagePath, "utf8");

      // Send the response
      res.send(pageContent);
    }
  } else if (req.url.includes("assets")) {
    if (
      !fs.existsSync(
        path.join(__dirname, "public", req.url.replace("/assets", ""))
      )
    ) {
      return res.status(404).send("Not found");
    } else {
      return res.sendFile(
        path.join(__dirname, "public", req.url.replace("/assets", ""))
      );
    }
  } else {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

app.listen(port, () => {
  let pages = readPagesFolder();

  fs.writeFileSync(path.join(__dirname, "pages.sui"), pages);

  console.log("\x1b[31m%s\x1b[0m", "Swift UIp is running on port " + port);

  console.log("\x1b[33m%s\x1b[0m", "To go into production run: npm run build");
});
