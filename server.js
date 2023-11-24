const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const fs = require("node:fs");
const path = require("path");

const cors = require("cors");
let assetArray = [  ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".json", ".map",
".woff", ".woff2", ".ttf", ".eot", ".otf", ".mp4", ".webm", ".ogg", ".mp3", ".wav",
".flac", ".aac", ".oga", ".m4a", ".weba", ".pdf", ".doc", ".docx", ".xls", ".xlsx",
".ppt", ".pptx", ".zip", ".rar", ".tar", ".gz", ".7z", ".bz2", ".dmg", ".exe", ".iso",
".img", ".apk", ".torrent" ];
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
            if(subPage.includes(".suip")) pages.push(file + "/" + subPage.replace(".suip", ""));
          });


      } else {
          fileStats.type = 'file';
          if(fileStats.file.includes(".suip")){
            pages.push(file.replace(".suip", ""));
          }
      }

        
      
    });



  let pagesSui = fs.readFileSync(path.join(__dirname, "pages.sui"), "utf8");

  let excludes = "EXCLUDES=" + pagesSui.split("EXCLUDES=")

  if(excludes != "EXCLUDES="){
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
      if(subPage.includes(".suip")) pages.push(file + "/" + subPage.replace(".suip", ""));
    });


} else {
    fileStats.type = 'file';
    if(fileStats.file.includes(".suip")){
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
   if (assetArray.some(extension => req.url.includes(extension))) {
      // search in the public/assets folder 
      const assetPath = path.join(__dirname, "public", req.url);


      // Check if the file exists
      if (!fs.existsSync(assetPath)) {
        return res.status(404).send("Not found");
      }
      // Read the asset file content
      const assetContent = fs.readFileSync(assetPath, "utf8");

      // Send the response
      res.send(assetContent);
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
