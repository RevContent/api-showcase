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
		window.TimeMe
	);

	window.rceInit = function(userId) {
		return window.revEvents.init(userId);
	}

	window.rceTrack = function(eventName, props) {
		return window.revEvents.track(eventName, props);
	}

	window.addEventListener("beforeunload", function() {
		window.revEvents.trackActivity();
	});

}( window, function factory( window, revApi, TimeMe ) {

	'use strict';

	var events = {
		ENDPOINT : "//trends.revcontent.com/api/v1/events/track.php",
		USER_ID : ""
	};

	events.init = function(userId) {
		this.USER_ID = userId;
		return this;
	}

	events.track = function(eventName, props) {
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

	events.trackActivity = function() {
		this.track("user_activity", { active_time : TimeMe.getTimeOnCurrentPageInSeconds() });
	}

	TimeMe.initialize({
		currentPageName: "rc-event",
		idleTimeoutInSeconds: 30
	});

	window.setInterval(function() {
		events.trackActivity()
	}, 300000);

	return events;
}));