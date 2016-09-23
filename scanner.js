const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');

const helper = require('./helper');
const moduleNames = require('./module-list.json');

const request = require('request');

// `https://raw.githubusercontent.com/FTChinese/${ftc-share}/master/${origami}.json`
// const baseUrl = 'https://raw.githubusercontent.com/FTChinese';
// `https://api.github.com/repos/FTChinese/${moduleName}/tags`
// const tagsUrl = 'https://api.github.com/repos/FTChinese/ftc-share/tags'

const jsonFiles = [
	'package',
	'bower',
	'origami'
];

// const moduleNames = [
// 	'ftc-icons',
// 	'ftc-share',
// 	'ftc-footer'
// ];

function jsonUrl(moduleName, fileName) {
	return `https://raw.githubusercontent.com/FTChinese/${moduleName}/master/${fileName}.json`
}

function tagsUrl(moduleName) {
	return `https://api.github.com/repos/FTChinese/${moduleName}/tags`;
}
function buildUrl(moduleName) {
	const jsonUrls = jsonFiles.map(function(json) {
		return url.resolve(baseUrl, path.join('FTChinese', moduleName, json));
	});
	return jsonUrls	
}

function buildPath() {
	return moduleNames.map(function(moduleName) {
		return path.resolve(__dirname, 'data', moduleName + '.json');
	});
}

function fetchJson(url) {
	return new Promise(function(resolve, reject) {
		request(url, function(error, response, body) {
			if (error) {
				reject(error)
			} else if (response.statusCode !== 200) {
				reject(response.statusCode);
			} else {
				resolve(JSON.parse(body));
			}
		});
	});
}

function buildData(npm, bower, origami, tags) {
	var context = {};

	context.moduleName = npm.name;
	context.tagName = npm.version;
	context.versions = tags.map((tag) => {
		return tag.name
	});

	context.repoHomeUrl = npm.homepage;
	context.keywords = npm.keywords;
	context.hasCss = bower.main.indexOf('main.scss') !== -1;
	context.hasJs = bower.main.indexOf('main.js') !== -1;

	if (bower.dependencies) {
		context.dependencies = bower.dependencies;
	}
	context = Object.assign(context, origami);

	return context;
}

co(function *() {
	const destDir = '.tmp';
	const components = [];

    if (!isThere(destDir)) {
      mkdirp(destDir, (err) => {
        if (err) console.log(err);
      });
    }

	for (let i = 0; i < moduleNames.length; i++) {
		const moduleName = moduleNames[i];
		// const urls = buildUrl(moduleName);
		const urls = jsonFiles.map((fileName) => {
			return jsonUrl(moduleName, fileName);
		});

		urls.push(tagsUrl(moduleName));

		console.log('fetching url...');
		console.log(urls);
		try {
			const req = urls.map((url) => {
				return fetchJson(url);
			});
			console.log(req);
			const result = yield fetchJson('https://api.github.com/repos/FTChinese/ftc-footer/tags');
			console.log(result);
			// const /*[npm, bower, origami, tags]*/result = yield Promise.all();


			// const context = buildData(npm, bower, origami, tags);
			// // console.log(context);

			// components.push(context);

			// str(JSON.stringify(context, null, 4))
			// 	.pipe(fs.createWriteStream(`data/${moduleName}.json`));

		} catch (err) {
			console.log(err.stack);
		}		
	}

	// str(JSON.stringify(components, null, 4))
	// 	.pipe(fs.createWriteStream('data/components.json'));
});