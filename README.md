# API Showcase

The API Showcase provides examples of what's possible with the Revcontent API. To see the latest running build,
please visit [http://labs.revcontent.com](http://labs.revcontent.com)

## Requirements

To get up and running with Showcase Labs, learn about the following technologies involved before diving in. A majority
of these technologies are already apart of your daily workflow.

* LAMP/WAMP/XAMP Stack
* Angular JS (https://angularjs.org)
* NPM (https://www.npmjs.co/)
* Gulp (http://gulpjs.com)
* Bower (http://bower.io)
* Git (https://git-scm.com)

## Getting Started

1. Git Clone the latest DEVELOP branch of api-showcase into a workspace.
2. Setup a Virtual Host pointing to your api-showcase/htdocs directory (i.e http://api-showcase.localhost).
3. Install NPM Dependencies in htdocs folder. (npm install)
4. Install Bower Dependencies in htdocs folder. (bower install)
5. Open Webrowser and run http://api-showcase.localhost (or whatever vhost you established in Step #2)
6. Troubleshoot and resolve environment errors if showcase is not running.
7. You are ready to start coding.

## Git Repository

This project can be located on Revcontent's Stash instance.

[https://stash.clickbooth.com/projects/RV2/repos/api-showcase/browse](https://stash.clickbooth.com/projects/RV2/repos/api-showcase/browse)

```
git clone ssh://git@stash.clickbooth.com:7999/rv2/api-showcase.git
```

### Sample Virtual Host
Here's an example vhost configuration if you are using Apache HTTPd. The root file is htdocs/index.php.

```
#Labs Virtual Host
<VirtualHost *:80>
    ServerAdmin developer@revcontent.com
    DocumentRoot "/www/api-showcase/htdocs"
    ServerName api-showcase.localhost
    ServerAlias www.api-showcase.localhost
    ErrorLog "/private/var/log/apache2/apishow-error_log"
    CustomLog "/private/var/log/apache2/apishow-access_log" common
        <Directory "/www/api-showcase/htdocs">
        AllowOverride All
        Options Indexes MultiViews FollowSymlinks
        Order allow,deny
        Allow from all
        #Header Set Cache-Control no-cache
        </Directory>
</VirtualHost>
```

### Directory Layout

Here's a look at the directory structure, some assets and resources are no longer in use and will be cleaned in a future effort. 

```
drwxr-xr-x   11 developer  rev2   374 Apr 29 00:50 .
drwxr-xr-x  139 developer  rev2  4726 Jun  6 12:07 ..
-rw-r--r--    1 developer  rev2    51 Oct 27  2015 .bowerrc
drwxr-xr-x   16 developer  rev2   544 Jun 10 08:56 .git
-rw-r--r--    1 developer  rev2   185 Apr 29 00:50 .gitignore
-rw-r--r--    1 developer  rev2   116 Oct 27  2015 .gitmodules
drwxr-xr-x    9 developer  rev2   306 Apr 29 01:38 .idea
-rw-r--r--    1 developer  rev2  1202 Jun 10 08:55 README.md
-rw-r--r--    1 developer  rev2   583 Apr 29 00:50 bower.json
drwxr-xr-x   19 developer  rev2   646 Jun  6 13:01 htdocs
-rw-r--r--    1 developer  rev2  1143 Nov 10  2015 npm-debug.log
```

### Installing Dependencies

You must have a healty build environment in order to begin development on showcase labs.

#### NPM
Install node packages.

```
npm install
```

#### Bower
Install bower packages. There are 2 bower files, one in the project root for site dependencies and one in the htdocs folder for widget dependencies. Navigate to each folder and run ```bower install``` to get the necessary dependencies.

```
bower install
```


### Git Workflow

Deciding on what branch you'll make your change will depend on a few factors, such as deployment date, change scope and so forth.
Generally speaking develop branch should contain the latest future (+stable) changes that are on the way to staging.

For most changes, you'll want to branch from develop and send your PR there once code complete. For core issues that arise in production,
creating 2 branches (from DEVELOP and MASTER) may be necessary in order to keep both environments in sync without affecting the forward development timeline.


New Feature Changes
* Branch from DEVELOP branch

Production Hotfixes/Bugfixes
* Branch from MASTER branch


## The Widgets

The following API widget packages are under active development. The core soure files are located under the htdocs/showcase directory inside the project root.

```
api-showcase/htdocs/showcase git:(develop)] ls

revcontent-api-showcase-exitpop-1.0
revcontent-api-showcase-flicker-1.0
revcontent-api-showcase-revmore-1.0
revcontent-api-showcase-shifter-2.0
revcontent-api-showcase-slider-1.0
revcontent-api-showcase-toaster-1.0
revcontent-api-showcase-image-1.0
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
revcontent-api-showcase-more-1.0

```

### Gulp build/watch

Gulp tasks are located in the htdocs/tasks folder and use the config.json file. During development it is useful to ```watch``` the widget you are working on. This is done using the ```gulp watch --{widget}``` command where ```{widget}``` is the name of the widget to watch. The watch command monitors the files under the ```watch``` config in config.json for changes. When a change occurs it builds the appropriate files into the htdocs/build and htdocs/build/files directories. 

If your widget relies on another widget such as RevSlider it can be useful to watch both widgets at the same time in separate console tabs, when there is a change to RevSlider the dependent widget will also be built.

The Gulp build task is similar to the watch command and is run using ```gulp build --{widget}```. This is the same task that is run when the watch command detects a change. Use this when you want to build without watching for changes. All files under the ```build`` config in config.json will be used to create the minified and packaged files. CSS/Sass will also be injected.

#### Available widgets for {widget} option include: 

* flicker (RevFlicker)
* more (RevMore)
* shifter (RevShifter)
* slider (RevSlider)
* toaster (RevToaster)
* image (RevImage)

##### Examples

```
gulp build --widget=flicker
```

```
gulp watch --widget=flicker
```

### Standalone Services

Labs also provides shelter for a few web services that are not deployed with ui-bproc or delivery.

#### AMPHTML Service

Google's **AMP** Helper service is maintained and built here. We have 2 Git repositories, one on Stash and the other on Github.

#### Source Directory

#### Build or "Dist" Files

Build files necessary for production use are outputted to the htdocs/build directory.

```
amphtml/           
     revcontent.amp.min.js
revflicker.min.js 
revshifter.min.js 
revsofia.min.js
revexit.min.js    
revmore.min.js    
revslider.min.js  
revtoaster.min.js

```


## Staging

Labs has it's own Staging environment and Bamboo workflow.


## Testing

Bundled tests are distributed to the tests/folder during the build process. And use the /htdocs/app/config/demos.json config file and code from /htdocs/app/resources/js/app/demo/{widget} directories. Specific site templates are held in the /htdocs/tests/templates directory.

### Building Tests

Run ```gulp tests-files``` in order to build the test files into /htdocs/tests/{widget} directories. For each of template listed in /htdocs/app/config/demos.json and demo in /htdocs/app/resources/js/app/demo/{widget} a file will be added to the /htdocs/tests/{widget} directories.

### Static HTML Tests

### Automated Testing


## Deployment

When you've completed a labs ticket, here's the process for getting deployed to production.


## Known Issues


## Roadmap


## License

```
This source file is closed source, strictly confidential and
proprietary to Integraclick Inc. Viewing the contents of this file binds the
viewer to the NDA agreement  available by Integraclick Inc. Electronic
transfer of this file outside of the Integraclick corporate network is
strictly prohibited. Questions, comments or concerns should be directed to
compliance@integraclick.com
```
