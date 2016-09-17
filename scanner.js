const fs = require('fs');
const path = require('path');
const url = require('url');
const request = require('request');
const co = require('co');
const str = require('string-to-stream');
const helper = require('./helper');

const baseUrl = 'https://raw.githubusercontent.com/FTChinese';

const jsonFiles = [
	'master/package.json',
	'master/bower.json',
	'master/origami.json'
];

const moduleNames = [
	'ftc-footer'
];

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

function buildData(npm, bower, origami) {
	var context = {};

	context.moduleName = npm.name;
	context.tagName = npm.version;
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

	for (let i = 0; i < moduleNames.length; i++) {
		const moduleName = moduleNames[i];
		const urls = buildUrl(moduleName);
		console.log('fetching url...');
		console.log(urls);
		try {

			const [npm, bower, origami] = yield Promise.all(urls.map(fetchJson));

			const context = buildData(npm, bower, origami);
			console.log(context);

			str(JSON.stringify(context, null, 4))
				.pipe(fs.createWriteStream('data/' + moduleName + '.json'))

			const result = yield helper.render('component-detail.html', context);

			str(result)
				.pipe(fs.createWriteStream('.tmp/' + moduleName + '.html'));

		} catch (err) {
			console.log(err.stack);
		}		
	}
});