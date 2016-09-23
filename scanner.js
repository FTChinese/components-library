const fs = require('fs');
const path = require('path');
const url = require('url');
const request = require('request-promise-native');
const co = require('co');
const str = require('string-to-stream');
const helper = require('./helper');

const manifests = [
	'package',
	'bower',
	'origami'
];

const moduleNames = [
	'ftc-footer'
];

function buildUrls(module) {
	const targetUrls = manifests.map(function(package) {
		return `https://raw.githubusercontent.com/FTChinese/${module}/master/${package}.json`;
	});
	targetUrls.push(`https://api.github.com/repos/FTChinese/${module}/tags`);
	return targetUrls;
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
			// request({
			// 	url: 'https://raw.githubusercontent.com/FTChinese/ftc-footer/master/origami.json',
    	// 	headers: {
			// 		'User-Agent': 'ftc-component'
			// 	}
			// })
			// .then((value) => {
			// 	console.log(value);
			// });
			var requestData = yield Promise.all(options.map(request));
			requestData = requestData.map(JSON.parse);
			console.log(requestData);
			//
			// const context = buildData(npm, bower, origami);
			// console.log(context);
			//
			// str(JSON.stringify(context, null, 4))
			// 	.pipe(fs.createWriteStream('data/' + moduleName + '.json'))
			//
			// const result = yield helper.render('component-detail.html', context);
			//
			// str(result)
			// 	.pipe(fs.createWriteStream('.tmp/' + moduleName + '.html'));

		} catch (err) {
			console.log(err.stack);
		}
	}
});
