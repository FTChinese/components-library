const path = require('path');
const loadJsonFile = require('load-json-file');
const writeJsonFile = require('write-json-file');
const endpoints = require('./endpoints.js');

const categories = [
  {
    title: "primitives"
  },
  {
    title: "components"
  },
  {
    title: "layouts"
  },
  {
    title: "utilities"
  },
  {
    title: "imagesets"
  },
  {
    title: "uncategorised"
  }
];

const keysToRemove = ['versions', 'brower_features', 'demos'];

async function categorise(sourceDir = endpoints.saveTo) {
  const destDir = path.isAbsolute(sourceDir) ? sourceDir : path.resolve(process.cwd(), sourceDir);

  const stats = await Promise.all(endpoints.modules.map(name => {
    const filepath = path.resolve(process.cwd(), `${sourceDir}/${name}.json`);
    return loadJsonFile(filepath);
  }));

  const statsByCategory = stats.reduce((o, stat) => {
    const key = stat.origami_category ? stat.origami_category : 'uncategorised';
    console.log(`Categorise ${stat.module_name} to ${key}`);
    
    keysToRemove.forEach(key => {
      delete stat[key];
    });

    if (o.hasOwnProperty(key)) {
      o[key].push(stat);
    } else {
      o[key] = [stat];
    }
    return o;
  }, {});

  await writeJsonFile(`${destDir}/component-by-category.json`, statsByCategory);

  const groups = categories.map(category => {
    const id = category.title;
    if (statsByCategory.hasOwnProperty(id)) {
      category.modules = statsByCategory[id];
    } else {
      category.modules = null;
    }
    return category;
  });

  await writeJsonFile(`${destDir}/component-listing.json`, groups);
}

if (require.main === module) {
  categorise()
    .catch(err => {
      console.log(err);
    });
}

module.exports = categorise;