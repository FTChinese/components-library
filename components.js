const fs = require('fs');
const path = require('path');
const modules = require('./module-list.json');
const co = require('co');
const str = require('string-to-stream');
const helper = require('./helper');

const moduleFiles = modules.map(module => path.resolve(__dirname, `data/${module}.json`));

co(function *() {
  const moduleData = yield Promise.all(moduleFiles.map(file => helper.readJson(file)));
  const components = buildData(moduleData);

  str(JSON.stringify(components, null, 4))
    .pipe(fs.createWriteStream('data/components.json'));
})
.then(() => {

}, (e) => {
  console.error(e.stack);
});

function buildData(moduleData) {
  const categories = {
    primitives: [],
    components: [],
    layouts: [],
    utilities: [],
    imagesets: [],
    uncategorised: []
  };
  const titles = Object.keys(categories);

  moduleData.forEach((data) => {
    switch (data.origamiCategory) {
      case 'primitives':
        categories.primitives.push(data);
        break;
      case 'components':
        categories.components.push(data);
        break;

      case 'layouts':
        categories.layouts.push(data);
        break;

      case 'imagesets':
        categories.components.push(data);
        break;

      default:
        categories.uncategorised.push(data);
    }
  });

  return titles.map((title) => {
    return {
      title: title,
      modules: categories[title]
    }
  });
}
