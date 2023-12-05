const https = require('https');
const fs = require('node:fs');
const path = require('path');

const appJSURL = 'https://raw.githubusercontent.com/sprintui/SprintUi-Framework/main/public/assets/app.js';
const buildJSURL = 'https://raw.githubusercontent.com/sprintui/SprintUi-Framework/main/build.js';
const serverJSURL = 'https://raw.githubusercontent.com/sprintui/SprintUi-Framework/main/server.js';
const versionFileURL = 'https://raw.githubusercontent.com/sprintui/SprintUi-Framework/main/version.txt';

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

function getVersion(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get version. Status code: ${response.statusCode}`));
        return;
      }

      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve(data.trim()); // Trim to remove leading/trailing whitespaces
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAndSave() {
  const appJSPath = path.join(__dirname, './public/assets/app.js');
  const buildJSPath = path.join(__dirname, 'build.js');

  try {
    // Get and log the latest version
    const latestVersion = await getVersion(versionFileURL);
    console.log(`Latest version: ${latestVersion}`);

    console.log('Downloading app.js...');
    await downloadFile(appJSURL, appJSPath);
    console.log('app.js download complete.');

    console.log('Downloading build.js...');
    await downloadFile(buildJSURL, buildJSPath);


    const buildJSContent = fs.readFileSync(buildJSPath, 'utf8');
    const updatedBuildJSContent = buildJSContent.replace(/const sV = (.*);/, `const sV = ${latestVersion};`);
    fs.writeFileSync(buildJSPath, updatedBuildJSContent);


    
    console.log('build.js download complete.');

    console.log('Downloading server.js...');

    await downloadFile(serverJSURL, path.join(__dirname, 'server.js'));

    const serverJSContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const updatedServerJSContent = serverJSContent.replace(/const sV = (.*);/, `const sV = ${latestVersion};`);
    fs.writeFileSync(path.join(__dirname, 'server.js'), updatedServerJSContent);

    console.log('server.js download complete.');

    
    

    console.log('Done!');
  } catch (error) {
    console.error(error.message);
  }
}

// Call the function to initiate the download
downloadAndSave();
