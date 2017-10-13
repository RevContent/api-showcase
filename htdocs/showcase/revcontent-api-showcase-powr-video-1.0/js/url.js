    //URL class
    var URL = function(url) {
      this.url = url;
      this.parseUrl();
    };
    //supported function by url class
    URL.prototype = {
      getUrl: function() {
          return this.url;
      },
      getActualUrl: function() {
          return this.actual_url;
      },
      getParams: function() {
          return this.params;
      },
      getParam: function(name, default_value) {
        if(name in this.params) {
          return this.params[name];
        } else {
          return default_value != null ? default_value : null;
        }
      },
      setParam: function(name, value) {
          this.params[name] = value;
      },
      getParamsString: function() {
        var pairs = [];
        $.each(this.params, function(key, value) {
          pairs.push(key + "=" + value);
        });
        return pairs.join("&");
      },
      buildUrl: function() {
        return this.getActualUrl() + "?" + this.getParamsString();
      },
      parseUrl: function() {
        var params = {};
        var index = this.url.indexOf("\?");

        if(index !== -1) {
          var pairs = this.url.substring(index + 1).split('&');
          $.each(pairs, function(i, value) {
            if(!value) return;
            var pair = value.split('=');
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
          });
          this.actual_url = this.url.substring(0, index);
        } else {
          this.actual_url = this.url;
        }
        this.params = params;
      },
      loadUrl: function() {
        window.location.href = this.buildUrl();
      }
    };
