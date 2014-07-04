var combo = require('./combo'),
	loader = require('./loader'),
	pegasus = require('pegasus'),
	reader = require('./reader'),
	util = pegasus.util;

var	PATTERN_LAST_SLASH = /\/$/,

	Unicorn = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			if (util.isString(config)) { // Fast config.
				config = {
					source: config
				};
			}

			config = util.mix({
				source: null, // Default source is not so useful.
				expires: 31536000 // Default expires set to 1 year.
			}, config);

			if (!PATTERN_LAST_SLASH.test(config.source)) {
				// Source should end with slash.
				config.source += '/';
			}

			this._source = config.source;
			this._expires = config.expires;
		},

		/**
		 * Entrance.
		 * @param context {Object}
		 * @param next {Function}
		 */
		main: function (context, next) {
			var request = context.request,
				response = context.response,
				read = reader.create(this._source, request),
				expires = this._expires,
				self = this;

			loader.load(request.path, read, function (err, cache, queue, meta) {
				if (err) {
					if (err.code === 'ENOENT') {
						response
							.status(404)
							.head({
								'content-type': 'text/plain'
							})
							.data(err.message);
						next();
					} else {
						next(err);
					}
				} else {
					response
						.status(200)
						.head({
							'content-type': meta.mime,
							'expires': new Date(Date.now() + 1000 * expires)
								.toGMTString(),
							'cache-control': 'max-age=' + expires,
							'last-modified': new Date(meta.mtime)
								.toGMTString(),
							'vary': 'Accept-Encoding'
						})
						.data(combo(meta.mime, queue, cache));

					next();
				}
			});
		}
	});

/**
 * Module factory.
 * @param [config] {Object|string}
 * @return {Function}
 */
module.exports = function (config) {
	var instance = new Unicorn(config);

	return function (context, next) {
		if (context.response.status() === 404) {
			Object.create(instance).main(context, next);
		} else {
			next();
		}
	};
};
