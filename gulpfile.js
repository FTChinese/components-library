const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const str = require('string-to-stream');

const helper = require('./helper');

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const del = require('del');
const cssnext = require('postcss-cssnext');
const $ = require('gulp-load-plugins')();

const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');

const components = require('./data/components.json');

const modules = [];
components.forEach((group) => {
  group.modules.forEach((module) => {
    modules.push(module);
  });
});

const projectName = 'components';
process.env.NODE_ENV = 'dev';

// change NODE_ENV between tasks.
gulp.task('prod', function(done) {
  process.env.NODE_ENV = 'prod';
  done();
});

gulp.task('dev', function(done) {
  process.env.NODE_ENV = 'dev';
  done();
});

gulp.task('html', () => {
  return co(function *() {
    const destDir = '.tmp';

    if (!isThere(destDir)) {
      mkdirp(destDir, (err) => {
        if (err) console.log(err);
      });
    }

// render `component-listing.html` as index.html
    const indexPage = yield helper.render('component-listing.html', {components: components});

// write `component-listing` as `index.html`
    str(indexPage)
      .pipe(fs.createWriteStream('.tmp/index.html'));

// render all module's detail page
    const details = yield Promise.all(modules.map(function(module) {
      return helper.render('component-detail.html', Object.assign(module, {components: components}));
    }));

// output each detail page.
    modules.forEach(function(module, i) {
      str(details[i])
        .pipe(fs.createWriteStream('.tmp/' + module.moduleName + '.html'));
    });
  })
  .then(function(){
    browserSync.reload('*.html');
  }, function(err) {
    console.error(err.stack);
  });
});

gulp.task('styles', function styles() {
  const DEST = '.tmp/styles';

  return gulp.src('client/scss/main.scss')
    .pipe($.changed(DEST))
    .pipe($.plumber())
    .pipe($.sourcemaps.init({loadMaps:true}))
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['bower_components']
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      cssnext({
        features: {
          colorRgba: false
        }
      })
    ]))
    .pipe($.size({
      gzip: true,
      showFiles: true
    }))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.stream({once:true}));
});

gulp.task('eslint', () => {
  return gulp.src('client/js/*.js')
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

gulp.task('webpack', function(done) {
  if (process.env.NODE_ENV === 'prod') {
    delete webpackConfig.watch;
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin())
  }

  webpack(webpackConfig, function(err, stats) {
    if (err) throw new $.util.PluginError('webpack', err);
    $.util.log('[webpack]', stats.toString({
      colors: $.util.colors.supportsColor,
      chunks: false,
      hash: false,
      version: false
    }))
    browserSync.reload('demo.js');
    done();
  });
});

gulp.task('api', () => {
  return gulp.src('api/*.js')
    .pipe(gulp.dest('.tmp/api'));
});

gulp.task('clean', function() {
  return del(['.tmp/**']);
});

gulp.task('serve',
  gulp.parallel(
    'html', 'styles', 'api', 'webpack',
    function serve() {
    browserSync.init({
      server: {
        baseDir: ['.tmp', 'public'],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    });

    gulp.watch(['views/**/*.html', 'data/*.json'], gulp.parallel('html'));

    gulp.watch('api/*.js', gulp.parallel('api'));

    gulp.watch('client/scss/**/*.scss', gulp.parallel('styles'));
  })
);

gulp.task('build', gulp.series('prod', 'clean', gulp.parallel('html', 'styles', 'webpack'), 'dev'));

const deployDir = '../ft-interact/';

gulp.task('deploy:assets', () => {
  const DEST = path.resolve(__dirname, deployDir, projectName);
  return gulp.src('.tmp/**/*')
    .pipe(gulp.dest(DEST));
});

gulp.task('deploy:api', () => {
  const DEST = path.resolve(__dirname, deployDir, 'api');
  console.log(`Copy api to ${DEST}`);
  return gulp.src('api/**')
    .pipe(gulp.dest(DEST));
});

gulp.task('deploy:images', () => {
  const DEST = path.resolve(__dirname, deployDir, projectName, 'images');
  return gulp.src('public/images/*.{svg,png,jpg,gif}')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}],
      verbose: true
    }))
    .pipe(gulp.dest(DEST));
});

gulp.task('deploy', gulp.series('build', gulp.parallel('deploy:assets', 'deploy:api', 'deploy:images')));
