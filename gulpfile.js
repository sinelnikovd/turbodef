"use strict";

var gulp = require('gulp'),
		pug = require('gulp-pug'),
		sass = require('gulp-sass'),
		concat = require('gulp-concat'),
		plumber = require('gulp-plumber'),
		autoprefixer = require('gulp-autoprefixer'),
		sourcemaps = require('gulp-sourcemaps'),
		imagemin = require('gulp-imagemin'),
		browserSync = require('browser-sync').create(),
		reload = browserSync.reload;

var useref = require('gulp-useref'),
		gulpif = require('gulp-if'),
		cssmin = require('gulp-clean-css'),
		uglify = require('gulp-uglify'),
		rimraf = require('rimraf'),
		notify = require('gulp-notify'),
		ftp = require('vinyl-ftp');


var spritesmith = require('gulp.spritesmith');

var paths = {
			src: 'src/',
			dev: 'dev/',
			build: 'build/'
		};


/*********************************
		Developer tasks
*********************************/

//pug compile
gulp.task('pug', function() {
	return gulp.src([paths.src + '*.pug', '!' + paths.src + '_base.pug' ])
		.pipe(plumber({errorHandler: notify.onError()}))
		.pipe(pug({pretty: true}))
		.pipe(gulp.dest(paths.dev));
});

//sass compile
gulp.task('sass', function() {
	return gulp.src(paths.src + 'main.sass')
		.pipe(plumber({errorHandler: notify.onError()}))
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 10 versions'],
			cascade: true
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(paths.dev + 'css/'))
		.pipe(browserSync.stream());
});

//js compile
gulp.task('scripts', function() {
	return gulp.src([
			paths.src + '**/*.js',
			'!' + paths.src + '_assets/**/*.js'
		])
		.pipe(concat('main.js'))
		.pipe(gulp.dest(paths.dev + 'js/'));
});

//sprite compile
gulp.task('sprite', function() {
	 var spriteData = gulp.src(paths.src + 'sprite/*.png')
	.pipe(spritesmith({
		imgName: 'sprite.png',
		cssName: 'sprite.sass',
		imgPath: '../image/sprite.png',
		cssSpritesheetName: 'icon',
		cssVarMap: function (sprite) {
			sprite.name = 'icon_' + sprite.name;
		}
	}))

	var imgStream = spriteData.img
		.pipe(gulp.dest(paths.dev + 'image/'));

	var cssStream = spriteData.css
		.pipe(gulp.dest(paths.src + '_base/'));

});


//watch
gulp.task('watch', function() {
	gulp.watch(paths.src + '**/*.pug', ['pug']);
	gulp.watch(paths.src + '**/*.sass', ['sass']);
	gulp.watch(paths.src + '**/*.js', ['scripts']);
	gulp.watch(paths.src + 'sprite/*.png', ['sprite']);
});

//server
gulp.task('browser-sync', function() {
	browserSync.init({
		port: 3000,
		server: {
			baseDir: paths.dev
		}
	});

	gulp.watch([paths.dev + '**/*.*', '!' + paths.dev + 'css/**/*.*']).on("change", reload);

});


/*********************************
		Production tasks
*********************************/

//clean
gulp.task('clean', function(cb) {
	rimraf(paths.build, cb);
});

//css + js
gulp.task('cssjsbuild', ['clean'], function () {
	return gulp.src(paths.dev + '*.html')
		.pipe( useref() )
		.pipe( gulpif('*.js', uglify()) )
		.pipe( gulpif('*.css', cssmin()) )
		.pipe( gulp.dest(paths.build) );
});

//copy images to outputDir
gulp.task('imgBuild', ['clean'], function() {
	return gulp.src(paths.dev + 'image/**/*.*')
		.pipe(imagemin())
		.pipe(gulp.dest(paths.build + 'image/'));
});

//copy fonts to outputDir
gulp.task('fontsBuild', ['clean'], function() {
	return gulp.src(paths.dev + 'fonts/**/*.*')
		.pipe(gulp.dest(paths.build + 'fonts/'));
});

//ftp
gulp.task('send', function() {
	var conn = ftp.create({
		host:     'sinelnikovd.ru',
		user:     'sinelnikovd',
		password: 'pass',
		parallel: 5
	});

	/* list all files you wish to ftp in the glob variable */
	var globs = [
		'build/**/*',
		'!node_modules/**' // if you wish to exclude directories, start the item with an !
	];

	return gulp.src( globs, { base: '.', buffer: false } )
		.pipe( conn.newer( '/' ) ) // only upload newer files
		.pipe( conn.dest( '/' ) )
		.pipe(notify("Dev site updated!"));

});


//default
gulp.task('default', ['browser-sync', 'watch', 'pug', 'sprite', 'sass', 'scripts']);

//production
gulp.task('build', ['cssjsbuild', 'imgBuild', 'fontsBuild']);