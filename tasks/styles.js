import gulp from 'gulp';
import plumber from 'gulp-plumber';
import gulpIf from 'gulp-if';
import stylint from 'gulp-stylint';
import stylus from 'gulp-stylus';
import postcss from 'gulp-postcss';
import flexfixes from 'postcss-flexbugs-fixes';
import autoprefixer from 'gulp-autoprefixer';
import gcmq from 'gulp-group-css-media-queries';
import nano from 'gulp-cssnano';
import rename from 'gulp-rename';
import sourcemaps from 'gulp-sourcemaps';
import errorHandler from 'gulp-plumber-error-handler';

import { browsers } from '../package.json';

const isDebug = process.env.NODE_ENV !== 'production';

gulp.task('styles', () => (
	gulp.src('app/styles/*.styl')
		.pipe(plumber({errorHandler: errorHandler(`Error in \'styles\' task`)}))
		.pipe(gulpIf(isDebug, sourcemaps.init()))
		.pipe(stylus({'include css': true}))
		.pipe(autoprefixer(
			'Android >= ' + browsers.android,
			'Chrome >= ' + browsers.chrome,
			'Firefox >= ' + browsers.firefox,
			'Explorer >= ' + browsers.ie,
			'iOS >= ' + browsers.ios,
			'Opera >= ' + browsers.opera,
			'Safari >= ' + browsers.safari
		))
		.pipe(postcss([
			flexfixes()
		]))
		.pipe(gulpIf(!isDebug, gcmq()))
		.pipe(gulpIf(!isDebug, nano({zindex: false, autoprefixer:false})))
		.pipe(rename({suffix: '.min'}))
		.pipe(gulpIf(isDebug, sourcemaps.write()))
		.pipe(gulp.dest('dist/assets/styles'))
));

gulp.task('styles:lint', () => (
	gulp.src(['app/**/*.styl', '!app/styles/**'])
		.pipe(stylint({
			reporter: 'stylint-stylish',
			reporterOptions: {verbose: true}
		}))
		.pipe(stylint.reporter())
		.pipe(stylint.reporter('fail', {failOnWarning: true}))
));