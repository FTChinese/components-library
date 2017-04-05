const pify = require('pify');
const path = require('path');
const fs = require('fs-jetpack');
const loadJsonFile = require('load-json-file');
const nunjucks = require('nunjucks');
nunjucks.configure(path.resolve(process.cwd(), 'views'), {
  noCache: true,
  watch: false
});
const render = pify(nunjucks.render);
const endpoints = require('./endpoints.js');

async function buildPages(destDir='.tmp') {
   destDir = path.isAbsolute(destDir) ? destDir : path.resolve(process.cwd(), destDir);

  const dataDir = path.resolve(process.cwd(), endpoints.saveTo)

  const listingFile = `${dataDir}/${endpoints.listFileName}.json`;

  const components = await loadJsonFile(listingFile);

// Building index page
  const promisedIndex = render('component-listing.html', {components})
    .then(html => {
      const dest = `${destDir}/index.html`;
      console.log(`Building ${dest}`);
      return fs.writeAsync(dest, html);
    });

// Building detail page for each component
  const promisedHtml = endpoints.modules.map(name => {
    return loadJsonFile(`${dataDir}/${name}.json`)
      .then(json => {
// Merge listing data to build navigation        
        const context = Object.assign(json, {components});
        return render('component-detail.html', context);
      })
      .then(html => {
        const dest = `${destDir}/${name}.html`;
        console.log(`Building ${dest}`);
        return fs.writeAsync(dest, html);
      });
  });

  promisedHtml.push(promisedIndex);

  await Promise.all(promisedHtml);
}

if (require.main === module) {
  buildPages()
    .catch(err => {
      console.log(err);
    });
}

module.exports = buildPages;