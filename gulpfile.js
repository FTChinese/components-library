const pify = require('pify');
const path = require('path');
const fs = require('fs-jetpack');

const del = require('del');
const browserSync = require('browser-sync').create();
const cssnext = require('postcss-cssnext');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

const rollup = require('rollup').rollup;
const bowerResolve = require('rollup-plugin-bower-resolve');
const buble = require('rollup-plugin-buble');
let cache;

const buildPages = require('./scan/build-pages.js');

const target = path.resolve(__dirname, '../ft-interact/');
const deployDir = `${target}/${path.basename(__dirname)}`;
const demoDir = path.resolve(__dirname, '.tmp');

const projectName = 'components-library';

process.env.NODE_ENV = 'development';

// change NODE_ENV between tasks.
gulp.task('prod', function() {
  return Promise.resolve(process.env.NODE_ENV = 'production');
});

gulp.task('dev', function() {
  return Promise.resolve(process.env.NODE_ENV = 'development');
});

gulp.task('html', () => {
  return buildPages()
  .then(function(){
    browserSync.reload('*.html');
    return Promise.resolve();
  })
  .catch(err => {
    console.log(err);
  });
});

gulp.task('styles', function styles() {
  const dest = `${demoDir}/styles`;

  return gulp.src('client/scss/main.scss')
    .pipe($.changed(dest))
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
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(dest))
    .pipe(browserSync.stream({once:true}));
});

gulp.task('scripts', () => {
  return rollup({
    entry: 'client/js/main.js',
    plugins: [
      bowerResolve({
// Use `module` field for ES6 module if possible        
        module: true
      }),
// buble's option is no documented. Refer here.
      buble({
        include: ['client/**'],
// FTC components should be released together with a transpiled version. Do not transpile again here.  
        exclude: [
          'bower_components/**',
          'node_modules/**'
        ],
        transforms: {
          dangerousForOf: true
        }
      })
    ],
    cache: cache
  }).then(function(bundle) {
    // Cache for later use
    cache = bundle;

    return bundle.write({
      dest: `${demoDir}/scripts/main.js`,
      format: 'iife',
      sourceMap: true
    });
  })
  .then(() => {
    browserSync.reload();
    return Promise.resolve();
  })
  .catch(err => {
    console.log(err);
  });
});

gulp.task('serve',
  gulp.parallel(
    'html', 'styles', 'scripts',
    function serve() {
    browserSync.init({
      server: {
        baseDir: ['.tmp', 'client']
      }
    });

    gulp.watch(['views/**/*.html', 'public/data/*.json'], gulp.parallel('html'));
    gulp.watch('client/**/*.js', gulp.parallel('scripts'));
    gulp.watch('client/scss/**/*.scss', gulp.parallel('styles'));
  })
);

gulp.task('build', gulp.parallel('html', 'styles', 'scripts'));

// deploy
gulp.task('deploy:assets', () => {
  console.log(`Deploying to ${deployDir}`);
  return gulp.src('.tmp/**/*')
    .pipe(gulp.dest(deployDir));
});

gulp.task('deploy:api', () => {
  const dest = `${target}/api`;
  console.log(`Copy api to ${dest}`);
  return gulp.src('api/**')
    .pipe(gulp.dest(dest));
});

gulp.task('deploy:images', () => {
  console.log(`Deploying images to ${deployDir}`);
  return gulp.src('client/**/*.{svg,png,jpg,gif}')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}],
      verbose: true
    }))
    .pipe(gulp.dest(deployDir));
});

gulp.task('deploy', gulp.series('build', gulp.parallel('deploy:assets', 'deploy:api', 'deploy:images')));