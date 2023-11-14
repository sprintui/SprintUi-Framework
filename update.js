let appJSURL = 'https://raw.githubusercontent.com/babymonie/sprintui/main/public/app.js';
let buildJSURL = 'https://raw.githubusercontent.com/babymonie/sprintui/main/build.js';

//download file from url and save it to a path and also log the status of download and when complete say done

const https = require('https');
const fs = require('fs');
const path = require('path');


function downloadFile(url, localPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file. Status code: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlinkSync(localPath);
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAndSave() {
  const appJSPath = path.join(__dirname, './public/app.js');
  const buildJSPath = path.join(__dirname, 'build.js');

  try {
    console.log('Downloading app.js...');
    await downloadFile(appJSURL, appJSPath);
    console.log('app.js download complete.');

    console.log('Downloading build.js...');
    await downloadFile(buildJSURL, buildJSPath);
    console.log('build.js download complete.');

    console.log('Done! Updated to the latest version.');
  } catch (error) {
    console.error(error.message);
  }
}

// Call the function to initiate the download
downloadAndSave();
