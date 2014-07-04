var url = require('url');

	/**
	 * Parse URL like "/foo/bar?a=b" or "/foo/??bar,baz?a=b".
	 * @param path {string}
	 * @return {Object}
	 */
var	parseURL = function (path) {
		var re, base, pathnames, pathname, i, len,
			requires = [],
			excludes = [],
			params;

		if (path.indexOf('??') !== -1) { // URL like "/foo/??bar,baz?a=b".
			// Extract base from URL.
			re = path.split('??');
			base = re[0];

			// Extract params from URL.
			re = re[1].split('?');
			params = parseQueryString(re[1]);

			// Split pathnames with separator ",".
			pathnames = re[0].split(',');

			// Join each pathname with base.
			for (i = 0, len = pathnames.length; i < len; ++i) {
				pathname = pathnames[i];
				if (pathname[0] === '-') {
					// Normalize URL and remove "../" or "./" for security.
					pathname = url.resolve('/', base + pathname.substring(1));
					// Remove leading slash.
					excludes.push(pathname.substring(1));
				} else {
					// Normalize URL and remove "../" or "./" for security.
					pathname = url.resolve('/', base + pathname);
					// Remove leading slash.
					requires.push(pathname.substring(1));
				}
			}
		} else { // URL like "/foo/bar?a=b".
			// Extract pathname and params from URL.
			re = path.split('?');
			pathname = re[0];
			params = parseQueryString(re[1]);

			// Normalize URL and remove "../" or "./" for security.
			pathname = url.resolve('/', pathname);
			// Remove leading slash.
			requires.push(pathname.substring(1));
		}

		return {
			requires: requires,
			excludes: excludes,
			params: params
		};
	},

	/**
	 * Convert query string to Object.
	 * @param qs {string}
	 * @return {Object}
	 */
	parseQueryString = function (qs) {
		var params = {},
			parts, kv, i, len;

		if (qs) {
			parts = qs.split('&');
			for (i = 0, len = parts.length; i < len; ++i) {
				kv = parts[i].split('=');
				params[kv[0]] = (kv[1] || ''); // Override the same key.
			}
		}

		return params;
	};

exports.parse = parseURL;
