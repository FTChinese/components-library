const pify = require('pify');
const path = require('path');
const fs = require('fs-jetpack');
const loadJsonFile = require('load-json-file');
const inline = pify(require('inline-source'));
const nunjucks = require('nunjucks');
nunjucks.configure(process.cwd(), {
  noCache: true,
  watch: false
});
const render = pify(nunjucks.render);

const del = require('del');
const browserSync = require('browser-sync').create();
const cssnext = require('postcss-cssnext');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

const rollup = require('rollup').rollup;
const bowerResolve = require('rollup-plugin-bower-resolve');
const buble = require('rollup-plugin-buble');
let cache;

const publicDir = process.env.PUBLIC_DIR || 'public';

const projectName = 'components-library';

process.env.NODE_ENV = 'development';

// change NODE_ENV between tasks.
gulp.task('prod', function() {
  return Promise.resolve(process.env.NODE_ENV = 'production');
});

gulp.task('dev', function() {
  return Promise.resolve(process.env.NODE_ENV = 'development');
});

function buildPage(template, data) {
  return render(template, data)
    .then(html => {
      if (process.env.NODE_ENV === 'production') {
        return inline(html, {
          compress: true,
          rootpath: path.resolve(process.cwd(), '.tmp')
        });
      }    
      return html;      
    })
    .catch(err => {
      throw err;
    });
}

gulp.task('html', () => {
  return co(function *() {
    const destDir = '.tmp';

    mkdirp.sync(destDir);

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
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.stream({once:true}));
});

gulp.task('scripts', () => {
  return rollup({
    entry: 'client/main.js',
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
      dest: `${publicDir}/scripts/main.js`,
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

gulp.task('clean', function() {
  return del(['.tmp/**']);
});

gulp.task('serve',
  gulp.parallel(
    'html', 'styles', 'scripts',
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
    gulp.watch('client/**/*.js', gulp.parallel('scripts'));
    gulp.watch('client/scss/**/*.scss', gulp.parallel('styles'));
  })
);

gulp.task('build', gulp.series('prod', 'clean', 'styles', gulp.parallel('html', 'scripts'), 'dev'));

const deployDir = path.resolve(__dirname, '../ft-interact/');

gulp.task('deploy:assets', () => {
  const dest = `${deployDir}/${projectName}`;
  return gulp.src('.tmp/**/*')
    .pipe(gulp.dest(dest));
});

gulp.task('deploy:api', () => {
  const dest = `${deployDir}/api`;
  console.log(`Copy api to ${dest}`);
  return gulp.src('api/**')
    .pipe(gulp.dest(dest));
});

gulp.task('deploy:images', () => {
  const dest = `${deployDir}/images`;
  return gulp.src('public/images/*.{svg,png,jpg,gif}')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{cleanupIDs: false}],
      verbose: true
    }))
    .pipe(gulp.dest(dest));
});

gulp.task('deploy', gulp.series('build', gulp.parallel('deploy:assets', 'deploy:api', 'deploy:images')));