var gulp = require('gulp');
var gutil = require('gulp-util');
var zip = require('gulp-zip');
var del = require('del');
var webpackConfig = require('./webpack.config');
var webpack = require('webpack');
var pkg = require('./package.json');

var DIST = './dist'

gulp.task('qext', function () {
	var qext = {
		name: 'Share button',
		type: 'visualization',
		description: pkg.description,
		version: pkg.version,
		icon: 'share',
		preview: 'sharebutton.png',
		keywords: 'qlik-sense, visualization',
		author: pkg.author,
		homepage: pkg.homepage,
		license: pkg.license,
		repository: pkg.repository,
		installer: 'QlikExtensionBundler',
		bundle: {
			id: 'qlik-dashboard-bundle',
			name: 'Qlik Dashboard bundle',
			description: 'This is a set of supported extensions that will facilitate dashboard creation in Qlik Sense: A navigation button, a date picker, a slider, a demand-reporting button, a share button and two different container objects. These can be used in addition to the native objects found under "Charts".\n\nFor limitations and support conditions, see the documentation.'
		},
		dependencies: {
			'qlik-sense': '>=5.5.x'
		}
	};
	if (pkg.contributors) {
		qext.contributors = pkg.contributors;
	}
	var src = require('stream').Readable({
		objectMode: true
	});
	src._read = function () {
		this.push(new gutil.File({
			cwd: '',
			base: '',
			path: pkg.name + '.qext',
			contents: Buffer.from(JSON.stringify(qext, null, 4))
		}));
		this.push(null);
	};
	return src.pipe(gulp.dest(DIST));
});

gulp.task('clean', function(){
  return del([DIST], { force: true });
});

gulp.task('zip-build', function(){
  return gulp.src(DIST + '/**/*')
    .pipe(zip(`${pkg.name}_${pkg.version}.zip`))
    .pipe(gulp.dest(DIST));
});

gulp.task('add-assets', function(){
  return gulp.src('./assets/**/*').pipe(gulp.dest(DIST));
});

gulp.task('webpack-build', done => {
  webpack(webpackConfig, (error, statistics) => {
    const compilationErrors = statistics && statistics.compilation.errors;
    const hasCompilationErrors = !statistics || (compilationErrors && compilationErrors.length > 0);

    console.log(statistics && statistics.toString({ chunks: false, colors: true })); // eslint-disable-line no-console

    if (error || hasCompilationErrors) {
      console.log('Build has errors or eslint errors, fail it'); // eslint-disable-line no-console
      process.exit(1);
    }

    done();
  });
});

gulp.task('build',
  gulp.series('clean', 'webpack-build', 'qext', 'add-assets')
);

gulp.task('zip',
  gulp.series('build', 'zip-build')
);

gulp.task('default',
  gulp.series('build')
);
