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
    return gulp.src(['./css/revshifter.css'])
        .pipe(concat('revshifter.min.css'))
        .pipe(autoprefixer({
            browsers: ['> 1%'],
            cascade: false
        }))
        .pipe(minifycss({keepSpecialComments: 0}))
        .pipe(gulp.dest('./build'));
});

gulp.task('embedcss', ['minifycss'], function () {
    return gulp.src('./js/revshifter.js')
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
      ' * @date - <%= new Date() %>',
      ' * @version v<%= pkg.version %>',
      ' * @link <%= pkg.homepage %>',
      ' */',
      ''].join('\n');

    return gulp.src(['./vendor/mobile-detect/mobile-detect.js', '../js/revutils.js', '../js/revdialog.js', '../js/revdetect.js', '../js/revapi.js', '../revcontent-api-showcase-slider-1.0/build/revslider.pkgd.js',  './build/revshifter.js'])
        .pipe(concat('revshifter.pkgd.js'))
        .pipe(gulp.dest('./build'))
        .pipe(uglify({
            mangle: false
            }))
        .pipe(rename('revshifter.min.js'))
        .pipe(header(banner, { pkg : pkg }))
        .pipe(gulp.dest('./build'))
        .pipe(gulp.dest('../../build'));
});

gulp.task('watch', ['buildjs'], function () {
    gulp.watch(['../js/revutils.js', '../js/revdialog.js', '../js/revdetect.js', './js/*', './css/revshifter.css', '../revcontent-api-showcase-slider-1.0/build/revslider.js', '../revcontent-api-showcase-slider-1.0/js/*'], ['buildjs']);
});
