var gulp         = require('gulp');
var header       = require('gulp-header');
var pkg          = require('./package.json');
var inject       = require('gulp-inject');
var rename       = require('gulp-rename');
var minifycss    = require('gulp-minify-css');
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');
var stripDebug   = require('gulp-strip-debug');

gulp.task('default', ['buildjs']);

gulp.task('minifycss', function() {
    return gulp.src(['./css/revsofia.css'])
        .pipe(concat('revsofia.min.css'))
        .pipe(autoprefixer({
            browsers: ['> 1%'],
            cascade: false
        }))
        .pipe(minifycss({keepSpecialComments: 0}))
        .pipe(gulp.dest('./build'));
});

gulp.task('embedcss', ['minifycss'], function () {
    return gulp.src('./js/revsofia.js')
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

    return gulp.src(['../revcontent-api-showcase-slider-1.0/build/revslider.pkgd.js', './build/revsofia.js'])
        .pipe(concat('revsofia.pkgd.js'))
        .pipe(gulp.dest('./build'))
        .pipe(uglify({
            mangle: false
            }))
        .pipe(stripDebug())
        .pipe(rename('revsofia.min.js'))
        .pipe(header(banner, { pkg : pkg }))
        .pipe(gulp.dest('./build'))
        .pipe(gulp.dest('../../build'));
});

gulp.task('watch', ['buildjs'], function () {
    gulp.watch(['../js/revutils.js', '../js/revdialog.js', '../js/revdetect.js', './js/*', './css/revsofia.css', '../revcontent-api-showcase-slider-1.0/build/revslider.pkgd.js', '../revcontent-api-showcase-slider-1.0/js/*'], ['buildjs']);
});
