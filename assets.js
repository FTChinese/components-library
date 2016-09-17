var sass = require('node-sass');
var fs = require('fs');
var webpack = require('webpack');
var wpConfig = require('./webpack.config.js');

sass.render({
  file: 'client/scss/main.scss',
  includePaths: ['bower_components'],
  outFile: '.tmp/styles/main.css',
  outputStyle: 'compressed',
  sourceMap: '.tmp/styles/main.css.map'
}, function(err, result) {
  const css = fs.createWriteStream('.tmp/styles/main.css');
  const map = fs.createWriteStream('.tmp/styles/main.css.map');
  css.write(result.css.toString());
  map.write(result.map.toString());

  css.on('error', (err) => {
    console.log(err);
  });

  map.on('error', (err) => {
    console.log(err);
  });
});

webpack(wpConfig, function(err, stats) {
  if (err) throw err;
  console.log(stats.toString({
    colors: true,
    chunks: false,
  }));
});