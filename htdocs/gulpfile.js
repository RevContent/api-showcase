var gulp      = require('gulp');
var fs        = require('fs');
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

function getFolders(dir) {
    return fs.readdirSync(dir)
      .filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
      });
}

gulp.task('tests', function() {
    var data = {};

    for (var i = 0; i < demos.tests.length; i++) {
        var name = demos.tests[i].name;
        var folders = getFolders('./app/resources/js/app/demo/' + name);
        var script = demos.tests[i].script;

        data[name] = {
          use_cdn: demos.tests[i].cdn,
          url: demos.tests[i].cdn_url,
        };

        for (var j = 1; j <= folders.length; j++) {

            var src = ['./tests/templates/default.html'].concat(demos.tests[i].templates);

            for (var k = 0; k < src.length; k++) {
              gulp.src(src[k])
                .pipe(inject(gulp.src(['./app/resources/js/app/demo/'+ name +'/'+ j +'/description.html', './app/resources/js/app/demo/'+ name +'/'+ j +'/demo.html']), {
                  starttag: '<!-- inject:html -->',
                  endtag: '<!-- endinject -->',
                  transform: function (filePath, file) {
                    return file.contents.toString('utf8')
                  }
                }))
                .pipe(inject(gulp.src(script), {
                  transform: function (filePath, file) {
                    var parts = filePath.split('/');
                    var widget = parts[parts.length - 1].replace('rev', '').replace('.min.js', '');//holy hack again

                    var path = data[widget].use_cdn ? data[widget].url : filePath;
                    return '<script src="' + path + '"></script>';
                  }
                }
                ))
                .pipe(gulp.dest('./tests/' + name + '/' + j ));
            };
        }
    }
    return;
});

gulp.task('tests-files', ['tests'], function() {
    var data = {};

    for (var i = 0; i < demos.tests.length; i++) {
        var name = demos.tests[i].name;
        var folders = getFolders('./app/resources/js/app/demo/' + name);

        data[name] = {
          folders: folders,
          templates: ['./tests/templates/default.html'].concat(demos.tests[i].templates)
        };

        gulp.src('./tests/index.html')
          .pipe(inject(gulp.src(['./tests/'+ name, '!./tests/' + name + '/index.html']), {
            starttag: '<!-- inject:html -->',
            endtag: '<!-- endinject -->',
            transform: function (filePath, file) {
              var parts = filePath.split('/');
              var widget = parts[parts.length - 1];
              var folders = data[widget].folders;
              var templates = data[widget].templates;
              var html = '';

              for (var j = 0; j < templates.length; j++) {
                var templateName = templates[j].replace('./tests/templates/', '').replace('.html', '');//holy hack
                html += '<li><h5>'+ templateName +'</h5></li>';
                html += '<li style="list-style:none;"><ol>';
                for (var k = 0; k < folders.length; k++) {
                  var index = k + 1;
                  html += '<li><a target="_blank" href="/tests/' + widget + '/' + index + '/' + templateName + '.html">Demo</a></li>';
                };
                html += '</ol></li>';
              };

              return html;
            }
          }))
          .pipe(gulp.dest('./tests/' + name ));
    };
});

// gulp.task('minifycss', function() {
//     gulp.src('web/css/app.css')
//         .pipe(rename('app.min.css'))
//         .pipe(minifycss({keepSpecialComments: 0}))
//         .pipe(gulp.dest('web/css'));
// });