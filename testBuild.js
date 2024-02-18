const fs = require('node:fs');
const express = require('express');
const path = require('node:path');
console.log('Checking if you have a build directory');
if (!fs.existsSync('build')) {
    console.error('No build directory found, please run `npm run build` first');
    process.exit(1);

}
console.log('Build directory found');

console.log('Starting test express server');


const app = express();

const port = 3000;
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
app.use(express.static('build'));

app.get("*", (req, res, next) => {
  let origin = req.headers["referer"];
  let host = process.env.HOST + ":" + process.env.PORT;
   //check for asset file:js,css,image file types
   if (assetObject.some((extension) => req.url.includes(extension.extension))) {
    // search in the public/assets folder
    const assetPath = path.join(__dirname, req.url);

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
    console.log('sending index.html');
    return res.sendFile(path.join(__dirname,  "build/index.html"));
  }
   
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
}
);

