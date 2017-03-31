const nunjucks = require('nunjucks');

var env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(
    ['views'], 
    {noCache: true}
  ),
  {autoescape: false}
);

function render(name, context) {
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



module.exports = render;