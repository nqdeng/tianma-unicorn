var Front = require('./front'),
	Source = require('./source'),
	util = require('pegasus').util;

var PATTERN_IMAGE_URL = /url\s*\(\s*(["']?)([^"']+?\.(?:png|gif|jpg|jpeg)(?:\?[^"']+?)?)\1\s*\)/gi,

	PATTERN_URL = /^(\w+:)?(\/\/[^\/]+)?(\/)?(.+)$/,

	// Unicorn constructor.
	Unicorn = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;

			this._front = new Front();

			this._source = new Source({
				source: config.source
			});
		},

		/**
		 * Combine files.
		 * @param files {Array}
		 * @return {Buffer}
		 */
		_combine: function (files) {
			var config = this._config,
				output = [];

			files.forEach(function (file) {
				output.push(file.data);
			});

			return output.join('\n');
		},

		/**
		 * Response with file contents.
		 * @param url {Object}
		 */
		_getFile: function (url, etag) {
			var	config = this._config,
				source = this._source,
				expires = config.normalExpires,
				now = new Date(),
				self = this;

			source.load(url, function (stamp, getFiles) {
				if (url.params.t) {
					expires = url.params.t === stamp ?
						config.longExpires : config.shortExpires;
				}

				var headers = {
						'expires': new Date(now.getTime() + 1000 * expires).toGMTString(),
						'cache-control': 'max-age=' + expires,
						'last-modified': now.toGMTString(),
						'etag': stamp
					};

				if (etag === stamp) {
					self._response(304, headers);
				} else {
					getFiles(function (files) {
						if (files.length === 0) {
							self._response(404, {});
						} else {
							headers['content-type'] = util.mime(url.type);
							self._response(200, headers,
								self._refine(url.type, self._combine(files)));
						}
					});
				}
			});
		},

		/**
		 * Response with version data.
		 * @param fnName {string}
		 * @param etag {string}
		 * @param filter {string}
		 */
		_getVersion: function (fnName, etag, filter) {
			var config = this._config,
				source = this._source,
				expires = config.shortExpires,
				now = new Date(),
				self = this;

			source[fnName](function (hash, mtime, data) {
				var headers = {
						'expires': new Date(now.getTime() + 1000 * expires).toGMTString(),
						'cache-control': 'max-age=' + expires,
						'last-modified': mtime.toGMTString(),
						'etag': hash
					};

				if (etag === hash) {
					self._response(304, headers);
				} else {
					headers['content-type'] = 'text/plain';
					self._response(200, headers, data());
				}
			}, filter);
		},

		/**
		 * Refine output.
		 * @param extname {string}
		 * @param data {string}
		 * @return {string}
		 */
		_refine: function (extname, data) {
			if (extname === '.css') {
				data = this._relocateImage(data);
			}

			return data;
		},

		/**
		 * Relocate hostname in image URLs.
		 * @param data {string}
		 * @return {string}
		 */
		_relocateImage: function (data) {
			var config = this._config,
				replacement = this.context.request.protocol === 'https:' ?
					config.imageBaseSSL : config.imageBase,
				whitelist = config.imageBaseWhitelist;

			return data.replace(PATTERN_IMAGE_URL, function (all, quote, url) {
				var re = url.match(PATTERN_URL);

				if (re) {
					if (!re[1] && !re[2] && !re[3] || whitelist[re[2]]) {
						return all;
					} else {
						return 'url(' + quote + replacement + re[4] + quote + ')';
					}
				} else {
					return all;
				}
			});
		},

		/**
		 * Send response.
		 * @param statusCode {number}
		 * @param headers {Object}
		 * @param [data] {string}
		 */
		_response: function (statusCode, headers, data) {
			var response = this.context.response;

			response
				.status(statusCode)
				.head(headers)
				.clear();

			if (data) {
				response
					.write(new Buffer(data, 'binary'));
			}

			this.next();
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var context = this.context,
				front = this._front,
				pathname = request.pathname,
				etag = request.head('if-none-match'),
				url;

			if (pathname === '/version') {
				this._getVersion('version', etag, request.query && request.query.filter);
			} else if (pathname === '/versionData.htm') {
				this._getVersion('versionData', etag);
			} else if (url = front.parse(request.path, context.base)) { // Assign.
				this._getFile(url, etag);
			} else {
				this.next();
			}
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		match: function (request, response) {
			return request.method === 'GET'
				&& response.status() === 404;
		}
	});

module.exports = Unicorn;
