# API Showcase

The API Showcase provides examples of what's possible with the Revcontent API. To see the latest running build,
please visit [http://labs.revcontent.com](http://labs.revcontent.com)

### Installing Dependencies

You must have a healty build environment in order to begin development on showcase labs.

#### NPM
Install node packages.

```
npm install
```

#### Bower
Bower packages are kept in the ```/htdocs/vendor``` directory and committed to source control. To install bower packages navigate to the project root and run ```bower install```, update with ```bower update```.

## The Widgets

The following API widget packages are under active development. The core source files are located under the htdocs/showcase directory inside the project root.

```
api-showcase/htdocs/showcase git:(develop)] ls

revcontent-api-showcase-amp-1.0
revcontent-api-showcase-exitpop-1.0
revcontent-api-showcase-flicker-1.0
revcontent-api-showcase-image-1.0
revcontent-api-showcase-more-1.0
revcontent-api-showcase-shifter-2.0
revcontent-api-showcase-slider-1.0
revcontent-api-showcase-solo-serve-1.0
revcontent-api-showcase-toaster-1.0
```

### Future Widgets

```
revcontent-api-showcase-instream-1.0
revcontent-api-showcase-endofgallery-1.0
revcontent-api-showcase-scrollingexp-1.0

```

### Legacy or Inactive Widgets

```
revcontent-api-showcase-shifter-1.0 
revcontent-api-showcase-revmore-1.0

```

### Gulp build/watch

Gulp tasks are located in the htdocs/tasks folder and use the config.json file. During development it is useful to ```watch``` the widget you are working on. This is done using the ```gulp watch --{widget}``` command where ```{widget}``` is the name of the widget to watch. The watch command monitors the files under the ```watch``` config in config.json for changes. When a change occurs it builds the appropriate files into the htdocs/build and htdocs/build/files directories. 

If your widget relies on another widget such as RevSlider it can be useful to watch both widgets at the same time in separate console tabs, when there is a change to RevSlider the dependent widget will also be built.

The Gulp build task is similar to the watch command and is run using ```gulp build --{widget}```. This is the same task that is run when the watch command detects a change. Use this when you want to build without watching for changes. All files under the ```build`` config in config.json will be used to create the minified and packaged files. CSS/Sass will also be injected.

#### Available widgets for {widget} option include: 

* flicker (RevFlicker)
* more (RevMore)
* more-standard (RevMore Standard)
* shifter (RevShifter)
* slider (RevSlider)
* toaster (RevToaster)
* image (RevImage)
* soloserve (RevSoloServe)

##### Examples

```
gulp build --widget=flicker
```

```
gulp watch --widget=flicker
```

#### AMPHTML Service

Google's **AMP** Helper service is maintained and built here. We have 2 Git repositories, one on Stash and the other on Github.
#### Build or "Dist" Files

Build files necessary for production use are outputted to the htdocs/build directory.

```
amphtml/           
     revcontent.amp.min.js
revexit.min.js
revflicker.min.js
revimage.min.js
revmore-standard.min.js
revmore.min.js
revshifter.min.js
revslider.min.js
revsoloserve.min.js
revtoaster.min.js
```

## Testing

Bundled tests are distributed to the tests/folder during the build process. And use the /htdocs/app/config/demos.json config file and code from /htdocs/app/resources/js/app/demo/{widget} directories. Specific site templates are held in the /htdocs/tests/templates directory.

### Building Tests

Run ```gulp tests-files``` in order to build the test files into /htdocs/tests/{widget} directories. For each of template listed in /htdocs/app/config/demos.json and demo in /htdocs/app/resources/js/app/demo/{widget} a file will be added to the /htdocs/tests/{widget} directories.

## License

```
This source file is closed source, strictly confidential and
proprietary to Revcontent Inc. Viewing the contents of this file binds the
viewer to the NDA agreement  available by Revcontent Inc. Electronic
transfer of this file outside of the Revcontent corporate network is
strictly prohibited. Questions, comments or concerns should be directed to
compliance@revcontent.com
```
