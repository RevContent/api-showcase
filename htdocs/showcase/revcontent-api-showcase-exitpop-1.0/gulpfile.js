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
var pump      = require('pump');
var notify    = require("gulp-notify");
const fs      = require('fs');

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
    return gulp.src(['./css/revexit.css', '../css/revdialog.css'])
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
            CHIMP_PROD_URL: process.env.CHIMP_PROD_URL || 'https://trends.revcontent.com/rx_subscribe.php?callback=revchimpCallback',
            CHIMP_DEV_URL: process.env.CHIMP_DEV_URL || 'http://delivery.localhost/rx_subscribe.php?callback=revchimpCallback'
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

gulp.task('revexit-jquery', function () {
    return gulp.src('./js/jquery-1.11.3.js')
        .pipe(gulp.dest('./build'))
        .pipe(uglify({
            mangle: false
        }))
        .pipe(stripDebug())
        .pipe(rename('jquery-1.11.3.min.js'))
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

gulp.task('build-rx', ['revexit-css', 'revchimp-css', 'revchimp-inject', 'revexit-inject', 'revexit-jquery'], function(cb) {

    var src = ['../js/revutils.js', '../js/revbeacon.js', '../js/revapi.js', '../js/revdialog.js', './js/jquery-1.11.3.js', './build/revchimp.js', './build/revexit.js'];

    var missingFiles = [];
    src.forEach(function(file) {
        try {
            !fs.statSync(file).isFile();
        } catch(e) {
            missingFiles.push(file);
        }
    });

    if (missingFiles.length) {
        console.log('\x1b[31m ', 'Missing Files! ' + missingFiles, '\x1b[0m');
        return;
    }

    var banner = ['/**',
      ' * <%= pkg.name %> - <%= pkg.description %>',
      ' * @date - <%= new Date() %>',
      ' * @version v<%= pkg.version %>',
      ' * @link <%= pkg.homepage %>',
      ' */',
      ''].join('\n');

      pump([
            gulp.src(src),
            concat('revexit.pkgd.js'),
            gulp.dest('./build'),
            uglify({
                mangle: false
            }).on('error', function (err) {
                var fileArr = err.fileName.split('/');
                var messageArr = err.message.split(': ');
                notify().write(fileArr[fileArr.length - 1] + ' Line: ' + err.lineNumber + ' ' + messageArr[messageArr.length - 1]);
                this.emit('end');
            }),
            stripDebug(),
            rename('revexit.min.js'),
            header(banner, { pkg : pkg } ),
            gulp.dest('./build'),
            gulp.dest('../../build')
        ],
        cb
      );
});

gulp.task('watch', function () {
    gulp.watch(['./js/*', './css/*'], ['build-rx']);
});
