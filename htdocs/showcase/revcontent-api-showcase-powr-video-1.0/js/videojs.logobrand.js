/*
 * Video.js logobrand
 * https://github.com/Mewte/videojs-logobrand
 *
 * Copyright (c) 2014 Mewte @ InstaSynch
 * Licensed under the MIT license
 */

var GLOBAL_PLAYER = null;

(function(vjs) {

	// define some reasonable defaults
	var defaults = {
		image: '',
		destination: '#'
	};
	// plugin initializer
	var logobrand = function(options) {
        var settings = videojs.mergeOptions(defaults, options), player = this;

        var controlBar,
            newElement = document.createElement('div'),
            newLink = document.createElement('a'),
            newImage = document.createElement('img');

        // Assign id and classes to div for logo
        newElement.className = 'vjs-control vjs-custom-logo';

        // Assign properties to elements and assign to parents
        newImage.setAttribute('src', options.image);
        newImage.setAttribute('height', '100%');
        newLink.setAttribute('href', options.destination);
        newLink.appendChild(newImage);
        newElement.appendChild(newLink);

        // Get control bar
        // Remember that getElementsByClassName() returns an array
        controlBar = player.controlBar.el();

        // Insert the logo div to the end of the control bar elements
        controlBar.appendChild(newElement);

		this.loadImage = function(src){
			newElement.src=src;
		};
		this.setDestination = function(href){
			newElement.href = href;
		};
		return this;
	};	
	// register the plugin with video.js
	vjs.plugin('logobrand', logobrand);

}(window.videojs));
