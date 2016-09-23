const fs = require('fs');
const nunjucks = require('nunjucks');

var env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(
    ['views'], 
    {noCache: true}
  ),
  {autoescape: false}
);

function render(name, context) {
  const obj = {};
  return new Promise(function(resolve, reject) {
    env.render(name, context, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function readJson(filename) {
  return new Promise(
    function(resolve, reject) {
      fs.readFile(filename, 'utf8', function(err, data) {
        if (err) {
          console.log('Cannot find file: ' + filename);
          reject(err);
        } else {
          resolve(JSON.parse(data));
        }
      });
    }
  );
}

function readFile(filename) {
  return new Promise(
    function(resolve, reject) {
      fs.readFile(filename, 'utf8', function(err, data) {
        if (err) {
          console.log('Cannot find file: ' + filename);
          reject(err);
        } else {
          resolve(data);
        }
      });
    }
  );
}

function writeFile(file, data) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(file, data, 'utf8', function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(0);
      }
    });
  });
}

function readDir(path) {
  return new Promise(function(resolve, reject) {
    fs.readdir(path, 'utf8', function(err, files) {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    })
  });
}

module.exports = {
  readJson: readJson,
  readFile: readFile,
  readDir: readDir,
  render: render,
  writeFile: writeFile
};