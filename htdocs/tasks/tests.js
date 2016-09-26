var inject = require('gulp-inject');
var concat = require('gulp-concat');
var path = require('path');
var fs = require('fs');
var rename    = require('gulp-rename');
var gulp = require('gulp');

var demos = require('../app/config/demos.json');

function getFolders(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory() && file !== "mockup";
      });
  } catch(e) {
    return [];
  }
}

gulp.task('tests', function() {
    for (var i = 0; i < demos.tests.length; i++) {
        var name = demos.tests[i].name;
        var folders = getFolders('./app/resources/js/app/demo/' + name);

        for (var j = 1; j <= folders.length; j++) {

          var src = ['./tests/templates/default.html'].concat(demos.tests[i].templates);

            for (url in demos.urls) {

              for (var k = 0; k < src.length; k++) {
                injectTests({
                  name: name,
                  read_demo: demos.tests[i].read_demo,
                  script_id: demos.tests[i].script_id ? demos.tests[i].script_id : '',
                  script: demos.tests[i].script,
                  has_script: demos.tests[i].has_script,
                  url: url,
                  urlPath: demos.urls[url],
                  src: src[k],
                  folder: j
                });
              }
            }
        }
    }
    return;
});

function injectTests(data) {

  gulp.src(data.src)
    .pipe(inject(gulp.src(['./app/resources/js/app/demo/'+ data.name +'/'+ data.folder +'/demo.html']), {
      starttag: '<!-- inject:html -->',
      endtag: '<!-- endinject -->',
      transform: function (filePath, file) {
        if (data.read_demo) {
          return '';
        }
        return file.contents.toString('utf8');
      }
    }))
    .pipe(inject(gulp.src(data.script), {
      transform: function (filePath, file) {

        var script = '';
        var path = data.urlPath + filePath;

        if (data.read_demo) {
          var file = fs.readFileSync('./app/resources/js/app/demo/' + data.name + '/' + data.folder +'/demo.html', 'utf8');
          //split on scripts if they are needed and pop the last string to append, remove any new lines
          var scriptParamsArr = file.split('</script>'); // split on the script

          if (data.has_script) {
            var script = scriptParamsArr[0]; // output the script if there is one
            script = script + '</script>';
          }

          var params = scriptParamsArr.pop().replace(/(\r\n|\n|\r)/gm,"");

          path += params;
        }

        return script + '<script type="text/javascript" id="'+ data.script_id +'" src="' + path + '"></script>';
      }
    }
    ))
    .pipe(gulp.dest('./tests/' + data.name + '/' + data.url + '/' + data.folder ));
}

gulp.task('tests-files', ['tests'], function() {

    demos.urls.index = 'index';

    for (var i = 0; i < demos.tests.length; i++) {
        var name = demos.tests[i].name;
        var folders = getFolders('./app/resources/js/app/demo/' + name);

        for (url in demos.urls) {
          injectFiles({
            name: name,
            folders: folders,
            url: url,
            templates: ['./tests/templates/default.html'].concat(demos.tests[i].templates)
          })
        }
    };
});

function injectFiles(data) {
  gulp.src('./tests/index.html')
    .pipe(inject(gulp.src(['./tests/'+ data.name, '!./tests/' + data.name + '/index.html']), {
      starttag: '<!-- inject:html -->',
      endtag: '<!-- endinject -->',
      transform: function (filePath, file) {
        var parts = filePath.split('/');
        var widget = parts[parts.length - 1];
        var templates = data.templates;
        var html = '';

        for (u in demos.urls) {
          if (u != 'index') {
            html += '<a href="/tests/'+ widget +'/' + u +'.html" id="'+ u +'-button" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">' + u + '</a>';
          }
        }

        if (data.url == 'index') { // index only shows env links
          return html;
        }

        html += '<ul>';

        for (var j = 0; j < templates.length; j++) {
          var templateName = templates[j].replace('./tests/templates/', '').replace('.html', '');//holy hack

          html += '<li><h5>'+ templateName +'</h5></li>';
          html += '<li style="list-style:none;"><ol>';

          for (var k = 0; k < data.folders.length; k++) {
            var index = k + 1;

            var fileContent = fs.readFileSync("./app/resources/js/app/demo/" + widget + '/' + index + '/description.html', "utf8");
            var fileContentArr = fileContent.split("-->\n");

            var demoName = 'Demo';
            var demoDescription = '';

            if (fileContentArr[0] && fileContentArr[0].substr(0, 4) == '<!--') {
              demoName = fileContentArr[0].substr(5).trim();
            }

            if (fileContentArr[1] && fileContentArr[1].substr(0, 4) == '<!--') {
              demoDescription = ': ' + fileContentArr[1].substr(5).trim();
            }

            html += '<li><a target="_blank" href="/tests/' + widget + '/' + data.url + '/' + index + '/' + templateName + '.html">'+ demoName +'</a>'+ demoDescription +'</li>';
          };
          html += '</ol></li>';
        };

        var mockups = getFolders('./app/resources/js/app/demo/' + widget + '/mockup');

        for (var k = 0; k < mockups.length; k++) {
          var name = mockups[k];
          html += '<li><h5>'+ name +'</h5></li>';
          html += '<li style="list-style:none;"><ol>';
          html += '<li><a target="_blank" href="/app/resources/js/app/demo/'+ widget +'/mockup/'+ name +'/'+ name +'.html">Demo</a></li>';
          html += '</ol></li>';
        }

        html += '</ul>';

        return html;
      }
    }))
    .pipe(rename(data.url + '.html'))
    .pipe(gulp.dest('./tests/' + data.name ));
}