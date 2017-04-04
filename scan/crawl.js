const path = require('path');
const writeJsonFile = require('write-json-file');
const got = require('got');
const endpoints = require('./endpoints.js');
const baseUrl = 'http://interactive.ftchinese.com/demos';
const statsFile = 'stats.json';

function fetch(url, to) {
  return got(url, {
      json: true
    })
    .then(res => {
      console.log(`Saving ${to}`);
      return writeJsonFile(to, res.body);
    })
    .catch(err => {
      throw err;
    });
}

function crawl(destDir=endpoints.saveTo) {
  destDir = path.isAbsolute(destDir) ? destDir : path.resolve(process.cwd(), destDir);
  return Promise.all(endpoints.modules.map(name => {
    const url = `${baseUrl}/${name}/${statsFile}`;
    const dest = `${destDir}/${name}.json`;
    console.log(`Fetching ${name}`);
    return fetch(url, dest);
  }))
  .catch(err => {
    throw err;
  });
}

if (require.main === module) {
  crawl()
    .catch(err => {
      console.log(err);
    });
}

module.exports = crawl;