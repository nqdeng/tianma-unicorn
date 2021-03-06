var Front = require('./front'),
	Source = require('./source'),
	util = require('pegasus').util;

var	FONT_MIME = [
		'application/vnd.ms-fontobject',
		'application/x-font-ttf',
		'font/opentype',
		'application/x-font-woff',
		'application/font-woff'
	],

	PATTERN_TIMESTAMP = /^\d{4}\-\d{1,2}\-\d{1,2}$/,

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
				source: config.source,
				patch: config.patch
			});
		},

		/**
		 * Combine files.
		 * @param extname {String}
		 * @param files {Array}
		 * @return {Array}
		 */
		_combine: function (extname, files) {
			var output = [];

			files.forEach(function (file) {
				output.push(file.data);
			});

			return output;
		},

		/**
		 * Response with file contents.
		 * @param url {Object}
		 */
		_getFile: function (url) {
			var	config = this._config,
				source = this._source,
				type = url.type,
				now = new Date().getTime(),
				self = this,
				expires, v;

			// Default expires is different per type.
			if (type === '.js' || type === '.css') {
				expires = config.normalExpires;
			} else {
				expires = config.longExpires;
			}

			source.load(url, function (stamp, mtime, files) {
				if (url.params.t) {
					expires = url.params.t === stamp ?
						config.longExpires : config.shortExpires;
				} else if (v = url.params.v) { // Assign.
					if (PATTERN_TIMESTAMP.test(v) && !isNaN(v = new Date(v).getTime())) {
						if (v > now) {
							expires = config.normalExpires;
						} else {
							expires = config.longExpires;
						}
					} else {
						expires = config.longExpires;
					}
				}

				if (files.length === 0) {
					self._response(404, {});
				} else {
					self._response(200, {
						'content-type': util.mime(url.type),
						'expires': new Date(now + 1000 * expires).toGMTString(),
						'cache-control': 'max-age=' + expires,
						'last-modified': mtime.toGMTString(),
						'etag': stamp,
						'vary': 'Accept-Encoding'
					}, self._refine(type, self._combine(type, files)));
				}
			});
		},

		/**
		 * Refine data.
		 * @param extname
		 * @param datum
		 * @return {Array}
		 */
		_refine: function (extname, datum) {
			return datum;
		},

		/**
		 * Send response.
		 * @param statusCode {number}
		 * @param headers {Object}
		 * @param [datum] {Array}
		 */
		_response: function (statusCode, headers, datum) {
			var response = this.context.response;

			//set font file cross domain
			if (FONT_MIME.indexOf(headers['content-type']) !== -1) {
				headers['access-control-allow-origin'] = '*';
			}

			response
				.status(statusCode)
				.head(headers)
				.clear();

			if (datum) {
				datum.forEach(function (data) {
					response.write(data);
				});
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
				url;

			if (url = front.parse(request.path, context.base)) { // Assign.
				this._getFile(url);
			} else {
				this.next();
			}
		}
	});

module.exports = Unicorn;
