const gulp = require('gulp');
const runSequence = require('run-sequence');
const gulpIf = require('gulp-if');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');
const uglify = require('gulp-uglify');
const bs = require('browser-sync').create();
const stylus = require('gulp-stylus');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const postcss = require('gulp-postcss');
const flexfixes = require('postcss-flexbugs-fixes');
const nano = require('gulp-cssnano');

const isDebug = process.env.NODE_ENV !== 'production';
const { PORT, OPEN, TUNNEL } = process.env;
const browsers = require('./package.json')['browsers'];

gulp.task('default', () => runSequence('copy', 'styles', 'scripts', 'server', 'watch'));

gulp.task('styles', () =>
  gulp
    .src('src/*.styl')
    .pipe(plumber())
    .pipe(gulpIf(isDebug, sourcemaps.init()))
    .pipe(stylus())
    .pipe(
      autoprefixer(
        'Android >= ' + browsers.android,
        'Chrome >= ' + browsers.chrome,
        'Firefox >= ' + browsers.firefox,
        'Explorer >= ' + browsers.ie,
        'iOS >= ' + browsers.ios,
        'Opera >= ' + browsers.opera,
        'Safari >= ' + browsers.safari
      )
    )
    .pipe(postcss([flexfixes()]))
    .pipe(nano({ zindex: false, autoprefixer: false }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulpIf(isDebug, sourcemaps.write()))
    .pipe(gulp.dest('dist'))
);

gulp.task('scripts', () => {
  gulp
    .src('src/*.js')
    .pipe(plumber())
    .pipe(babel({ presets: ['env'] }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulpIf(!isDebug, uglify()))
    .pipe(gulp.dest('dist'));
});

gulp.task('server', () =>
  bs.init({
    watchOptions: {
      ignored: 'src/**/*'
    },
    files: ['dist/**/*'],
    open: !!OPEN,
    reloadOnRestart: true,
    port: PORT || 3000,
    snippetOptions: {
      rule: {
        match: /<\/body>/i
      }
    },
    server: {
      baseDir: ['src', 'dist'],
      directory: false
    },
    tunnel: !!TUNNEL
  })
);

gulp.task('copy', () => {
  gulp.src(['src/**/*.*', '!app/*.js', '!app/*.styl']).pipe(gulp.dest('dist'));
});

gulp.task('watch', () => {
  gulp.watch('src/*.html', () => runSequence('copy'));
  gulp.watch('src/*.styl', () => runSequence('styles'));
  gulp.watch('src/*.js', () => runSequence('scripts'));
});

gulp.task('build', () => runSequence('styles', 'scripts'));
