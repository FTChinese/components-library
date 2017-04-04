const crawl = require('./crawl.js');
const categorise = require('./categorise.js');

async function scan() {
  await crawl();
  await categorise();
}

if (require.main === module) {
  scan()
    .catch(err => {
      console.log(err);
    });
}