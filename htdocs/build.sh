#!/usr/bin/env bash
gulp build --widget=slider
gulp build --widget=slider2
gulp build --widget=flicker
gulp build --widget=shifter
gulp build --widget=scroller
gulp build --widget=image
gulp build --widget=more
gulp build --widget=soloserve
gulp build --widget=toaster
gulp build --widget=interstitial
gulp build --widget=infeedvideo
gulp build --widget=instream
gulp build --widget=side-shifter

# Rx Build (Isolated)
cd showcase/revcontent-api-showcase-exitpop-1.0 && gulp
