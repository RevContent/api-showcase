var gulp         = require('gulp');
var header       = require('gulp-header');
var pkg          = require('./package.json');
var inject       = require('gulp-inject');
var rename       = require('gulp-rename');
var minifycss    = require('gulp-minify-css');
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('default', ['buildjs']);

gulp.task('minifycss', function() {
    return gulp.src(['./vendor/flickity/css/flickity.css', './css/revflicker.css', '../css/revdialog.css'])
        .pipe(concat('revflicker.min.css'))
        .pipe(autoprefixer({
            browsers: ['> 1%'],
            cascade: false
        }))
        .pipe(minifycss({keepSpecialComments: 0}))
        .pipe(gulp.dest('./build'));
});

gulp.task('embedcss', ['minifycss'], function () {
    return gulp.src('./js/revflicker.js')
      .pipe(inject(gulp.src(['./build/*.css']), {
        starttag: '/* inject:css */',
        endtag: '/* endinject */',
        transform: function (filePath, file) {
          return file.contents.toString('utf8')
        }
      }))
      .pipe(gulp.dest('./build'));
});

gulp.task('buildjs', ['minifycss', 'embedcss'], function() {

    var banner = ['/**',
      ' * <%= pkg.name %> - <%= pkg.description %>',
      ' * @version v<%= pkg.version %>',
      ' * @link <%= pkg.homepage %>',
      ' */',
      ''].join('\n');

    return gulp.src(['./vendor/flickity/dist/flickity.pkgd.js', './vendor/mobile-detect/mobile-detect.js', './js/revutils.js', '../js/revdialog.js', './js/revdetect.js', './js/revapi.js', './build/revflicker.js'])
        .pipe(concat('revflicker.pkgd.js'))
        .pipe(gulp.dest('./build'))
        .pipe(uglify({
            mangle: false
            }))
        .pipe(rename('revflicker.min.js'))
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest('./build'))
        .pipe(gulp.dest('../../build'));
});

gulp.task('watch', function () {
    gulp.watch(['./js/*', './css/*', './vendor/flickity/dist/flickity.pkgd.js'], ['buildjs']);
});
