const fs = require('fs-jetpack');
const path = require('path');
const loadJsonFile = require('load-json-file');
const writeJsonFile = require('write-json-file');
const modules = require('./module-list.json');


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
