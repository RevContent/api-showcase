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
		window.revEvents.trackActivity();
	});

}( window, function factory( window, revApi, revUtils, TimeMe ) {

	'use strict';

	var events = {
		ENDPOINT : "//trends.revcontent.com/api/v1/events/track.php",
		USER_ID : ""
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