import gulp from 'gulp';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import gulpIf from 'gulp-if';
import plumber from 'gulp-plumber';
import eslint from 'gulp-eslint';
import babel from 'babelify';
import browserify from 'browserify';
import errorHandler from 'gulp-plumber-error-handler';

const isDebug = process.env.NODE_ENV !== 'production';

gulp.task('scripts', () => {
	let bundler = browserify('app/scripts/app.js', {debug: true});
	return bundler
		.bundle()
		.on('error', function(err) {console.error(err); this.emit('end');})
		.pipe(source('app.min.js'))
		.pipe(buffer())
		.pipe(gulpIf(!isDebug, uglify()))
		.pipe(gulp.dest('dist/assets/scripts'));
});

// gulp.task('scripts:lint', () => {
// 	gulp.src(['app/scripts/**/*.js', '!app/scripts/libraries/*.js'])
// 		.pipe(plumber({errorHandler: errorHandler(`Error in \'scripts\' task`)}))
// 		.pipe(eslint())
// 		.pipe(eslint.format());
// });

gulp.task('scripts:libraries', () => {
	gulp.src('app/scripts/libraries/*.js')
		.pipe(gulp.dest('dist/assets/scripts'));
});