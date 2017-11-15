import runSequence from 'run-sequence';
import gulp from 'gulp';

gulp.task('default', () => (
	runSequence(
		[
			'icons',
			'copy',
			'styles',
			'templates',
			'scripts:libraries',
			// 'scripts:lint',
			'scripts'
		],
		'server',
		'watch'
	)
));

gulp.task('build', () => (
	runSequence(
		'icons',
		'copy',
		'styles',
		'scripts:libraries',
		'scripts',
		'templates'
	)
));