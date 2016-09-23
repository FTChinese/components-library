const fs = require('fs');
const path = require('path');
const url = require('url');
const request = require('request-promise-native');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');

const helper = require('./helper');
const moduleNames = require('./module-list.json');

const manifests = [
// `https://raw.githubusercontent.com/FTChinese/${ftc-share}/master/${origami}.json`
// const baseUrl = 'https://raw.githubusercontent.com/FTChinese';
// `https://api.github.com/repos/FTChinese/${moduleName}/tags`
// const tagsUrl = 'https://api.github.com/repos/FTChinese/ftc-share/tags'

	'package',
	'bower',
	'origami'
];


function buildUrls(module) {
	const targetUrls = manifests.map(function(package) {
		return `https://raw.githubusercontent.com/FTChinese/${module}/master/${package}.json`;

	targetUrls.push(`https://api.github.com/repos/FTChinese/${module}/tags`);

	return targetUrls;
}

function buildPath() {
	return moduleNames.map(function(moduleName) {
		return path.resolve(__dirname, 'data', moduleName + '.json');
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
		const targetUrls = buildUrls(moduleName);
		console.log('fetching url:');
		console.log(targetUrls);
// https://developer.github.com/v3/#user-agent-required
// All API requests MUST include a valid User-Agent header.
// Requests with no User-Agent header will be rejected.
// We request that you use your GitHub username,
// or the name of your application, for the User-Agent header value.
// This allows us to contact you if there are problems.
		const options = targetUrls.map((url) => {
			return {
				url: url,
				headers: {
					'User-Agent': 'ftc-component'
				}
			}
		});
		console.log(options);

		try {
			const req = urls.map((url) => {
				return fetchJson(url);
			});
			console.log(req);
			const result = yield fetchJson('https://api.github.com/repos/FTChinese/ftc-footer/tags');
			console.log(result);

			var requestData = yield Promise.all(options.map(request));
			requestData = requestData.map(JSON.parse);
			console.log(requestData);

			const context = buildData(npm, bower, origami);
			console.log(context);

			// const context = buildData(npm, bower, origami, tags);
			// // console.log(context);

			// components.push(context);

			// str(JSON.stringify(context, null, 4))
			// 	.pipe(fs.createWriteStream(`data/${moduleName}.json`));

		} catch (err) {
			console.log(err.stack);
		}
	}
	str(JSON.stringify(components, null, 4))
		.pipe(fs.createWriteStream('data/components.json'));
});
