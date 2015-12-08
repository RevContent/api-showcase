var gulp      = require('gulp');
var path      = require('path');
var sourcemaps = require('gulp-sourcemaps');
var uglify    = require('gulp-uglify');
var ngAnnotate= require('gulp-ng-annotate');
var concat    = require('gulp-concat');
var minifycss = require('gulp-minify-css');
var gutil     = require('gulp-util');
var rename    = require('gulp-rename');
var notify    = require("gulp-notify");
var autoprefixer = require('gulp-autoprefixer');
var demos          = require('./app/config/demos.json');
var inject       = require('gulp-inject');

var preprocessor = 'sass';

gulp.task('default', ['prefix', 'tests']);

gulp.task('prefix', function() {
    return gulp.src('./app/resources/css/app.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(rename('app.prefixed.css'))
        .pipe(gulp.dest('./app/resources/css'));
});

gulp.task('tests', function() {
    var cdnChecks = {};

    for (var i = 0; i < demos.tests.length; i++) {

        var name = demos.tests[i].name;
        var script = demos.tests[i].script;
        var cdn = demos.tests[i].cdn;
        var cdn_url = demos.tests[i].cdn_url;

        cdnChecks[script] = cdn;

        for (var j = 1; j <= demos.tests[i].count; j++) {

            gulp.src('./tests/templates/default.html')
              .pipe(inject(gulp.src(['./app/resources/js/app/demo/'+ name +'/'+ j +'/description.html', './app/resources/js/app/demo/'+ name +'/'+ j +'/demo.html']), {
                starttag: '<!-- inject:html -->',
                endtag: '<!-- endinject -->',
                transform: function (filePath, file) {
                  return file.contents.toString('utf8')
                }
              }))
              .pipe(inject(gulp.src([script]),{
                transform: function (filePath, file, index, length, targetFile) {
                    path = cdnChecks['.' + filePath] ? cdn_url : filePath;
                    return '<script src="' + path + '"></script>';
                }
              }
              ))
              .pipe(gulp.dest('./tests/' + name + '/' + j ));
        };
    };
    return;
});

gulp.task('tests-files', ['tests'], function() {
    for (var i = 0; i < demos.tests.length; i++) {

        var name = demos.tests[i].name ;

        for (var j = 1; j <= demos.tests[i].count; j++) {

            gulp.src('./tests/index.html')
              .pipe(inject(gulp.src(['./tests/'+ name +'/*', '!./tests/' + name + '/index.html']), {
                starttag: '<!-- inject:html -->',
                endtag: '<!-- endinject -->',
                transform: function (filePath, file) {
                  return '<li><a target="_blank" href="' + filePath + '/default.html">Demo</a></li>';
                }
              }))
              .pipe(gulp.dest('./tests/' + name ));
        };
    };
});

// gulp.task('minifycss', function() {
//     gulp.src('web/css/app.css')
//         .pipe(rename('app.min.css'))
//         .pipe(minifycss({keepSpecialComments: 0}))
//         .pipe(gulp.dest('web/css'));
// });