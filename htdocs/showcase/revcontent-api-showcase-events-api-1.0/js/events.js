/*
 Project: Events
 Version: 1
 Author: mikhail@revcontent.com
 */
// universal module definition

( function( window, factory) {
	/*global define: false, module: false, require: false */
	'use strict';
	window.revEvents = factory(
		window,
		window.revApi,
		window.revUtils,
		window.TimeMe
	);

	window.rceInit = function(userId, endpoint) {
		var api = window.revEvents.init(userId, endpoint);
		api.trackActivity();
		return api;
	}

	window.rceTrack = function(eventName, props) {
		return window.revEvents.track(eventName, props);
	}

	window.addEventListener("beforeunload", function() {
		window.revEvents.trackActivity(true);
	});

}( window, function factory( window, revApi, revUtils, TimeMe ) {

	'use strict';

	var events = {
		ENDPOINT : "//trends.revcontent.com/api/v1/events/track.php",
		USER_ID : "",
		LAST_ACTIVE_TIME : 0
	};

	events.init = function(userId, endpoint) {
		this.USER_ID = userId;
		if(endpoint)
			this.ENDPOINT = endpoint;
		return this;
	}

	events.track = function(eventName, props) {

		var click_uuid = revUtils.getUrlParam("rc_click");

		if(!props["click_uuid"] && click_uuid) {
			props["click_uuid"] = click_uuid;
		}

		revApi.request(
			this.ENDPOINT + "?u=" + encodeURIComponent(this.USER_ID)
						  + "&e=" + encodeURIComponent(eventName)
						  + "&p=" + encodeURIComponent(btoa(JSON.stringify(props))),
			function(r) {
				// console.log("success " + r);
			},
			function(r) {
				// console.log("fail " + r)
			}
		);
	}

	events.trackActivity = function(force) {
		var trackingInterval;
		if(this.LAST_ACTIVE_TIME < 60) {
			trackingInterval = 10;
		}
		else if(this.LAST_ACTIVE_TIME < 300) {
			trackingInterval = 60;
		}
		else {
			trackingInterval = 300;
		}

		var active_time = TimeMe.getTimeOnCurrentPageInSeconds();
		var nextActiveTimeToTrack = Math.round(this.LAST_ACTIVE_TIME / trackingInterval + 1) * trackingInterval
		var nextTimeout = trackingInterval * 1000;

		if(force || active_time >= nextActiveTimeToTrack) {
			this.track("user_activity", { active_time : active_time });
		}

		this.LAST_ACTIVE_TIME = active_time;

		window.setTimeout(function() {
			events.trackActivity(false);
		}, nextTimeout);
	}

	TimeMe.initialize({
		currentPageName: "rc-event",
		idleTimeoutInSeconds: 10
	});

	window.setTimeout(function() {
		events.trackActivity(false)
	}, 100000);

	return events;
}));