const fs = require('fs');
const path = require('path');
const https = require('https');

const host = 'seodaeya.github.io';
const apiKey = 'd757d9f030cc4789bb023a4b38e3ccf4';
const keyLocation = `https://${host}/${apiKey}.txt`;

const postsDir = path.join(__dirname, '../posts');
const videosDir = path.join(__dirname, '../videos');

const getFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(file => file.endsWith('.md'));
};

const getUrls = () => {
  const urls = [`https://${host}/`, `https://${host}/categories`];
  
  const posts = getFiles(postsDir);
  posts.forEach(file => {
    urls.push(`https://${host}/posts/${file.replace('.md', '')}`);
  });
  
  const videos = getFiles(videosDir);
  videos.forEach(file => {
    urls.push(`https://${host}/videos/${file.replace('.md', '')}`);
  });
  
  return urls;
};

const submitIndexNow = () => {
  const urlList = getUrls();
  const payload = JSON.stringify({
    host,
    key: apiKey,
    keyLocation,
    urlList
  });
  
  console.log(`Submitting ${urlList.length} URLs to IndexNow...`);
  
  const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload)
    }
  };
  
  const req = https.request(options, (res) => {
    console.log(`Response Status: ${res.statusCode} ${res.statusMessage}`);
    
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 202) {
        console.log('IndexNow submission succeeded! Bing/Yandex notified.');
      } else {
        console.error(`IndexNow submission failed: ${body}`);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });
  
  req.write(payload);
  req.end();
};

submitIndexNow();
