const fs = require('fs');
const path = require('path');
const url = require('url');
const request = require('request');
const co = require('co');
const str = require('string-to-stream');
const helper = require('./helper');

const moduleNames = [
	'ftc-share',
	'ftc-footer'
];

function buildPath() {
	return moduleNames.map(function(moduleName) {
		return path.resolve(__dirname, 'data', moduleName + '.json');
	});
}

co(function *() {
	const jsonPath = buildPath();
	console.log(jsonPath);
	const components = yield Promise.all(jsonPath.map(helper.readJson));
	const context = {components: components};

	const [index, nav] = yield Promise.all([
		helper.render('component-listing.html', context),
		helper.render('component-nav.html', context)
	]);

	str(index)
		.pipe(fs.createWriteStream('.tmp/index.html'));
	str(nav)
		.pipe(fs.createWriteStream('.tmp/nav.html'));
	str(JSON.stringify(components, null, 4))
		.pipe(fs.createWriteStream('data/components.json'));
})
.then(function() {

}, function(err) {
	console.log(err.stack);
});