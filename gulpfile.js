'use strict';

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var ifElse = require('gulp-if-else');


gulp.task('javascript', function() {
    // set up the browserify instance on a task basis
    var b = browserify({
        entries: './index.js',
        debug: true
    })


    return b.bundle()
    .pipe(source('app.js'))
    .pipe(gulp.dest('./app'));
});

gulp.task('watch', function() {
    gulp.watch('./*.js', ['javascript']);
});
