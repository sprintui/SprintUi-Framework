const fs = require('node:fs');
const express = require('express');
const path = require('node:path');
var mime = require('mime-types')
console.log('Checking if you have a build directory');
if (!fs.existsSync('build')) {
    console.error('No build directory found, please run `npm run build` first');
    process.exit(1);

}
console.log('Build directory found');

console.log('Starting test express server');


const app = express();

const port = 3000;

app.use(express.static('build'));

app.get("*", (req, res, next) => {

   //check for asset file:js,css,image file types
   if (mime.lookup(req.url)) {
    // search in the public/assets folder
    const assetPath = path.join(__dirname, req.url);

    // Check if the file exists
    if (!fs.existsSync(assetPath)) {
      return res.status(404).send("Not found");
    }

   

    res.set("Content-Type", mime.lookup(req.url));


    res.sendFile(assetPath);
  } else {
   
    return res.sendFile(path.join(__dirname,  "build", "index.html"));
  }
   
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
}
);

