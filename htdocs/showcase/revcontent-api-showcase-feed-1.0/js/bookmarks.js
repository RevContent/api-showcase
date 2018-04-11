/*
Project: EngageBookmarksManager
Version: 0.0.1
Author: john.burnette@revcontent.com
*/

(function (window, factory) {
  'use strict';
  window.EngageBookmarksManager = factory(window, window.revUtils, window.revDetect, window.revApi);

}(window, function factory(window, revUtils, revDetect, revApi) {
  'use strict';
  var EngageBookmarksManager = function (opts) {
    var defaults = {
      actions_api_url: 'https://api.engage.im/' + opts.env + '/actions/',
    };
    this.options = Object.assign(defaults, opts);
    this.init();
  };

  EngageBookmarksManager.prototype.init = function () {
    var that = this;
    this.bookmarksContainer = document.createElement('div');
    this.bookmarksContainer.id = 'eng-bookmarks-container';

    this.bookmarksHeaderContainer = document.createElement('div');
    revUtils.addClass(this.bookmarksHeaderContainer, 'eng-bookmarks-header');
    this.bookmarksHeaderImgContainer = document.createElement('span');
    revUtils.addClass(this.bookmarksHeaderImgContainer, 'eng-bookmarks-header-img-container');
    this.bookmarksHeaderImgContainer.innerHTML = "My Bookmarks";


    this.bookmarksMenuActionIcon = document.createElement('img');
    this.bookmarksMenuActionIcon.src = 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4IiB2aWV3Qm94PSIwIDAgNzkyIDc5MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNzkyIDc5MjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8Zz4KCTxnIGlkPSJSZWN0YW5nbGVfNV9jb3B5Ij4KCQk8Zz4KCQkJPHBvbHlnb24gcG9pbnRzPSI1ODAuODAyLDM2OS42MDQgNTgwLjgwMiwzNjkuNjA0IDIxMS4xOTgsMCAxODQuODAyLDI2LjM5NiA1NTQuNDA1LDM5NiAxODQuODAyLDc2NS42MDQgMjExLjE5OCw3OTIgICAgICA2MDcuMTk4LDM5NiAgICAiIGZpbGw9IiMwMDhlZmYiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==';
    this.bookmarksMenuAction = document.createElement('a');
    revUtils.append(this.bookmarksMenuAction, this.bookmarksMenuActionIcon);
    revUtils.append(this.bookmarksHeaderContainer, this.bookmarksMenuAction);

    revUtils.addEventListener(this.bookmarksMenuAction, 'click', function (e) {
      revUtils.removeClass(that.bookmarksContainer, 'is-open');
    });

    this.bookmarksHeaderImg = document.createElement('img');
    revUtils.addClass(this.bookmarksHeaderImg, 'eng-bookmarks-header-img');
    if (that.options.user && that.options.user.picture) {
      this.bookmarksHeaderImg.src = that.options.user.picture;
    }


    revUtils.append(this.bookmarksHeaderImgContainer, this.bookmarksHeaderImg);
    //revUtils.append(this.bookmarksHeaderImgContainer, "My Bookmarks");
    revUtils.append(this.bookmarksHeaderContainer, this.bookmarksHeaderImgContainer);
    revUtils.append(this.bookmarksContainer, this.bookmarksHeaderContainer);

    this.bookmarksTitleContainer = document.createElement('div');
    revUtils.addClass(this.bookmarksTitleContainer, 'eng-bookmarks-title');
    this.bookmarksTitleContainer.innerHTML = "Bookmarks";

    revUtils.append(this.bookmarksContainer, this.bookmarksTitleContainer);

    this.bookmarksList = document.createElement('ul');
    this.bookmarksList.id = 'eng-bookmarks-list';
    revUtils.addClass(this.bookmarksList, 'eng-bookmarks-list');

    this.getBookmarks();
    revUtils.append(this.bookmarksContainer, this.bookmarksList);
    this.userMenu = document.getElementById('eng-feed-user-menu-container');
    revUtils.append(this.userMenu, this.bookmarksContainer);

    this.options.emitter.on('addBookmark', function(data) {
      that.addBookmark(data);
    });

    this.options.emitter.on('removeBookmark', function(data){
      that.removeBookmark(data.dataset);
    });
    this.options.emitter.on('menuClose', function() {
      that.bookmarksContainer.removeClass('is-open');
    });

    this.options.emitter.on('getBookmarks', function() {
      this.getBookmarks();
    });
  };

  EngageBookmarksManager.prototype.addBookmark = function(data) {
    if (this.bookmarksContainer) {
      this.addBookmarkItem(data);
    }
  };

  EngageBookmarksManager.prototype.removeBookmark = function(data) {
    if(this.bookmarksContainer) {
      var list = document.getElementById('eng-bookmarks-list');
      var el = list.querySelector("[data-id='" + data.id +"']");
      if (el) {
        el.parentNode.removeChild(el);
      }
    }
  };

  EngageBookmarksManager.prototype.addBookmarkItem = function (data) {
    var that = this;
    var item = document.createElement('li'),
          row = document.createElement('div'),
          categoryContainer = document.createElement('div'),
          category = document.createElement('span'),
          headlineContainer = document.createElement('div'),
          date = document.createElement('div'),
          headlineLink = document.createElement('a'),
          headline = document.createElement('div'),
          domainRow = document.createElement('div'),
          domainContainer = document.createElement('div'),
          author = document.createElement('span'),
          domain = document.createElement('a'),
          actionsContainer = document.createElement('div'),
          shareActionLink = document.createElement('a'),
          shareIcon = document.createElement('img'),
          reactionsActionLink = document.createElement('a'),
          reactionsIcon = document.createElement('img'),
          deleteActionLink = document.createElement('a'),
          deleteIcon = document.createElement('img');

        revUtils.addClass(item, 'eng-bookmark-list-item');
        revUtils.addClass(row, 'row');
        revUtils.addClass(categoryContainer, 'col-md-12');
        revUtils.addClass(category, 'list-item-category');
        revUtils.addClass(headlineContainer, 'col-md-12');
        revUtils.addClass(date, 'list-item-date');
        revUtils.addClass(headlineLink, 'list-item-headline');
        revUtils.addClass(domainRow, 'col-md-12');
        revUtils.addClass(domainContainer, 'list-item-domain-container');
        revUtils.addClass(author, 'list-item-author');
        revUtils.addClass(domain, 'list-item-domain');
        revUtils.addClass(actionsContainer, 'list-item-actions-container');
        revUtils.addClass(shareIcon, 'list-item-action');
        revUtils.addClass(shareIcon, 'icon-share');
        revUtils.addClass(reactionsIcon, 'list-item-action');
        revUtils.addClass(reactionsIcon, 'icon-reaction');
        revUtils.addClass(deleteIcon, 'list-item-action');
        revUtils.addClass(deleteIcon, 'icon-delete');

        item.setAttribute('data-id', data.id);
        date.innerHTML = revUtils.timeAgo(data.created, true) + ' ago';
        headline.innerHTML = data.title;
        headlineLink.setAttribute('target', '_blank');
        domain.innerHTML = extractRootDomain(data.url);
        domain.href = 'https://' + extractHostname(data.url) + '?utm_source=engageim';
        domain.setAttribute('target', '_blank');
        //TODO: refactor this to be a function
        var options = {
          method: 'DELETE'
        };
        revUtils.addEventListener(deleteActionLink, 'click', function(e) {
          var anchor = this;
          var el = anchor.closest('.eng-bookmark-list-item');
          revApi.xhr(that.options.actions_api_url + 'bookmark/remove/' + el.getAttribute('data-id'), function(e) {
            el.parentNode.removeChild(el);
          }, null, true, options);
        });

        deleteIcon.src = 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCIgdmlld0JveD0iMCAwIDQ4Mi40MjggNDgyLjQyOSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDgyLjQyOCA0ODIuNDI5OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTM4MS4xNjMsNTcuNzk5aC03NS4wOTRDMzAyLjMyMywyNS4zMTYsMjc0LjY4NiwwLDI0MS4yMTQsMGMtMzMuNDcxLDAtNjEuMTA0LDI1LjMxNS02NC44NSw1Ny43OTloLTc1LjA5OCAgICBjLTMwLjM5LDAtNTUuMTExLDI0LjcyOC01NS4xMTEsNTUuMTE3djIuODI4YzAsMjMuMjIzLDE0LjQ2LDQzLjEsMzQuODMsNTEuMTk5djI2MC4zNjljMCwzMC4zOSwyNC43MjQsNTUuMTE3LDU1LjExMiw1NS4xMTcgICAgaDIxMC4yMzZjMzAuMzg5LDAsNTUuMTExLTI0LjcyOSw1NS4xMTEtNTUuMTE3VjE2Ni45NDRjMjAuMzY5LTguMSwzNC44My0yNy45NzcsMzQuODMtNTEuMTk5di0yLjgyOCAgICBDNDM2LjI3NCw4Mi41MjcsNDExLjU1MSw1Ny43OTksMzgxLjE2Myw1Ny43OTl6IE0yNDEuMjE0LDI2LjEzOWMxOS4wMzcsMCwzNC45MjcsMTMuNjQ1LDM4LjQ0MywzMS42NmgtNzYuODc5ICAgIEMyMDYuMjkzLDM5Ljc4MywyMjIuMTg0LDI2LjEzOSwyNDEuMjE0LDI2LjEzOXogTTM3NS4zMDUsNDI3LjMxMmMwLDE1Ljk3OC0xMywyOC45NzktMjguOTczLDI4Ljk3OUgxMzYuMDk2ICAgIGMtMTUuOTczLDAtMjguOTczLTEzLjAwMi0yOC45NzMtMjguOTc5VjE3MC44NjFoMjY4LjE4MlY0MjcuMzEyeiBNNDEwLjEzNSwxMTUuNzQ0YzAsMTUuOTc4LTEzLDI4Ljk3OS0yOC45NzMsMjguOTc5SDEwMS4yNjYgICAgYy0xNS45NzMsMC0yOC45NzMtMTMuMDAxLTI4Ljk3My0yOC45Nzl2LTIuODI4YzAtMTUuOTc4LDEzLTI4Ljk3OSwyOC45NzMtMjguOTc5aDI3OS44OTdjMTUuOTczLDAsMjguOTczLDEzLjAwMSwyOC45NzMsMjguOTc5ICAgIFYxMTUuNzQ0eiIgZmlsbD0iIzdkN2Q3ZCIvPgoJCTxwYXRoIGQ9Ik0xNzEuMTQ0LDQyMi44NjNjNy4yMTgsMCwxMy4wNjktNS44NTMsMTMuMDY5LTEzLjA2OFYyNjIuNjQxYzAtNy4yMTYtNS44NTItMTMuMDctMTMuMDY5LTEzLjA3ICAgIGMtNy4yMTcsMC0xMy4wNjksNS44NTQtMTMuMDY5LDEzLjA3djE0Ny4xNTRDMTU4LjA3NCw0MTcuMDEyLDE2My45MjYsNDIyLjg2MywxNzEuMTQ0LDQyMi44NjN6IiBmaWxsPSIjN2Q3ZDdkIi8+CgkJPHBhdGggZD0iTTI0MS4yMTQsNDIyLjg2M2M3LjIxOCwwLDEzLjA3LTUuODUzLDEzLjA3LTEzLjA2OFYyNjIuNjQxYzAtNy4yMTYtNS44NTQtMTMuMDctMTMuMDctMTMuMDcgICAgYy03LjIxNywwLTEzLjA2OSw1Ljg1NC0xMy4wNjksMTMuMDd2MTQ3LjE1NEMyMjguMTQ1LDQxNy4wMTIsMjMzLjk5Niw0MjIuODYzLDI0MS4yMTQsNDIyLjg2M3oiIGZpbGw9IiM3ZDdkN2QiLz4KCQk8cGF0aCBkPSJNMzExLjI4NCw0MjIuODYzYzcuMjE3LDAsMTMuMDY4LTUuODUzLDEzLjA2OC0xMy4wNjhWMjYyLjY0MWMwLTcuMjE2LTUuODUyLTEzLjA3LTEzLjA2OC0xMy4wNyAgICBjLTcuMjE5LDAtMTMuMDcsNS44NTQtMTMuMDcsMTMuMDd2MTQ3LjE1NEMyOTguMjEzLDQxNy4wMTIsMzA0LjA2Nyw0MjIuODYzLDMxMS4yODQsNDIyLjg2M3oiIGZpbGw9IiM3ZDdkN2QiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K';

        revUtils.append(deleteActionLink, deleteIcon);
        revUtils.append(reactionsActionLink, reactionsIcon);
        revUtils.append(shareActionLink, shareIcon);
        //revUtils.append(actionsContainer, shareActionLink);
        //revUtils.append(actionsContainer, reactionsActionLink);
        revUtils.append(actionsContainer, deleteActionLink);

        revUtils.append(domainContainer, author);
        revUtils.append(domainContainer, domain);
        revUtils.append(domainRow, domainContainer);
        revUtils.append(domainRow, actionsContainer);

        revUtils.append(headlineContainer, date);
        headlineLink.href = data.url + "?utm_source=engageim";
        revUtils.append(headlineLink, headline);
        revUtils.append(headlineContainer, headlineLink);

        revUtils.append(categoryContainer, category);

        //revUtils.append(row, categoryContainer);
        revUtils.append(row, headlineContainer);
        revUtils.append(row, domainRow);
        revUtils.append(item, row);

        revUtils.prepend(that.bookmarksList, item);

        function extractHostname(url) {
          var hostname;
          //find & remove protocol (http, ftp, etc.) and get hostname

          if (url.indexOf("://") > -1) {
            hostname = url.split('/')[2];
          } else {
            hostname = url.split('/')[0];
          }

          //find & remove port number
          hostname = hostname.split(':')[0];
          //find & remove "?"
          hostname = hostname.split('?')[0];

          return hostname;
        }

        function extractRootDomain(url) {
          var domain = extractHostname(url),
            splitArr = domain.split('.'),
            arrLen = splitArr.length;
          if (arrLen > 2) {
            domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
            if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
              domain = splitArr[arrLen - 3] + '.' + domain;
            }
          }
          return domain;
        }
  };

  EngageBookmarksManager.prototype.getBookmarks = function () {
    var that = this;
    var options = {};
    if (that.options.authenticated) {
      if (that.options.jwt) {
        options.jwt = that.options.jwt;
      }
      revApi.xhr(that.options.actions_api_url + 'bookmarks', function (data) {
        that.options.user.bookmarks = data;
        console.log(that.options.user.bookmarks);
        for (var i = 0; i < data.length; i++) {
          that.addBookmarkItem(data[i]);
        }
      }, null, true, options);
    }
  };

  return EngageBookmarksManager;
}));