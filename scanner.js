const fs = require('fs');
const path = require('path');
const url = require('url');
const request = require('request-promise-native');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');

const helper = require('./helper');
const moduleNames = require('./module-list.json');

const manifests = [
	'bower',
	'origami'
];

moduleNames.forEach((moduleName) => {
	co(function *() {
		// const moduleName = 'ftc-share';
		const targetUrls = buildUrls(moduleName);
		const moduleData = {
			moduleName: moduleName,
			keywords: moduleName,
			repoHomeUrl: repoHomeUrl(moduleName),
			isStable: true,
		}
		console.log(targetUrls);

		const options = targetUrls.map(requestOptions);

		var requestData = yield Promise.all(options.map(request));
		var [contentBower, contentOrigami, refTags] = requestData.map(JSON.parse);
		const bower = decodeContent(contentBower);
		const origami = decodeContent(contentOrigami);

		const extracted = extractBower(bower);

		const versions = getVersions(refTags);


		const latest = getLatestStable(versions);
		moduleData.tagName = latest.tagName;

		console.log('requesting: ', latest.tagUrl);
		const latestVersionData = yield request(requestOptions(latest.tagUrl));

		const datetimeCreated = JSON.parse(latestVersionData).tagger.date;
		moduleData.datetimeCreated = datetimeCreated;

		moduleData.versions = versions.map((version) => {
			return version.tagName;
		});

		Object.assign(moduleData, extracted, origami);
		console.log(moduleData);

		str(JSON.stringify(moduleData, null, 4))
			.pipe(fs.createWriteStream(`data/${moduleName}.json`));
	})
	.then(() => {
		console.log('done');
	}, (e) => {
		console.error(e.stack);
	});

});

function buildUrls(module) {
	const targetUrls = manifests.map(function(manifest) {
		return `https://api.github.com/repos/FTChinese/${module}/contents/${manifest}.json`;
	});

	targetUrls.push(`https://api.github.com/repos/FTChinese/${module}/git/refs/tags`);
	return targetUrls;
}

function repoHomeUrl(module) {
	return `https://github.com/FTChinese/${module}`;
}

function requestOptions(url) {
	return {
		url: url,
		headers: {
			'User-Agent': 'ftc-component'
		}
	}
}

function extractBower(bower) {
	var obj = {};

	obj.hasCss = bower.main.indexOf('main.scss') !== -1;
	obj.hasJs = bower.main.indexOf('main.js') !== -1;

	if (bower.dependencies) {
		obj.dependencies = bower.dependencies;
	}
	return obj;
}

function decodeContent(data) {
	const buf = Buffer.from(data.content, data.encoding);
	return JSON.parse(buf.toString());
}

function stripTagName(ref) {
	var tmp = ref.split('/');
  tmp = tmp[tmp.length - 1].replace('v', '');
	return tmp;
}

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
