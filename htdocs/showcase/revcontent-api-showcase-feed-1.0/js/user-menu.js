/*
Project: EngageUserMenu
Version: 0.0.1
Author: john.burnette@revcontent.com
*/

(function (window, factory) {
  'use strict';
  window.EngageUserMenu = factory(window, window.revUtils, window.revDetect, window.revApi);

}(window, function factory(window, revUtils, revDetect, revApi) {
  'use strict';

  // These are the items for settings and friends. They are not in the items object to prevent them from being built in the UI until these features are available.

  // {
  //   name: 'Friends',
  //   icon: 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTcuMS4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ2NSA0NjUiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQ2NSA0NjU7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNjRweCIgaGVpZ2h0PSI2NHB4Ij4KPGc+Cgk8cGF0aCBkPSJNMTE3LjUsMTczYzM0LjQ2MiwwLDYyLjUtMjguMDM3LDYyLjUtNjIuNVMxNTEuOTYyLDQ4LDExNy41LDQ4UzU1LDc2LjAzNyw1NSwxMTAuNVM4My4wMzgsMTczLDExNy41LDE3M3ogTTExNy41LDYzICAgYzI2LjE5MSwwLDQ3LjUsMjEuMzA5LDQ3LjUsNDcuNVMxNDMuNjkxLDE1OCwxMTcuNSwxNThTNzAsMTM2LjY5MSw3MCwxMTAuNVM5MS4zMDksNjMsMTE3LjUsNjN6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8cGF0aCBkPSJNMjgyLjUsMTczYzM0LjQ2MiwwLDYyLjUtMjguMDM3LDYyLjUtNjIuNVMzMTYuOTYyLDQ4LDI4Mi41LDQ4UzIyMCw3Ni4wMzcsMjIwLDExMC41UzI0OC4wMzgsMTczLDI4Mi41LDE3M3ogTTI4Mi41LDYzICAgYzI2LjE5MSwwLDQ3LjUsMjEuMzA5LDQ3LjUsNDcuNVMzMDguNjkxLDE1OCwyODIuNSwxNThTMjM1LDEzNi42OTEsMjM1LDExMC41UzI1Ni4zMDksNjMsMjgyLjUsNjN6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8cGF0aCBkPSJNMzYzLjY1NiwyNTYuODgyYzEuNDc4LDEuOTEyLDMuNjk3LDIuOTE1LDUuOTQsMi45MTRjMS42MDEsMCwzLjIxNS0wLjUxMSw0LjU4MS0xLjU2NSAgIGMzLjI3OC0yLjUzMywzLjg4MS03LjI0MywxLjM0OS0xMC41MjFDMzUzLjA3NywyMTguNjYsMzE5LjE3LDIwMiwyODIuNSwyMDJjLTIzLjU0NSwwLTQ2LjI2NCw2Ljk0LTY1LjcsMjAuMDcxICAgYy0zLjQzMywyLjMxOS00LjMzNSw2Ljk4MS0yLjAxNywxMC40MTNjMi4zMiwzLjQzNCw2Ljk4Miw0LjMzNiwxMC40MTMsMi4wMTdDMjQyLjE0NCwyMjMuMDUyLDI2MS45NTksMjE3LDI4Mi41LDIxNyAgIEMzMTQuNDg5LDIxNywzNDQuMDcsMjMxLjUzNiwzNjMuNjU2LDI1Ni44ODJ6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8cGF0aCBkPSJNMTE3LjUsMjAyQzUyLjcxLDIwMiwwLDI1NC43MSwwLDMxOS41YzAsNC4xNDMsMy4zNTgsNy41LDcuNSw3LjVzNy41LTMuMzU3LDcuNS03LjVDMTUsMjYyLjk4MSw2MC45ODEsMjE3LDExNy41LDIxNyAgIFMyMjAsMjYyLjk4MSwyMjAsMzE5LjVjMCw0LjE0MywzLjM1OCw3LjUsNy41LDcuNXM3LjUtMy4zNTcsNy41LTcuNUMyMzUsMjU0LjcxLDE4Mi4yOSwyMDIsMTE3LjUsMjAyeiIgZmlsbD0iIzAwMDAwMCIvPgoJPHBhdGggZD0iTTM5Mi41LDI3MmMtMzkuOTc3LDAtNzIuNSwzMi41MjMtNzIuNSw3Mi41czMyLjUyMyw3Mi41LDcyLjUsNzIuNXM3Mi41LTMyLjUyMyw3Mi41LTcyLjVTNDMyLjQ3NywyNzIsMzkyLjUsMjcyeiAgICBNMzkyLjUsNDAyYy0zMS43MDYsMC01Ny41LTI1Ljc5NC01Ny41LTU3LjVzMjUuNzk0LTU3LjUsNTcuNS01Ny41czU3LjUsMjUuNzk0LDU3LjUsNTcuNVM0MjQuMjA2LDQwMiwzOTIuNSw0MDJ6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8cGF0aCBkPSJNNDE3LjUsMzM3SDQwMHYtMTcuNWMwLTQuMTQzLTMuMzU4LTcuNS03LjUtNy41cy03LjUsMy4zNTctNy41LDcuNVYzMzdoLTE3LjVjLTQuMTQyLDAtNy41LDMuMzU3LTcuNSw3LjUgICBzMy4zNTgsNy41LDcuNSw3LjVIMzg1djE3LjVjMCw0LjE0MywzLjM1OCw3LjUsNy41LDcuNXM3LjUtMy4zNTcsNy41LTcuNVYzNTJoMTcuNWM0LjE0MiwwLDcuNS0zLjM1Nyw3LjUtNy41ICAgUzQyMS42NDIsMzM3LDQxNy41LDMzN3oiIGZpbGw9IiMwMDAwMDAiLz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K'
  // }, {
  //   name: 'Settings',
  //   icon: 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU0IDU0IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1NCA1NDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiPgo8Zz4KCTxwYXRoIGQ9Ik01MS4yMiwyMWgtNS4wNTJjLTAuODEyLDAtMS40ODEtMC40NDctMS43OTItMS4xOTdzLTAuMTUzLTEuNTQsMC40Mi0yLjExNGwzLjU3Mi0zLjU3MSAgIGMwLjUyNS0wLjUyNSwwLjgxNC0xLjIyNCwwLjgxNC0xLjk2NmMwLTAuNzQzLTAuMjg5LTEuNDQxLTAuODE0LTEuOTY3bC00LjU1My00LjU1M2MtMS4wNS0xLjA1LTIuODgxLTEuMDUyLTMuOTMzLDBsLTMuNTcxLDMuNTcxICAgYy0wLjU3NCwwLjU3My0xLjM2NiwwLjczMy0yLjExNCwwLjQyMUMzMy40NDcsOS4zMTMsMzMsOC42NDQsMzMsNy44MzJWMi43OEMzMywxLjI0NywzMS43NTMsMCwzMC4yMiwwSDIzLjc4ICAgQzIyLjI0NywwLDIxLDEuMjQ3LDIxLDIuNzh2NS4wNTJjMCwwLjgxMi0wLjQ0NywxLjQ4MS0xLjE5NywxLjc5MmMtMC43NDgsMC4zMTMtMS41NCwwLjE1Mi0yLjExNC0wLjQyMWwtMy41NzEtMy41NzEgICBjLTEuMDUyLTEuMDUyLTIuODgzLTEuMDUtMy45MzMsMGwtNC41NTMsNC41NTNjLTAuNTI1LDAuNTI1LTAuODE0LDEuMjI0LTAuODE0LDEuOTY3YzAsMC43NDIsMC4yODksMS40NCwwLjgxNCwxLjk2NmwzLjU3MiwzLjU3MSAgIGMwLjU3MywwLjU3NCwwLjczLDEuMzY0LDAuNDIsMi4xMTRTOC42NDQsMjEsNy44MzIsMjFIMi43OEMxLjI0NywyMSwwLDIyLjI0NywwLDIzLjc4djYuNDM5QzAsMzEuNzUzLDEuMjQ3LDMzLDIuNzgsMzNoNS4wNTIgICBjMC44MTIsMCwxLjQ4MSwwLjQ0NywxLjc5MiwxLjE5N3MwLjE1MywxLjU0LTAuNDIsMi4xMTRsLTMuNTcyLDMuNTcxYy0wLjUyNSwwLjUyNS0wLjgxNCwxLjIyNC0wLjgxNCwxLjk2NiAgIGMwLDAuNzQzLDAuMjg5LDEuNDQxLDAuODE0LDEuOTY3bDQuNTUzLDQuNTUzYzEuMDUxLDEuMDUxLDIuODgxLDEuMDUzLDMuOTMzLDBsMy41NzEtMy41NzJjMC41NzQtMC41NzMsMS4zNjMtMC43MzEsMi4xMTQtMC40MiAgIGMwLjc1LDAuMzExLDEuMTk3LDAuOTgsMS4xOTcsMS43OTJ2NS4wNTJjMCwxLjUzMywxLjI0NywyLjc4LDIuNzgsMi43OGg2LjQzOWMxLjUzMywwLDIuNzgtMS4yNDcsMi43OC0yLjc4di01LjA1MiAgIGMwLTAuODEyLDAuNDQ3LTEuNDgxLDEuMTk3LTEuNzkyYzAuNzUxLTAuMzEyLDEuNTQtMC4xNTMsMi4xMTQsMC40MmwzLjU3MSwzLjU3MmMxLjA1MiwxLjA1MiwyLjg4MywxLjA1LDMuOTMzLDBsNC41NTMtNC41NTMgICBjMC41MjUtMC41MjUsMC44MTQtMS4yMjQsMC44MTQtMS45NjdjMC0wLjc0Mi0wLjI4OS0xLjQ0LTAuODE0LTEuOTY2bC0zLjU3Mi0zLjU3MWMtMC41NzMtMC41NzQtMC43My0xLjM2NC0wLjQyLTIuMTE0ICAgUzQ1LjM1NiwzMyw0Ni4xNjgsMzNoNS4wNTJjMS41MzMsMCwyLjc4LTEuMjQ3LDIuNzgtMi43OFYyMy43OEM1NCwyMi4yNDcsNTIuNzUzLDIxLDUxLjIyLDIxeiBNNTIsMzAuMjIgICBDNTIsMzAuNjUsNTEuNjUsMzEsNTEuMjIsMzFoLTUuMDUyYy0xLjYyNCwwLTMuMDE5LDAuOTMyLTMuNjQsMi40MzJjLTAuNjIyLDEuNS0wLjI5NSwzLjE0NiwwLjg1NCw0LjI5NGwzLjU3MiwzLjU3MSAgIGMwLjMwNSwwLjMwNSwwLjMwNSwwLjgsMCwxLjEwNGwtNC41NTMsNC41NTNjLTAuMzA0LDAuMzA0LTAuNzk5LDAuMzA2LTEuMTA0LDBsLTMuNTcxLTMuNTcyYy0xLjE0OS0xLjE0OS0yLjc5NC0xLjQ3NC00LjI5NC0wLjg1NCAgIGMtMS41LDAuNjIxLTIuNDMyLDIuMDE2LTIuNDMyLDMuNjR2NS4wNTJDMzEsNTEuNjUsMzAuNjUsNTIsMzAuMjIsNTJIMjMuNzhDMjMuMzUsNTIsMjMsNTEuNjUsMjMsNTEuMjJ2LTUuMDUyICAgYzAtMS42MjQtMC45MzItMy4wMTktMi40MzItMy42NGMtMC41MDMtMC4yMDktMS4wMjEtMC4zMTEtMS41MzMtMC4zMTFjLTEuMDE0LDAtMS45OTcsMC40LTIuNzYxLDEuMTY0bC0zLjU3MSwzLjU3MiAgIGMtMC4zMDYsMC4zMDYtMC44MDEsMC4zMDQtMS4xMDQsMGwtNC41NTMtNC41NTNjLTAuMzA1LTAuMzA1LTAuMzA1LTAuOCwwLTEuMTA0bDMuNTcyLTMuNTcxYzEuMTQ4LTEuMTQ4LDEuNDc2LTIuNzk0LDAuODU0LTQuMjk0ICAgQzEwLjg1MSwzMS45MzIsOS40NTYsMzEsNy44MzIsMzFIMi43OEMyLjM1LDMxLDIsMzAuNjUsMiwzMC4yMlYyMy43OEMyLDIzLjM1LDIuMzUsMjMsMi43OCwyM2g1LjA1MiAgIGMxLjYyNCwwLDMuMDE5LTAuOTMyLDMuNjQtMi40MzJjMC42MjItMS41LDAuMjk1LTMuMTQ2LTAuODU0LTQuMjk0bC0zLjU3Mi0zLjU3MWMtMC4zMDUtMC4zMDUtMC4zMDUtMC44LDAtMS4xMDRsNC41NTMtNC41NTMgICBjMC4zMDQtMC4zMDUsMC43OTktMC4zMDUsMS4xMDQsMGwzLjU3MSwzLjU3MWMxLjE0NywxLjE0NywyLjc5MiwxLjQ3Niw0LjI5NCwwLjg1NEMyMi4wNjgsMTAuODUxLDIzLDkuNDU2LDIzLDcuODMyVjIuNzggICBDMjMsMi4zNSwyMy4zNSwyLDIzLjc4LDJoNi40MzlDMzAuNjUsMiwzMSwyLjM1LDMxLDIuNzh2NS4wNTJjMCwxLjYyNCwwLjkzMiwzLjAxOSwyLjQzMiwzLjY0ICAgYzEuNTAyLDAuNjIyLDMuMTQ2LDAuMjk0LDQuMjk0LTAuODU0bDMuNTcxLTMuNTcxYzAuMzA2LTAuMzA1LDAuODAxLTAuMzA1LDEuMTA0LDBsNC41NTMsNC41NTNjMC4zMDUsMC4zMDUsMC4zMDUsMC44LDAsMS4xMDQgICBsLTMuNTcyLDMuNTcxYy0xLjE0OCwxLjE0OC0xLjQ3NiwyLjc5NC0wLjg1NCw0LjI5NGMwLjYyMSwxLjUsMi4wMTYsMi40MzIsMy42NCwyLjQzMmg1LjA1MkM1MS42NSwyMyw1MiwyMy4zNSw1MiwyMy43OFYzMC4yMnoiIGZpbGw9IiMwMDAwMDAiLz4KCTxwYXRoIGQ9Ik0yNywxOGMtNC45NjMsMC05LDQuMDM3LTksOXM0LjAzNyw5LDksOXM5LTQuMDM3LDktOVMzMS45NjMsMTgsMjcsMTh6IE0yNywzNGMtMy44NTksMC03LTMuMTQxLTctN3MzLjE0MS03LDctNyAgIHM3LDMuMTQxLDcsN1MzMC44NTksMzQsMjcsMzR6IiBmaWxsPSIjMDAwMDAwIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg=='
  // }

  // {
  //   name: 'Interests',
  //   icon: 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxLjk5NyA1MS45OTciIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxLjk5NyA1MS45OTc7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8Zz4KCTxwYXRoIGQ9Ik01MS45MTEsMTYuMjQyQzUxLjE1Miw3Ljg4OCw0NS4yMzksMS44MjcsMzcuODM5LDEuODI3Yy00LjkzLDAtOS40NDQsMi42NTMtMTEuOTg0LDYuOTA1ICAgYy0yLjUxNy00LjMwNy02Ljg0Ni02LjkwNi0xMS42OTctNi45MDZjLTcuMzk5LDAtMTMuMzEzLDYuMDYxLTE0LjA3MSwxNC40MTVjLTAuMDYsMC4zNjktMC4zMDYsMi4zMTEsMC40NDIsNS40NzggICBjMS4wNzgsNC41NjgsMy41NjgsOC43MjMsNy4xOTksMTIuMDEzbDE4LjExNSwxNi40MzlsMTguNDI2LTE2LjQzOGMzLjYzMS0zLjI5MSw2LjEyMS03LjQ0NSw3LjE5OS0xMi4wMTQgICBDNTIuMjE2LDE4LjU1Myw1MS45NywxNi42MTEsNTEuOTExLDE2LjI0MnogTTQ5LjUyMSwyMS4yNjFjLTAuOTg0LDQuMTcyLTMuMjY1LDcuOTczLTYuNTksMTAuOTg1TDI1Ljg1NSw0Ny40ODFMOS4wNzIsMzIuMjUgICBjLTMuMzMxLTMuMDE4LTUuNjExLTYuODE4LTYuNTk2LTEwLjk5Yy0wLjcwOC0yLjk5Ny0wLjQxNy00LjY5LTAuNDE2LTQuNzAxbDAuMDE1LTAuMTAxQzIuNzI1LDkuMTM5LDcuODA2LDMuODI2LDE0LjE1OCwzLjgyNiAgIGM0LjY4NywwLDguODEzLDIuODgsMTAuNzcxLDcuNTE1bDAuOTIxLDIuMTgzbDAuOTIxLTIuMTgzYzEuOTI3LTQuNTY0LDYuMjcxLTcuNTE0LDExLjA2OS03LjUxNCAgIGM2LjM1MSwwLDExLjQzMyw1LjMxMywxMi4wOTYsMTIuNzI3QzQ5LjkzOCwxNi41Nyw1MC4yMjksMTguMjY0LDQ5LjUyMSwyMS4yNjF6IiBmaWxsPSIjMDAwMDAwIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg=='
  // },



  var EngageUserMenu = function (opts) {
    var defaults = {
      items: [
        {
          name: 'Settings',
          icon: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPiAgICA8cGF0aCBkPSJNMTkuNDMgMTIuOThjLjA0LS4zMi4wNy0uNjQuMDctLjk4cy0uMDMtLjY2LS4wNy0uOThsMi4xMS0xLjY1Yy4xOS0uMTUuMjQtLjQyLjEyLS42NGwtMi0zLjQ2Yy0uMTItLjIyLS4zOS0uMy0uNjEtLjIybC0yLjQ5IDFjLS41Mi0uNC0xLjA4LS43My0xLjY5LS45OGwtLjM4LTIuNjVDMTQuNDYgMi4xOCAxNC4yNSAyIDE0IDJoLTRjLS4yNSAwLS40Ni4xOC0uNDkuNDJsLS4zOCAyLjY1Yy0uNjEuMjUtMS4xNy41OS0xLjY5Ljk4bC0yLjQ5LTFjLS4yMy0uMDktLjQ5IDAtLjYxLjIybC0yIDMuNDZjLS4xMy4yMi0uMDcuNDkuMTIuNjRsMi4xMSAxLjY1Yy0uMDQuMzItLjA3LjY1LS4wNy45OHMuMDMuNjYuMDcuOThsLTIuMTEgMS42NWMtLjE5LjE1LS4yNC40Mi0uMTIuNjRsMiAzLjQ2Yy4xMi4yMi4zOS4zLjYxLjIybDIuNDktMWMuNTIuNCAxLjA4LjczIDEuNjkuOThsLjM4IDIuNjVjLjAzLjI0LjI0LjQyLjQ5LjQyaDRjLjI1IDAgLjQ2LS4xOC40OS0uNDJsLjM4LTIuNjVjLjYxLS4yNSAxLjE3LS41OSAxLjY5LS45OGwyLjQ5IDFjLjIzLjA5LjQ5IDAgLjYxLS4yMmwyLTMuNDZjLjEyLS4yMi4wNy0uNDktLjEyLS42NGwtMi4xMS0xLjY1ek0xMiAxNS41Yy0xLjkzIDAtMy41LTEuNTctMy41LTMuNXMxLjU3LTMuNSAzLjUtMy41IDMuNSAxLjU3IDMuNSAzLjUtMS41NyAzLjUtMy41IDMuNXoiLz48L3N2Zz4='
        },
        {
        name: 'Bookmarks',
<<<<<<< HEAD
        icon: 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDYwIDYwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA2MCA2MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiPgo8cGF0aCBkPSJNMTMsMGMtMS41NDcsMC0zLjAzMywwLjY2Mi00LjA3OCwxLjgxN0M3Ljg5NSwyLjk1NCw3LjM4OSw0LjQ3Niw3LjUyNSw2SDcuNXY0OC45NThDNy41LDU3LjczOCw5Ljc2Miw2MCwxMi41NDIsNjBINTIuNVYxMSAgVjlWMEgxM3ogTTkuNSw1NC45NThWOS45OThjMC44MzYsMC42MjksMS44NzUsMS4wMDIsMywxLjAwMnY0Ni45OTZDMTAuODQyLDU3Ljk3Myw5LjUsNTYuNjIxLDkuNSw1NC45NTh6IE01MC41LDU4aC0zNlYxMWgzdjI1LjIwMSAgYzAsMC42ODIsMC40NDEsMS4yNjIsMS4wOTksMS40NDRjMC4xMzcsMC4wMzcsMC4yNzMsMC4wNTYsMC40MDgsMC4wNTZjMC4wMTUsMCwwLjAyOS0wLjAwNSwwLjA0NC0wLjAwNiAgYzAuMDQ1LTAuMDAxLDAuMDg4LTAuMDEyLDAuMTMzLTAuMDE3YzAuMTAzLTAuMDEyLDAuMjAyLTAuMDMzLDAuMjk5LTAuMDY2YzAuMDQ4LTAuMDE2LDAuMDkzLTAuMDM1LDAuMTM4LTAuMDU2ICBjMC4wOTQtMC4wNDMsMC4xOC0wLjA5NywwLjI2My0wLjE1OWMwLjAzNi0wLjAyNywwLjA3My0wLjA1LDAuMTA2LTAuMDhjMC4xMTEtMC4wOTksMC4yMTItMC4yMTEsMC4yOTItMC4zNDZsNC4yMTctNy4wMjggIGw0LjIxNyw3LjAyOWMwLjMyNywwLjU0NSwwLjkzOSwwLjgwMSwxLjU1LDAuNjg3YzAuMDQ1LTAuMDA4LDAuMDg5LTAuMDAyLDAuMTM0LTAuMDE0YzAuNjU3LTAuMTgzLDEuMDk5LTAuNzYzLDEuMDk5LTEuNDQ0VjExaDE5ICBWNTh6IE0yOS42NCw5LjQ4M2wtMC4wMDMsMC4wMDdMMjkuNSw5Ljc2NHYwLjA0MmwtMC4xLDAuMjNsMC4xLDAuMTUydjAuMTEyVjM0LjM5bC01LTguMzMzbC01LDguMzMzVjEwLjIzNkwyMS4xMTgsN2g5Ljc2NCAgTDI5LjY0LDkuNDgzeiBNMzIuMTE4LDlsMi00SDE5Ljg4MmwtMiw0aC00LjY3Yy0xLjg5NCwwLTMuNTE2LTEuMzc5LTMuNjkzLTMuMTRjLTAuMTAxLTAuOTk4LDAuMjE0LTEuOTU3LDAuODg3LTIuNzAxICBDMTEuMDcxLDIuNDIyLDEyLjAxNywyLDEzLDJoMzcuNXYxaC01Yy0wLjU1MywwLTEsMC40NDctMSwxczAuNDQ3LDEsMSwxaDV2MWgtNGMtMC41NTMsMC0xLDAuNDQ3LTEsMXMwLjQ0NywxLDEsMWg0djFIMzIuMTE4eiIgZmlsbD0iIzAwMDAwMCIvPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K'
      }, {
        name: 'Logout',
        icon: 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDU1IDU1IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1NSA1NTsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCI+CjxnPgoJPHBhdGggZD0iTTUzLjkyNCwyNC4zODJjMC4xMDEtMC4yNDQsMC4xMDEtMC41MTksMC0wLjc2NGMtMC4wNTEtMC4xMjMtMC4xMjUtMC4yMzQtMC4yMTctMC4zMjdMNDEuNzA4LDExLjI5MyAgIGMtMC4zOTEtMC4zOTEtMS4wMjMtMC4zOTEtMS40MTQsMHMtMC4zOTEsMS4wMjMsMCwxLjQxNEw1MC41ODcsMjNIMjkuMDAxYy0wLjU1MywwLTEsMC40NDctMSwxczAuNDQ3LDEsMSwxaDIxLjU4Nkw0MC4yOTQsMzUuMjkzICAgYy0wLjM5MSwwLjM5MS0wLjM5MSwxLjAyMywwLDEuNDE0QzQwLjQ4OSwzNi45MDIsNDAuNzQ1LDM3LDQxLjAwMSwzN3MwLjUxMi0wLjA5OCwwLjcwNy0wLjI5M2wxMS45OTktMTEuOTk5ICAgQzUzLjc5OSwyNC42MTYsNTMuODczLDI0LjUwNSw1My45MjQsMjQuMzgyeiIgZmlsbD0iIzAwMDAwMCIvPgoJPHBhdGggZD0iTTM2LjAwMSwyOWMtMC41NTMsMC0xLDAuNDQ3LTEsMXYxNmgtMTBWOGMwLTAuNDM2LTAuMjgyLTAuODIxLTAuNjk3LTAuOTUzTDguNDQyLDJoMjYuNTU5djE2YzAsMC41NTMsMC40NDcsMSwxLDEgICBzMS0wLjQ0NywxLTFWMWMwLTAuNTUzLTAuNDQ3LTEtMS0xaC0zNGMtMC4wMzIsMC0wLjA2LDAuMDE1LTAuMDkxLDAuMDE4QzEuODU0LDAuMDIzLDEuODA1LDAuMDM2LDEuNzUyLDAuMDUgICBDMS42NTgsMC4wNzUsMS41NzQsMC4xMDksMS40OTMsMC4xNThDMS40NjcsMC4xNzQsMS40MzYsMC4xNzQsMS40MTEsMC4xOTJDMS4zOCwwLjIxNSwxLjM1NiwwLjI0NCwxLjMyOCwwLjI2OSAgIGMtMC4wMTcsMC4wMTYtMC4wMzUsMC4wMy0wLjA1MSwwLjA0N0MxLjIwMSwwLjM5OCwxLjEzOSwwLjQ4OSwxLjA5MywwLjU4OWMtMC4wMDksMC4wMi0wLjAxNCwwLjA0LTAuMDIyLDAuMDYgICBDMS4wMjksMC43NjEsMS4wMDEsMC44NzgsMS4wMDEsMXY0NmMwLDAuMTI1LDAuMDI5LDAuMjQzLDAuMDcyLDAuMzU1YzAuMDE0LDAuMDM3LDAuMDM1LDAuMDY4LDAuMDUzLDAuMTAzICAgYzAuMDM3LDAuMDcxLDAuMDc5LDAuMTM2LDAuMTMyLDAuMTk2YzAuMDI5LDAuMDMyLDAuMDU4LDAuMDYxLDAuMDksMC4wOWMwLjA1OCwwLjA1MSwwLjEyMywwLjA5MywwLjE5MywwLjEzICAgYzAuMDM3LDAuMDIsMC4wNzEsMC4wNDEsMC4xMTEsMC4wNTZjMC4wMTcsMC4wMDYsMC4wMywwLjAxOCwwLjA0NywwLjAyNGwyMiw3QzIzLjc5Nyw1NC45ODQsMjMuODk5LDU1LDI0LjAwMSw1NSAgIGMwLjIxLDAsMC40MTctMC4wNjYsMC41OS0wLjE5MmMwLjI1OC0wLjE4OCwwLjQxLTAuNDg4LDAuNDEtMC44MDh2LTZoMTFjMC41NTMsMCwxLTAuNDQ3LDEtMVYzMCAgIEMzNy4wMDEsMjkuNDQ3LDM2LjU1MywyOSwzNi4wMDEsMjl6IE0yMy4wMDEsNTIuNjMzbC0yMC02LjM2NFYyLjM2N2wyMCw2LjM2NFY1Mi42MzN6IiBmaWxsPSIjMDAwMDAwIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg=='
=======
        icon: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDAwMDAwIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTE3IDNIN2MtMS4xIDAtMS45OS45LTEuOTkgMkw1IDIxbDctMyA3IDNWNWMwLTEuMS0uOS0yLTItMnoiLz4gICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=='
>>>>>>> s2
      }],
      actions_api_url: 'https://api.engage.im/' + opts.env + '/actions/'
    };
    this.options = Object.assign(defaults, opts);
    this.init();
  };
  EngageUserMenu.prototype.init = function () {
    var that = this;

    this.menuContainer = document.createElement('div');
    this.menuContainer.id = 'eng-feed-user-menu-container';

    this.menuHeader = document.createElement('div');
    revUtils.addClass(this.menuHeader, 'eng-feed-user-menu-header');

    this.menuAction = document.createElement('div');
    revUtils.addClass(this.menuAction, 'eng-feed-user-menu-action');
    revUtils.addClass(this.menuAction, 'animated');
    this.menuActionBtn = document.createElement('a');
    revUtils.addClass(this.menuActionBtn, 'eng-feed-user-menu-action-link');

    this.menuActionBtnIcon = document.createElement('img');

    revUtils.append(this.menuActionBtn, this.menuActionBtnIcon);
    revUtils.append(this.menuAction, this.menuActionBtn);
    revUtils.append(this.menuHeader, this.menuAction);
    this.userAvatarContainer = document.createElement('div');
    revUtils.addClass(this.userAvatarContainer, 'eng-feed-user-avatar');
    revUtils.addClass(this.userAvatarContainer, 'animated');
    revUtils.addClass(this.userAvatarContainer, 'zoomInDown');

    this.userAvatarGraphic = document.createElement('div');
    revUtils.addClass(this.userAvatarGraphic, 'eng-feed-user-avatar-photo');

    this.userAvatarEditContainer = document.createElement('div');
    revUtils.addClass(this.userAvatarEditContainer, 'eng-feed-user-avatar-edit');

    this.userAvatarEditContainerLink = document.createElement('a');

    revUtils.append(this.userAvatarEditContainer, this.userAvatarEditContainerLink);
    revUtils.append(this.userAvatarContainer, this.userAvatarGraphic);
    revUtils.append(this.userAvatarContainer, this.userAvatarEditContainer);

    this.userNameContainer = document.createElement('div');
    revUtils.addClass(this.userNameContainer, 'eng-feed-user-display-name');

    // this.userStatsContainer = document.createElement('div');
    // revUtils.addClass(this.userStatsContainer, 'eng-feed-user-stats');
    // this.userStatsContainer.innerHTML = '2.1K Friends &middot; 500 Bookmarks';

    this.userFeedMenuContainer = document.createElement('div');
    revUtils.addClass(this.userFeedMenuContainer, 'eng-feed-user-menu-options-container');

    this.userFeedMenu = document.createElement('ul');
    revUtils.addClass(this.userFeedMenu, 'eng-feed-user-menu-options');


    revUtils.append(this.userFeedMenuContainer, this.userFeedMenu);

    this.notificationsContainer = document.createElement('div');
    revUtils.addClass(this.notificationsContainer, 'eng-feed-user-notifications-container');

    this.notificationsContainerOptionsRow = document.createElement('div');
    this.notificationsContainerOptionsRow.className = 'eng-feed-user-options-row';

    //
    // Notifications are a future option, disabled for now
    //
    // this.notificationsToggleContainer = document.createElement('div');
    // revUtils.addClass(this.notificationsToggleContainer, 'notifications-toggle');

    // this.notificationsToggleBtn = document.createElement('div');
    // revUtils.addClass(this.notificationsToggleBtn, 'togglebutton');

    // this.notificationsToggleBtnLabel = document.createElement('label');

    // this.notificationsToggleBtnInput = document.createElement('input');
    // revUtils.addClass(this.notificationsToggleBtnInput, 'toggle-info');
    // this.notificationsToggleBtnInput.type = 'checkbox';
    // this.notificationsToggleAfterSpan = document.createElement('span');
    // revUtils.addClass(this.notificationsToggleAfterSpan, 'toggle');

    // this.notificationsToggleLabel = document.createElement('span');
    // revUtils.addClass(this.notificationsToggleLabel, 'notifications-toggle-label');
    // this.notificationsToggleLabel.innerHTML = "Notifications";

    this.engageBrandingContainer = document.createElement('div');
    this.engageBrandingContainer.className = 'eng-branding';

    this.engageBrandingIconContainer = document.createElement('span');
    this.engageBrandingIcon = document.createElement('img');
    this.engageBrandingIcon.className = 'eng-brand-icon';
    //TODO: Find a better way to display this
    this.engageBrandingIcon.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMEAAADACAMAAACKwPcLAAAC9FBMVEX///8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv8Anv9j+5FBAAAA+3RSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldZWltc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";

    //
    //TODO: hook up notifications action when that feature is implemented
    //
    // revUtils.append(this.notificationsToggleBtnLabel, this.notificationsToggleBtnInput);
    // revUtils.append(this.notificationsToggleBtnLabel, this.notificationsToggleAfterSpan);
    // revUtils.append(this.notificationsToggleBtn, this.notificationsToggleBtnLabel);
    // revUtils.append(this.notificationsToggleContainer, this.notificationsToggleBtn);
    // revUtils.append(this.notificationsContainerOptionsRow, this.notificationsToggleContainer);
    // revUtils.append(this.notificationsContainerOptionsRow, this.notificationsToggleLabel);
    revUtils.append(this.engageBrandingIconContainer, this.engageBrandingIcon);
    revUtils.append(this.engageBrandingContainer, this.engageBrandingIconContainer);
    revUtils.append(this.notificationsContainerOptionsRow, this.engageBrandingContainer);
    revUtils.append(this.notificationsContainer, this.notificationsContainerOptionsRow);

    revUtils.append(this.menuContainer, this.menuHeader);
    revUtils.append(this.menuContainer, this.userAvatarContainer);
    revUtils.append(this.menuContainer, this.userNameContainer);

    // Disabled for now, need to find a good way to get a count for these
    // revUtils.append(this.menuContainer, this.userStatsContainer);
    revUtils.append(this.menuContainer, this.userFeedMenu);
    revUtils.append(this.menuContainer, this.notificationsContainer);


    //We're done, add the panel to the page.
    revUtils.append(document.body, this.menuContainer);
    this.options.emitter.on('loadUserData', function (authenticated) {
      that.options.authenticated = authenticated;
      that.loadUserData();
    });

    this.options.emitter.on('menu-closed', function() {
      var bookmarks = document.getElementById('eng-bookmarks-container');
      revUtils.removeClass(document.body, 'animate-user-profile');
      revUtils.removeClass(document.body, 'profile-mask-show');
    });
    this.loadUserData();
    this.createMenuItems();
  };

  EngageUserMenu.prototype.createMenuItems = function () {
    var that = this;
    for (var i = 0; i < this.options.items.length; i++) {
      var item = document.createElement('li');
      revUtils.addClass(item, 'animated');
      revUtils.addClass(item, 'flipInX');
      var anchor = document.createElement('a');
      anchor.id = this.options.items[i].name;
      revUtils.addClass(anchor, 'animated');
      revUtils.addClass(anchor, 'zoomInRight');
      anchor.innerHTML = this.options.items[i].name;
      revUtils.addEventListener(anchor, 'click', function (e) {
<<<<<<< HEAD
        if (this.id === 'Bookmarks') {
=======
        if (this.id === "Settings") {
          if (that.userSettings) {
            revUtils.addClass(that.userSettings.bookmarksContainer, 'is-open');
          } else {
            that.userSettings = that.createUserSettings(that.options);
            setTimeout(function() {
              revUtils.addClass(that.userSettings.bookmarksContainer, 'is-open');
            }, 100);
          }
        }
        if (this.id === "Bookmarks") {
>>>>>>> s2
          var bookmarks = document.getElementById('eng-bookmarks-container');
          if (bookmarks) {
            revUtils.addClass(bookmarks, 'is-open');
          } else {
            that.bookmarks = that.createBookmarks(that.options);
            bookmarks = document.getElementById('eng-bookmarks-container');
            setTimeout(function () {
              revUtils.addClass(bookmarks, 'is-open');
            }, 100);
          }
        } else if (this.id === 'Logout') {
          that.options.emitter.emitEvent('logout');
        }
      });

      var span = document.createElement('span');
      revUtils.addClass(span, 'eng-feed-user-menu-icon');
      revUtils.addClass(span, 'animated');
      revUtils.addClass(span, 'bounceInLeft');

      var icon = document.createElement('img');
      revUtils.addClass(icon, 'eng-feed-user-menu-icon-graphic');
      revUtils.addClass(icon, this.options.items[i].name.toLowerCase());
      icon.src = this.options.items[i].icon;

      revUtils.append(span, icon);
      revUtils.prepend(anchor, span);
      revUtils.append(item, anchor);
      revUtils.append(this.userFeedMenu, item);
    }
  };

  EngageUserMenu.prototype.createBookmarks = function (options) {
    return new EngageBookmarksManager(options);
  };

  EngageUserMenu.prototype.createUserSettings = function (options) {
    return new EngageUserSettings(options);
  };

  EngageUserMenu.prototype.loadUserData = function () {
    var that = this;
    if (that.options.authenticated) {
      if (that.options.user && that.options.user.picture) {
        that.userAvatarGraphic.style.backgroundImage = 'url(' + that.options.user.picture + ')';
        that.userNameContainer.innerHTML = revUtils.getName(that.options.user);
      }
    }
  };
  return EngageUserMenu;
}));