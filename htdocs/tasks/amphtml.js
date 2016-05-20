var rename    = require('gulp-rename');
var uglify    = require('gulp-uglify');
var stripDebug   = require('gulp-strip-debug');
var header       = require('gulp-header');
var gulp      = require('gulp');

gulp.task('amphtml', [], function() {

    var banner = ['/**',
        ' * Revcontent - AMPHTML Network Service',
        ' * @date - <%= new Date() %>',
        ' * @version v1.0.0',
        ' * @link http://labs.revcontent.com',
        ' */',
        ''].join('\n');

    return gulp.src(['./js/amphtml/revcontent.amp.js'])
        .pipe(uglify({
            mangle: false
        }))
        .pipe(stripDebug())
        .pipe(rename('revcontent.amp.min.js'))
        .pipe(header(banner, {} ))
        .pipe(gulp.dest('./build/amphtml'));
});