const crawl = require('./crawl.js');
const categorise = require('./categorise.js');
const buildPages = require('./build-pages.js');

async function scan() {
  try {
    await crawl();
    await categorise();
    await buildPages();
  } catch(e) {
    throw e
  }
}

if (require.main === module) {
  scan()
    .catch(err => {
      console.log(err);
    });
}