var yargs = require('yargs').argv;
var minifycss = require('gulp-minify-css');
var concat    = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var inject       = require('gulp-inject');
var rename    = require('gulp-rename');
var uglify    = require('gulp-uglify');
var header       = require('gulp-header');
var gulp      = require('gulp');

var widget = yargs.widget;

var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @date - <%= new Date() %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' */',
    ''].join('\n');

var config = require('./config.json');

if (!config[widget]) {
  return false;
}

gulp.task('minifycss', function() {
    return gulp.src(config[widget].css)
        .pipe(concat('rev'+ widget +'.min.css'))
        .pipe(autoprefixer({
            browsers: ['> 1%'],
            cascade: false
        }))
        .pipe(minifycss({keepSpecialComments: 0}))
        .pipe(gulp.dest('./build/files/' + widget));
});

gulp.task('embedcss', ['minifycss'], function () {
    return gulp.src(config[widget].js)
        .pipe(inject(gulp.src(['./build/files/'+ widget +'/*.css']), {
            starttag: '/* inject:css */',
            endtag: '/* endinject */',
            transform: function (filePath, file) {
                return file.contents.toString('utf8');
            }
        }))
        .pipe(rename('rev'+ widget +'.embed.js'))
        .pipe(gulp.dest('./build/files/' + widget));
});

gulp.task('build', ['minifycss', 'embedcss'], function() {
    return gulp.src(config[widget].build)
        .pipe(concat('rev'+ widget +'.pkgd.js'))
        .pipe(gulp.dest('./build/files/' + widget))
        .pipe(uglify({
            mangle: false
            }))
        .pipe(rename('rev'+ widget +'.min.js'))
        .pipe(header(banner, { pkg : config[widget] } ))
        .pipe(gulp.dest('./build'));
});

gulp.task('watch', function () {
    gulp.watch(config[widget].watch, ['build']);
});