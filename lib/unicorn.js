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
			var output = [];

			files.forEach(function (file) {
				output.push(file.data);
			});

			return output.join('\n');
		},

		/**
		 * Response with file contents.
		 * @param url {Object}
		 */
		_getFile: function (url) {
			var	config = this._config,
				source = this._source,
				response = this.context.response,
				now = new Date(),
				expires = config.normalExpires,
				data,
				self = this;

			source.load(url, function (files, stamp) {
				if (files.length === 0) {
					self._response404();
				} else {
					if (url.params.t) {
						expires = url.params.t === stamp ?
							config.longExpires : config.shortExpires;
					}

					data = self._refine(url.type, self._combine(files));

					self._response200(util.mime(url.type), now, expires, data, stamp);
				}
				self.next();
			});
		},

		/**
		 * Response with JSON version data.
		 * @param filter {string}
		 */
		_getVersion: function (filter) {
			var config = this._config,
				source = this._source,
				self = this;

			source.version(function (data) {
				self._response200('text/plain', new Date(), config.normalExpires, data);
			}, filter);
		},

		/**
		 * Response with flat version data.
		 */
		_getVersionData: function () {
			var config = this._config,
				source = this._source,
				self = this;

			source.versionData(function (data) {
				self._response200('text/plain', new Date(), config.normalExpires, data);
			});
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
			var replacement = this.context.request.protocol === 'https:' ?
					'https://stylessl.aliunicorn.com/' : 'http://i02.i.aliimg.com/',
				whitelist = {
					'//ipaystyle.alibaba.com': true
				};

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
		 * Setup 200 response.
		 * @param mime {string}
		 * @param mtime {Date}
		 * @param expires {number}
		 * @param data {string}
		 * @param [stamp] {string}
		 */
		_response200: function (mime, mtime, expires, data, stamp) {
			var response = this.context.response;

			response
				.status(200)
				.head('content-type', mime)
				.head('last-modified', mtime.toGMTString())
				.head('expires', new Date(mtime.getTime() + 1000 * expires).toGMTString())
				.head('cache-control', 'max-age=' + expires)
				.clear()
				.write(new Buffer(data, 'binary'));

			if (stamp) {
				response
					.head('x-unicorn-stamp', stamp);
			}

			this.next();
		},

		/**
		 * Setup 404 response.
		 */
		_response404: function () {
			var response = this.context.response;

			response
				.status(404)
				.head('content-type', 'text/plain')
				.clear()
				.write('404 Not Found');

			this.next();
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var front = this._front,
				pathname = request.pathname,
				url;

			if (pathname === '/version') {
				this._getVersion(request.query && request.query.filter);
			} else if (pathname === '/versionData.htm') {
				this._getVersionData();
			} else if (url = front.parse(request.path)) { // Assign.
				this._getFile(url);
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
