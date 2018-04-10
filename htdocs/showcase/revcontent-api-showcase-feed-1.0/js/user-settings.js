/*
Project: EngageUserSettings
Version: 0.0.1
Author: michael@revcontent.com
*/

(function (window, factory) {
  'use strict';
  window.EngageUserSettings = factory(window, window.revUtils, window.revDetect, window.revApi);

}(window, function factory(window, revUtils, revDetect, revApi) {
  'use strict';
  var EngageUserSettings = function (opts) {
    var defaults = {
      actions_api_url: 'https://api.engage.im/' + opts.env + '/actions/',
    };
    this.options = Object.assign(defaults, opts);
    this.init();
  };

  EngageUserSettings.prototype.init = function () {
    var that = this;
    this.bookmarksContainer = document.createElement('div');
    this.bookmarksContainer.id = 'eng-user-settings-container';

    this.bookmarksHeaderContainer = document.createElement('div');
    revUtils.addClass(this.bookmarksHeaderContainer, 'eng-user-settings-header');
    this.bookmarksHeaderImgContainer = document.createElement('span');
    revUtils.addClass(this.bookmarksHeaderImgContainer, 'eng-user-settings-header-img-container');
    this.bookmarksHeaderImgContainer.innerHTML = "My Settings";


    this.bookmarksMenuActionIcon = document.createElement('img');
    this.bookmarksMenuActionIcon.src = 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4IiB2aWV3Qm94PSIwIDAgNzkyIDc5MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNzkyIDc5MjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8Zz4KCTxnIGlkPSJSZWN0YW5nbGVfNV9jb3B5Ij4KCQk8Zz4KCQkJPHBvbHlnb24gcG9pbnRzPSI1ODAuODAyLDM2OS42MDQgNTgwLjgwMiwzNjkuNjA0IDIxMS4xOTgsMCAxODQuODAyLDI2LjM5NiA1NTQuNDA1LDM5NiAxODQuODAyLDc2NS42MDQgMjExLjE5OCw3OTIgICAgICA2MDcuMTk4LDM5NiAgICAiIGZpbGw9IiMwMDhlZmYiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==';
    this.bookmarksMenuAction = document.createElement('a');
    revUtils.append(this.bookmarksMenuAction, this.bookmarksMenuActionIcon);
    revUtils.append(this.bookmarksHeaderContainer, this.bookmarksMenuAction);

    revUtils.addEventListener(this.bookmarksMenuAction, 'click', function (e) {
      revUtils.removeClass(that.bookmarksContainer, 'is-open');
    });

    this.bookmarksHeaderImg = document.createElement('img');
    revUtils.addClass(this.bookmarksHeaderImg, 'eng-user-settings-header-img');
    if (that.options.user && that.options.user.picture) {
      this.bookmarksHeaderImg.src = that.options.user.picture;
    }


    revUtils.append(this.bookmarksHeaderImgContainer, this.bookmarksHeaderImg);
    //revUtils.append(this.bookmarksHeaderImgContainer, "My Bookmarks");
    revUtils.append(this.bookmarksHeaderContainer, this.bookmarksHeaderImgContainer);
    revUtils.append(this.bookmarksContainer, this.bookmarksHeaderContainer);

    this.bookmarksTitleContainer = document.createElement('div');
    revUtils.addClass(this.bookmarksTitleContainer, 'eng-user-settings-title');
    this.bookmarksTitleContainer.innerHTML = "Settings";

    revUtils.append(this.bookmarksContainer, this.bookmarksTitleContainer);

    this.settingsList = document.createElement('div');
    this.settingsList.id = 'eng-user-settings-list';
    revUtils.addClass(this.settingsList, 'eng-user-settings-list');

    // this.getBookmarks();
    revUtils.append(this.bookmarksContainer, this.settingsList);
    this.userMenu = document.getElementById('eng-feed-user-menu-container');
    revUtils.append(this.userMenu, this.bookmarksContainer);
  };

  return EngageUserSettings;
}));