const fs = require('mz/fs');
const path = require('path');
const url = require('url');
const request = require('request-promise-native');
const got = require('got');
const co = require('co');
const mkdirp = require('mkdirp');
const minimist = require('minimist');
const argv = minimist(process.argv.slice(2), {
  string: ['input'],
  boolean: 'all',
  alias: {
    i: 'input',
    a: 'all'
  }
});

const helper = require('./helper');
const moduleList = require('./module-list.json');

const manifests = [
	'bower',
	'origami'
];

var moduleNames = null;

if (argv.i && moduleList.indexOf(argv.i) !== -1) {
	moduleNames = [argv.i];
} else if (argv.a) {
	moduleNames = moduleList;
} else {
	console.log(`You should provide a module name as listed in "module-list.json"`);
	return;
}

moduleNames.forEach((moduleName) => {
	co(function *() {
		// get the url for bower.json, origami.json and tags
		const targetUrls = buildUrls(moduleName);
		const moduleData = {
			moduleName: moduleName,
			keywords: moduleName,
			repoHomeUrl: repoHomeUrl(moduleName),
			isStable: true,
		}

		// construct request options for `request`
		const options = targetUrls.map(url => {
			return buildOpts(url);
		});

		// Execute `request`
		// var response = yield Promise.all(options.map(option => {
		// 	console.log(`Requesting ${option.url}`);
		// 	return request(option);
		// }));

		var response = yield Promise.all(targetUrls.map(url => {
			return got(url, {
				json: true,
				headers: {
					'User-Agent': 'ftc-component'
				}
			});
		}));

		// Get data from 3 urls
		var [contentBower, contentOrigami, refTags] = response.map(res => {
			return response.body
		});

		const bower = decodeContent(contentBower);
		const origami = decodeContent(contentOrigami);

		// .hasCss, .hasJs, .dependencies
		const extracted = extractBower(bower);

		const versions = getVersions(refTags);

		const latest = getLatestStable(versions);
		moduleData.tagName = latest.tagName;

		console.log('requesting: ', latest.tagUrl);
		// Get data from latest version's url, to get tagged time.
/* Format:
{
  "tagger": {
    "name": "",
    "email": "",
    "date": "2015-10-30T04:09:34Z"
  }
}
*/
		// const latestVersionData = yield request(buildOpts(latest.tagUrl));
		const latestVersionData = yield got(latest.tagUrl, {
			json: true,
			headers: {
				'User-Agent': 'ftc-component'
			}
		});

		const datetimeCreated = latestVersionData.body.tagger.date;
		moduleData.datetimeCreated = datetimeCreated;

		moduleData.versions = versions.map((version) => {
			return version.tagName;
		});

		Object.assign(moduleData, extracted, origami);

		yield fs.writeFile(`data/${moduleName}.json`, JSON.stringify(moduleData, null, 4), 'utf8');
	})
	.then(() => {
		console.log('done');
	}, (e) => {
		console.error(e);
	});

});

/*
 * @param {String} module - A module name
 * @return {Array}
 * @example
 * [
	https://api.github.com/repos/FTChinese/ftc-share/contents/bower.json,
	https://api.github.com/repos/FTChinese/ftc-share/contents/origami.json,
	https://api.github.com/repos/FTChinese/ftc-share/git/refs/tags
 * ]
 */
function buildUrls(module) {
	const targetUrls = manifests.map(function(manifest) {
		return `https://api.github.com/repos/FTChinese/${module}/contents/${manifest}.json`;
	});

	targetUrls.push(`https://api.github.com/repos/FTChinese/${module}/git/refs/tags`);
	return targetUrls;
}
/**
 * @param {String} module - Module name
 * @return {String} - Module's repository url
 * @example https://github.com/FTChinese/ftc-share
 */
function repoHomeUrl(module) {
	return `https://github.com/FTChinese/${module}`;
}

/**
 * Github api requires a request header.
 * @param {String} - The url to request
 */
function buildOpts(url) {
	return {
		url: url,
		headers: {
			'User-Agent': 'ftc-component'
		}
	}
}

/*
 * Github returned content are encoded in base64.
 */
function decodeContent(data) {
	const buf = Buffer.from(data.content, data.encoding);
	return JSON.parse(buf.toString());
}

/*
 * @param {Object} bower - bower.json content
 * @return {Object} - object.hasCss, object.hasJs, object.dependencies.
 */
function extractBower(bower) {
	var obj = {};

	obj.hasCss = bower.main.indexOf('main.scss') !== -1;
	obj.hasJs = bower.main.indexOf('main.js') !== -1;

	if (bower.dependencies) {
		obj.dependencies = bower.dependencies;
	}
	return obj;
}

/*
 * @param {Array} refTags - Returned from `refs/tags`. Each item is an object.
 * @example
   {
    "ref": "refs/tags/v0.0.1",
    "url": "https://api.github.com/repos/FTChinese/ftc-share/git/refs/tags/v0.0.1",
    "object": {
      "sha": "b03db37bff21cf88a1e4a7a1b85db9497be4c437",
      "type": "tag",
      "url": "https://api.github.com/repos/FTChinese/ftc-share/git/tags/b03db37bff21cf88a1e4a7a1b85db9497be4c437"
    }
 */
function getVersions(refTags) {
	return refTags.map((tag) => {
		return {
			tagName: stripTagName(tag.ref),
			type: '',
			isValid: true,
			url: tag.object.url
		};
	}).reverse();
}

function stripTagName(ref) {
	var tmp = ref.split('/');
  tmp = tmp[tmp.length - 1].replace('v', '');
	return tmp;
}

/**
 * @param {Array} versions - simplified `refTags`
 * @return {Object}
 * @return {String} object.tagName - like 0.0.1
 * @return {String} object.tagUrl - This tag's api url. Contains tagged time.
 */
function getLatestStable(versions) {
	var tagName = '';
	var tagUrl = '';
	for (let i = 0; i < versions.length; i++) {
		const currentVersion = versions[i];
		if (!currentVersion.url.match(/alpha|beta/i)) {
			tagName = currentVersion.tagName;
			tagUrl = currentVersion.url;
			break;
		}
	}
	return {
		tagName: tagName,
		tagUrl: tagUrl
	}
}
