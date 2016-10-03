/**
 * Revcontent View Event
 */

( function( window, factory ) {
    /*global define: false, module: false, require: false */
    'use strict';
    // universal module definition
    // browser global
    window.revView = factory(
        window,
        window.revApi,
        window.revUtils
    );

}( window, function factory( window, revApi, revUtils ) {

    'use strict';

    var view = {};

    view.viewable = function(that) {
        var viewBottom = (window.innerHeight || document.documentElement.clientHeight) + (window.ScrollY || document.documentElement.scrollTop);
        var divTop = document.getElementById(that.containerElement.id).getBoundingClientRect().top;

        if(viewBottom >= divTop) {
            revUtils.removeEventListener(window, 'scroll', view.viewable);

            var count = that.perRow;

            var viewsUrl = that.options.url + '?uitm=true&viewed=true&api_key='+ options.api_key +'&pub_id='+ that.options.pub_id +'&widget_id='+ that.options.widget_id +'&domain='+ that.options.domain +'&api_source=' + that.source;
            viewsUrl += '&sponsored_count=' + (that.options.internal ? 0 : count) + '&internal_count=' + (that.options.internal ? count : 0) + '&sponsored_offset=0&internal_offset=0';

            revApi.request(viewsUrl);
        }
    };

    return view;

}));