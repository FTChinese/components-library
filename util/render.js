const nunjucks = require('nunjucks');

var env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(
    ['views'], 
    {
      watch: true
    }
  ),
  {autoescape: false}
);

function render(name, context) {
  return new Promise(function(resolve, reject) {
    env.render(name, context, function(err, result) {
      err === null ? resolve(result) : reject(err);
    });
  });
}

module.exports = render;