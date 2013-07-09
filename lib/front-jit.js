var path = require('path'),
	qs = require('querystring'),
	util = require('pegasus').util;

var PATTERN_V1_URL = /^\/(.*?)(?:\|(?:MODERN_BROWSER|OLD_BROWSER))?(?:\|v_([a-f0-9]+_[a-f0-9]+))?(\.js|\.css)(?:\?.*)?$/,

	PATTERN_V2_URL = /^\/(.*?)\?\?(.*?)(?:\?(.*))?$/,

	PATTERN_EXTNAME = /^\.(?:js|css)$/,

	// FrontJIT constructor.
	FrontJIT = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
		},

		/**
		 * Parse old style combo URL.
		 * @param url {string}
		 * @return {Object|null}
		 */
		_parseV1: function (url) {
			var re = url.match(PATTERN_V1_URL),
				params = {},
				pathnames = [],
				extname, base;

			if (!re) { // Not a JS or CSS request.
				return null;
			}

			if (re[2]) { // Version.
				params.t = re[2];
			}

			extname = re[3];

			if (extname === '.js') {
				base = [ 'js/5v/', 'css/' ];
			} else {
				base = [ 'css/', 'js/5v/' ];
			}

			re[1].split('|').forEach(function (value) {
				pathnames.push(value + extname);
			});

			return {
				base: base,
				pathnames: pathnames,
				params: params,
				type: extname
			};
		},

		/**
		 * Parse nginx style combo URL.
		 * @param url {string}
		 * @return {Object|null}
		 */
		_parseV2: function (url) {
			var re = url.match(PATTERN_V2_URL),
				base = re[1],
				pathnames = re[2],
				params = qs.parse(re[3] || ''),
				extname,
				conflict = false;

			pathnames = pathnames.split(',').map(function (pathname) {
				if (extname && path.extname(pathname) !== extname) {
					conflict = true;
				} else {
					extname = path.extname(pathname);
				}

				return base + pathname;
			});

			return conflict || !PATTERN_EXTNAME.test(extname) ? null : {
				base: [ '' ],
				pathnames: pathnames,
				params: params,
				type: extname
			};
		},

		/**
		 * Parse simple URL or combo URL.
		 * @param url {string}
		 * @return {Object|null}
		 */
		parse: function (url) {
			var ret = null;

			if (url.indexOf('|') !== -1) { // Old style combo URL.
				ret = this._parseV1(url);
			} else {
				if (url.indexOf('??') === -1) { // Convert simple URL to combo URL.
					url = url.replace('/', '/??');
				}
				ret = this._parseV2(url);
			}

			if (ret) {
				ret.pathnames = util.unique(ret.pathnames);
			}

			return ret;
		}
	});

module.exports = FrontJIT;
