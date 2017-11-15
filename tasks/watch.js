import gulp from 'gulp';
import watch from 'gulp-watch';
import bSync from 'browser-sync';
import runSequence from 'run-sequence';

const bs = bSync.create();

gulp.task('watch', () => {
	global.watch = true;

	watch('app/resources/**/*', () => runSequence('copy', bs.reload));
	watch('app/{styles,blocks}/**/*.styl', () => { runSequence(['styles', 'styles:lint'], () => bs.reload('assets/styles/app.min.css')) });
	watch('app/icons/**/*.svg', () => runSequence('icons', bs.reload));
	watch('app/{pages,blocks}/**/*.jade', () => runSequence('templates', bs.reload));
	watch(['app/scripts/**/*.js', '!app/scripts/libraries/*.js'], () => runSequence('scripts', bs.reload));
	watch('app/scripts/libraries/*.js', () => runSequence('scripts:libraries', bs.reload));
});