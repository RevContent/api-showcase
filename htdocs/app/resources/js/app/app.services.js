app.service('widgets', function() {
    this.data = {
        'exit-pop': {
            title: 'RevExit',
            img: 'exitpop.jpg',
            description: 'RevExit is an API implementation that pops up on a user\'s first impression every 24 hours for non-touch enabled devices (e.g. desktops). When the user mouses off the page they are usually trying to close the window or navigate away from the page. RevExit is a great way to give these users one more chance to view your Revcontent API widget.',
            link: 'revcontent-api-showcase-exitpop-1.0/index.html',
            docs: 'revcontent-api-showcase-exitpop-1.0/README.md',
            bg: '#00A650'
        },
        flicker: {
            title: 'RevFlicker',
            img: 'flicker.jpg',
            description: 'With responsive styling and touch enabled gestures RevFlicker puts the fun into your content slider. You can configure the RevFlicker widget to show on phone, tablet and desktop and you can even decide how many units to display at various breakpoints. Include RevFlicker on your page and let the engagement begin!',
            link: 'revcontent-api-showcase-flicker-1.0/index.html',
            docs: 'revcontent-api-showcase-flicker-1.0/README.md',
            bg: '#F7F9F8',
            // preview: true,
            // demo: true
        },
        toaster: {
            title: 'Mobile RevToaster',
            img: 'toaster.jpg',
            description: 'Pop! content toasters are an engaging way to interact with your readers. The Mobile RevToaster will appear as the user pans back to the top of the page and disapear as they scroll back down. Show your reader what\'s trending and get great results with the Mobile RevToaster.',
            link: 'revcontent-api-showcase-toaster-1.0/index.html',
            docs: 'revcontent-api-showcase-toaster-1.0/README.md',
            bg: '#CFC28E',
            // preview: true,
            // demo: true
        },
        slider: {
            title: 'RevSlider',
            img: 'slider.jpg',
            description: 'RevSlider is an engaging carousel and a great way to showcase Revcontent ads on your site! Give your readers the ability to navigate through all of the ads availible to your widget. Fully responsive and configurable to display as many rows and columns as you like at various breakpoints. RevSlider is a great choice for any site!',
            link: 'revcontent-api-showcase-slider-1.0/index.html',
            docs: 'revcontent-api-showcase-slider-1.0/README.md',
            bg: '#2E4E5D',
            //preview: true,
            //demo: true
        },
        shifter: {
            title: 'RevShifter',
            img: 'shifter.jpg',
            description: 'Monetize valuable site real estate on the top or bottom of the page, show RevShifter on demand or as the user scrolls. Great for engaging users on high bounce rate experiences with pagination and touch support. RevShifter is sure to increase revenue, customize one to fit your site today!',
            link: 'revcontent-api-showcase-shifter-2.0/index.html',
            docs: 'revcontent-api-showcase-shifter-2.0/README.md',
            bg: '#EEBF77'
            // preview: true,
            // demo: true
        },
        instream: {
            title: 'In-stream',
            img: 'instream.jpg',
            description: 'In-stream native sponsored content can look, feel, and function seamlessly across mobile, desktop, or tablet. With the API you\'re in full control of the integration on your web property, inject targeted content in-stream on your homepage, mobile view, or where it fits best for your users.',
            link: 'revcontent-api-showcase-instream-1.0/index.php',
            bg: '#70BDA9'
        },
        'end-of-gallery': {
            title: 'End of Gallery',
            img: 'eog.jpg',
            description: 'Keep the engagement going long after the last page of your gallery. Using our API on the last page of your photo galleries, top 10 lists, or quizes is a great way to guide your users to their next destination.',
            link: 'revcontent-api-showcase-endofgallery-1.0/index.html',
            bg: '#847F6C'
        },
        'revmore': {
            title: 'Mobile RevMore',
            img: 'revmore.jpg',
            description: 'Studies show that Facebook-referred mobile users never reach the bottom of the article. By truncating the page, RevMore increase the visibility of content recommendations from standard Revcontent widgets.',
            link: 'revcontent-api-showcase-more-1.0/index.html',
            docs: 'revcontent-api-showcase-more-1.0/README.md',
            bg: '#5B7D89'
        },
        'revmore-standard': {
            title: 'Mobile RevMore Standard',
            img: 'revmore.jpg',
            description: 'Studies show that Facebook-referred mobile users never reach the bottom of the article. By truncating the page, RevMore increase the visibility of content recommendations from standard Revcontent widgets.',
            link: 'revcontent-api-showcase-more-1.0/index.html',
            docs: 'revcontent-api-showcase-more-1.0/README_Standard.md',
            bg: '#5B7D89'
        },
        'revimage': {
            title: 'RevImage',
            img: 'revimage.jpg',
            description: 'Rev up your valuable image real estate with the RevImage widget! As your image makes its way into view RevImage transitions from the bottom drawing attention where the eyes are already focused. Add a timeout to delay the ad from showing. Optimized for all devices and screen sizes, RevImage is a sure fire way to increase RPMs and monetize in a new and exciting way!',
            link: 'revcontent-api-showcase-image-1.0/index.html',
            docs: 'revcontent-api-showcase-image-1.0/README.md',
            bg: '#434f5e'
        },
        'amp': {
            title: 'AMP HTML',
            img: 'amp.jpg',
            description: 'AMP is a way to build web pages for static content that render fast. AMP HTML is HTML with some restrictions for reliable performance and some extensions for building rich content beyond basic HTML. The AMP JS library ensures the fast rendering of AMP HTML pages. The Google AMP Cache can be used to serve cached AMP HTML pages. So go ahead, amplify the web! Learn more about the Revcontent AMP partnership <a href="http://blog.revcontent.com/revcontent-partners-with-google-for-better-user-experience-on-mobile/">here</a>.',
            link: 'revcontent-api-showcase-amp-1.0/index.html',
            bg: '#000'
        },
        'soloserve': {
            title: 'Solo Serve Native',
            img: 'soloserve.jpg',
            description: 'Our content is on fire! This single ad widget is sure to get your audience\'s attention. With a customizable call to action and popularity meter, increase viewer engagement and your returns with Solo Serve Native today.',
            link: 'revcontent-api-showcase-solo-serve-1.0/index.html',
            docs: 'revcontent-api-showcase-solo-serve-1.0/README.md',
            bg: '#d6031d'
        }
        //'scrolling-exp': {
          //  title: 'Scrolling Experience',
          //  img: 'grid.jpg',
          //  description: 'AJAX-powered infinite scrolling UI’s are everywhere these days, with our API you can easily integrate sponsored content into your own implementation. Utilizing our count and offset request parameters to fuel the implementation, you can create a truly native experience that will engage user’s as they scroll.',
          //  link: 'revcontent-api-showcase-scrollingexp-1.0/index.html',
          //  bg: '#DA825E'
        //}
    };
});

app.service('$stateManager', function() {
    this.stickyPath;
    this.originPath;

    this.setPath = function(stickyPath) {
        this.stickyPath = stickyPath;
    };

    this.getPath = function() {
        return this.stickyPath;
    };

    this.setOriginPath = function(originPath) {
        this.originPath = originPath;
    };

    this.getOriginPath = function() {
        return this.originPath;
    };
});

app.service('$mdCardContent', function() {
    this.clickEvent = null;

    this.setClickEvent = function(evt) {
        this.clickEvent = evt;
    };

    this.getClickEvent = function() {
        return this.clickEvent;
    };
});

app.service('slider', function(options) {
    this.type = 'Discrete';
    this.value = options.sizes[(options.size - 1)];
    this.max = options.sizes[(options.sizes.length - 1)];
    this.min = options.sizes[0];
});


app.service('options', function($rootScope, $localStorage, $stateParams) {

    this.domain = 'apiexamples.powr.com';
    this.api_key = '3eeb00d786e9a77bbd630595ae0be7e9aa7aff3b';
    this.widget_id = 6181;
    this.pub_id = 945;
    this.visible = true;

    this.size = 4;

    this.sponsored = 10;

    this.devices = {
        phone: true,
        tablet: true,
        desktop: true
    };

    this.header = 'Trending Now';

    this.rev_positions = {
        top_right: {
            key: 'top_right',
            value: 'Top Right',
        },
        bottom_left: {
            key: 'bottom_left',
            value: 'Bottom Left',
        },
        bottom_right: {
            key: 'bottom_right',
            value: 'Bottom Right',
        }
    };

    this.rev_position = this.rev_positions.top_right.key;

    this.image_ratios = {
        wide_rectangle: {
            key: 'wide_rectangle',
            value: 'Wide Recangle',
        },
        rectangle: {
            key: 'rectangle',
            value: 'Rectangle',
        },
        square: {
            key: 'square',
            value: 'Square',
        }
    };

    this.image_ratio = this.image_ratios.wide_rectangle.key;

    this.sizes = [
        150,
        250,
        500,
        750,
        1000,
        1250,
        1500
    ];

    this.rows = {
        xxs: 2,
        xs: 2,
        sm: 2,
        md: 2,
        lg: 2,
        xl: 2,
        xxl: 2
    };

    this.per_row = {
        xxs: 1,
        xs: 1,
        sm: 3,
        md: 4,
        lg: 5,
        xl: 6,
        xxl: 7
    };

    this.headline_size = 2;
    this.max_headline = false;
    this.text_overlay = false;
    this.vertical = false;
    this.page_increment = true;
    this.wrap_pages = true;
    this.wrap_reverse = false;
    this.show_padding = true;
    this.pages = 4;
    this.text_right = false;

    this.set = function(options) {
        if (options) {
            angular.extend(this, options);
            $localStorage.options = angular.extend(this, options);
        } else {
            angular.extend(this, $localStorage.options);
        }
    };

    this.set(($stateParams.options ? JSON.parse(decodeURIComponent($stateParams.options)) : false));


    this.getDevices = function() {
        var devices = [];
        for (var device in this.devices) {
          if (this.devices.hasOwnProperty(device)) {
            if (this.devices[device])
                devices.push(device);
          }
        }
        return devices;
    };
});