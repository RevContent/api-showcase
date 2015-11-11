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
var preprocess   = require('gulp-preprocess');

gulp.task('default', ['build-rx']);

gulp.task('revchimp-css', function() {
    return gulp.src(['./css/revchimp.css'])
        .pipe(concat('revchimp.min.css'))
        .pipe(autoprefixer({
            browsers: ['> 1%'],
            cascade: false
        }))
        .pipe(minifycss({keepSpecialComments: 0}))
        .pipe(gulp.dest('./build'));
});

gulp.task('revexit-css', function() {
    return gulp.src(['./css/revexit.css'])
        .pipe(concat('revexit.min.css'))
        .pipe(autoprefixer({
            browsers: ['> 1%'],
            cascade: false
        }))
        .pipe(minifycss({keepSpecialComments: 0}))
        .pipe(gulp.dest('./build'));
});

gulp.task('revchimp-inject', ['revchimp-css'], function () {
    return gulp.src('./js/revchimp.js')
      .pipe(preprocess({context: {
            CHIMP_PROD_URL: 'https://trends.revcontent.com/rx_subscribe.php?callback=revchimpCallback',
            CHIMP_DEV_URL: 'http://delivery.localhost/rx_subscribe.php?callback=revchimpCallback'
      }}))
      .pipe(inject(gulp.src(['./build/revchimp.min.css']), {
        starttag: '/* inject:css */',
        endtag: '/* endinject */',
        transform: function (filePath, file) {
          return file.contents.toString('utf8')
        }
      }))
      .pipe(gulp.dest('./build'));
});

gulp.task('revexit-inject', ['revexit-css'], function () {
    return gulp.src('./js/revexit.js')
        .pipe(inject(gulp.src(['./build/revexit.min.css']), {
            starttag: '/* inject:css */',
            endtag: '/* endinject */',
            transform: function (filePath, file) {
                return file.contents.toString('utf8')
            }
        }))
        .pipe(gulp.dest('./build'));
});

gulp.task('build-rx', ['revexit-css', 'revchimp-css', 'revchimp-inject', 'revexit-inject'], function() {

    var banner = ['/**',
      ' * <%= pkg.name %> - <%= pkg.description %>',
      ' * @date - <%= new Date() %>',
      ' * @version v<%= pkg.version %>',
      ' * @link <%= pkg.homepage %>',
      ' */',
      ''].join('\n');

    return gulp.src(['./build/revchimp.js', './build/revexit.js'])
        .pipe(concat('revexit.pkgd.js'))
        .pipe(gulp.dest('./build'))
        .pipe(uglify({
            mangle: false
            }))
        .pipe(stripDebug())
        .pipe(rename('revexit.min.js'))
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest('./build'))
        .pipe(gulp.dest('../../build'));
});

gulp.task('watch', function () {
    gulp.watch(['./js/*', './css/*'], ['build-rx']);
});
