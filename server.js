const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const fs = require("node:fs");
const path = require("path");

const cors = require("cors");
let assetObject = [
  {
    extension: ".js",
    contentType: "text/javascript",
  
  }
  ,
  {
    extension: ".css",
    contentType: "text/css",
  
  }
  ,
  {
    extension: ".png",
    contentType: "image/png",
  
  }
  ,
  {
    extension: ".jpg",
    contentType: "image/jpg",
  
  }
  ,
  {
    extension: ".jpeg",
    contentType: "image/jpeg",
  
  }
  ,
  {
    extension: ".gif",
    contentType: "image/gif",
  
  }
  ,
  {
    extension: ".svg",
    contentType: "image/svg+xml",
  
  }
  ,
  {
    extension: ".ico",
    contentType: "image/x-icon",
  
  }
  ,
  {
    extension: ".json",
    contentType: "application/json",
  
  }
  ,
  {
    extension: ".map",
    contentType: "application/json",
  
  }
  ,
  {
    extension: ".woff",
    contentType: "font/woff",
  
  }
  ,
  {
    extension: ".woff2",
    contentType: "font/woff2",
  
  }
  ,
  {
    extension: ".ttf",
    contentType: "font/ttf",
  
  }
  ,
  {
    extension: ".eot",
    contentType: "font/eot",
  
  }
  ,
  {
    extension: ".otf",
    contentType: "font/otf",
  
  }
  ,
  {
    extension: ".mp4",
    contentType: "video/mp4",
  
  }
  ,
  {
    extension: ".webm",
    contentType: "video/webm",
  
  }
  ,
  {
    extension: ".ogg",
    contentType: "video/ogg",
  
  }
  ,
  {
    extension: ".mp3",
    contentType: "audio/mpeg",
  
  }
  ,
  {
    extension: ".wav",
    contentType: "audio/wav",
  
  }
  ,
  {
    extension: ".flac",
    contentType: "audio/flac",
  
  }
  ,
  {
    extension: ".aac",
    contentType: "audio/aac",
  
  }
  ,
  {
    extension: ".oga",
    contentType: "audio/ogg",
  
  }
  ,
  {
    extension: ".m4a",
    contentType: "audio/mp4",
  
  }
  ,
  {
    extension: ".txt",
    contentType: "text/plain",
  },
  {
    extension: ".pdf",
    contentType: "application/pdf",
  }
  ,
  {
    extension: ".csv",
    contentType: "text/csv",
  }
  ,
  {
    extension: ".doc",
    contentType: "application/msword",
  }
  ,
  {
    extension: ".docx",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }
  ,
  {
    extension: ".xls",
    contentType: "application/vnd.ms-excel",
  }
  ,
  {
    extension: ".xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }
  ,
  {
    extension: ".ppt",
    contentType: "application/vnd.ms-powerpoint",
  }
  ,
  {
    extension: ".pptx",
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  }
  ,
  {
    extension: ".odt",
    contentType: "application/vnd.oasis.opendocument.text",
  }
  ,
  {
    extension: ".ods",
    contentType: "application/vnd.oasis.opendocument.spreadsheet",
  }
  ,
  {
    extension: ".odp",
    contentType: "application/vnd.oasis.opendocument.presentation",
  }
  ,
  {
    extension: ".xml",
    contentType: "application/xml",
  }
  ,
  {
    extension: ".zip",
    contentType: "application/zip",
  }
  ,
  {
    extension: ".gz",
    contentType: "application/gzip",
  }
  ,
  {
    extension: ".tar",
    contentType: "application/x-tar",
  }
  ,
  {
    extension: ".rar",
    contentType: "application/vnd.rar",
  }
  ,
  {
    extension: ".7z",
    contentType: "application/x-7z-compressed",
  }
  ,
  {
    extension: ".swf",
    contentType: "application/x-shockwave-flash",
  }
  ,
  {
    extension: ".exe",
    contentType: "application/x-msdownload",
  }
  ,
  {
    extension: ".psd",
    contentType: "application/octet-stream",
  }
  ,
  {
    extension: ".ai",
    contentType: "application/postscript",
  }
  ,
  {
    extension: ".eps",
    contentType: "application/postscript",
  }
  ,
  {
    extension: ".ps",
    contentType: "application/postscript",
  }
  ,
  {
    extension: ".torrent",
    contentType: "application/octet-stream",
  }
  ,
  {
    extension: ".bin",
    contentType: "application/octet-stream",
  }

];
app.use(cors());

function updatePagesFile() {
  let pagesPath = path.join(__dirname, "public", "pages");
  let pages = [];

  // list files in directory and loop through
  fs.readdirSync(pagesPath).forEach((file) => {
    const fPath = path.resolve(pagesPath, file);
    const fileStats = { file, path: fPath };
    if (fs.statSync(fPath).isDirectory()) {
      let subPages = fs.readdirSync(fPath);
      subPages = JSON.stringify(subPages);
      subPages = subPages.replace("[", "");
      subPages = subPages.replace("]", "");
      subPages = subPages.replace(/"/g, "");
      subPages = subPages.replace(/,/g, "\n");

      subPages = subPages.split(/\r?\n/);
      subPages.forEach((subPage) => {
        if (subPage.includes(".suip"))
          pages.push(file + "/" + subPage.replace(".suip", ""));
      });
    } else {
      fileStats.type = "file";
      if (fileStats.file.includes(".suip")) {
        pages.push(file.replace(".suip", ""));
      }
    }
  });

  let pagesSui = fs.readFileSync(path.join(__dirname, "pages.sui"), "utf8");

  let excludes = "EXCLUDES=" + pagesSui.split("EXCLUDES=");

  if (excludes != "EXCLUDES=") {
    excludes = excludes[1].split("\n")[0];
  }

  let pagesFile = excludes + "\n" + "ROUTES=" + pages;

  fs.writeFileSync(path.join(__dirname, "pages.sui"), pagesFile);
}

function readPagesFolder() {
  const pagesPath = path.join(__dirname, "public", "pages");

  let pages = [];

  // list files in directory and loop through
  fs.readdirSync(pagesPath).forEach((file) => {
    const fPath = path.resolve(pagesPath, file);
    const fileStats = { file, path: fPath };
    if (fs.statSync(fPath).isDirectory()) {
      let subPages = fs.readdirSync(fPath);
      subPages = JSON.stringify(subPages);
      subPages = subPages.replace("[", "");
      subPages = subPages.replace("]", "");
      subPages = subPages.replace(/"/g, "");
      subPages = subPages.replace(/,/g, "\n");

      subPages = subPages.split(/\r?\n/);
      subPages.forEach((subPage) => {
        if (subPage.includes(".suip"))
          pages.push(file + "/" + subPage.replace(".suip", ""));
      });
    } else {
      fileStats.type = "file";
      if (fileStats.file.includes(".suip")) {
        pages.push(file.replace(".suip", ""));
      }
    }
  });

  return pages;
}

app.get("*", (req, res, next) => {
  let origin = req.headers["referer"];
  let host = process.env.HOST + ":" + process.env.PORT;

  if (req.url.includes("pages")) {
    //check req.url doesn't have any file requests like /pages/home,etc. send a list of pages
    if (req.url === "/pages") {
      let pages = readPagesFolder();

      res.send("ROUTES=" + pages);
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
  } else {
    //check for asset file:js,css,image file types
    if (assetObject.some((extension) => req.url.includes(extension.extension))) {
      // search in the public/assets folder
      const assetPath = path.join(__dirname, "public", req.url);

      // Check if the file exists
      if (!fs.existsSync(assetPath)) {
        return res.status(404).send("Not found");
      }

      //set the content type
      let contentType = "text/plain";

      assetObject.forEach((asset) => {
        if (req.url.includes(asset.extension)) {
          contentType = asset.contentType;
        }
      }
      );


      res.set("Content-Type", contentType);


      res.sendFile(assetPath);
    } else {
      return res.sendFile(path.join(__dirname, "public", "index.html"));
    }
  }
});

app.listen(port, () => {
  updatePagesFile();
  console.log("\x1b[31m%s\x1b[0m", "Swift UIp is running on port " + port);

  console.log("\x1b[33m%s\x1b[0m", "To go into production run: npm run build");
});
