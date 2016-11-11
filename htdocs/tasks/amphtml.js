var yargs        = require('yargs').argv;
var minifycss    = require('gulp-minify-css');
var concat       = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var inject       = require('gulp-inject');
var rename       = require('gulp-rename');
var uglify       = require('gulp-uglify');
var header       = require('gulp-header');
var gulp         = require('gulp');
var pump         = require('pump');
var notify       = require("gulp-notify");
var sass         = require('gulp-sass');

gulp.task('amphtml', [], function() {

    var banner = ['/**',
        ' * Revcontent - AMPHTML Network Service',
        ' * @date - <%= new Date() %>',
        ' * @version v1.1.0',
        ' * @link http://labs.revcontent.com',
        ' */',
        ''].join('\n');

    return gulp.src(['./js/amphtml/revcontent.amp.js'])
        .pipe(inject(gulp.src(['./css/amphtml/revcontent.amp.css']).pipe(minifycss({keepSpecialComments: 0})), {
            starttag: '/* inject:css */',
            endtag: '/* endinject */',
            transform: function (filePath, file) {
                return file.contents.toString('utf8');
            }
        }))
        
        .pipe(rename('revcontent.amp.bundled.js'))
        .pipe(gulp.dest('./build/amphtml'))
        .pipe(uglify({
            mangle: false
        }))
        .pipe(rename('revcontent.amp.min.js'))
        .pipe(header(banner, {} ))
        .pipe(gulp.dest('./build/amphtml'));
});