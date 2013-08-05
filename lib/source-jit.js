var compiler = require('./compiler'),
	util = require('pegasus').util,
	Source = require('./source');

	// SourceJIT constructor.
var	SourceJIT = Source.extend({
		/**
		 * Initializer.
		 * @override
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config,
			this._cache = {};
			this._meta = {};
		},

		/**
		 * Update metadata.
		 * @override
		 * @param base {Array}
		 * @param pathnames {Array}
		 * @param callback {Array}
		 */
		_refresh: function (base, pathnames, callback) {
			var config = this._config,
				cache = this._cache,
				meta = this._meta,
				load = config.loader,
				filtered = [];

			load('unicorn.json', function (file) {
				var options = {
						alias: {},
						modules: [],
					},
					c;

				if (file !== null) {
					try {
						file = JSON.parse(file.data.toString('utf-8'));
					} catch (err) {
						util.throwError('JSON syntax error in "unicorn.json"');
					}
					options.alias = file.alias;
					options.modules = file.modules;
				}

				c = compiler.generate({
					alias: options.alias,
					modules: options.modules,
					cache: cache,
					loader: load,
					mode: config.mode
				});

				(function next(i) {
					if (i < pathnames.length) {
						(function _next(j) {
							if (j < base.length) {
								c.compile(base[j] + pathnames[i], function (file) {
									if (file !== null) {
										meta[file.pathname] = {
											dataHash: file.meta.dataHash.toString(16),
											depsHash: file.meta.depsHash.toString(16),
											nameHash: file.meta.nameHash.toString(16),
											requires: file.meta.requires
										};
										filtered.push(file.pathname);
										next(i + 1);
									} else {
										_next(j + 1);
									}
								});
							} else {
								next(i + 1);
							}
						}(0));
					} else {
						if (c.errors.length > 0) {
							util.throwError(c.errors[0]);
						}
						callback(filtered);
					}
				}(0));
			});
		},

		/**
		 * Load files and all dependencies.
		 * @override
		 * @param url {Object}
		 * @param callback {Function}
		 */
		load: function (url, callback) {
			var base = url.base,
				pathnames = url.pathnames,
				cache = this._cache,
				files = [],
				self = this;

			this._refresh(base, pathnames, function (pathnames) {
				callback(self._stamp(pathnames), function (callback) {
					self._expand(pathnames).forEach(function (pathname, index) {
						files[index] = {
							pathname: pathname,
							data: cache[pathname]
						};
					});

					callback(files);
				});
			});
		},

		/**
		 * Load fake data.
		 * @override
		 * @param callback {Function}
		 * @param filter {string}
		 */
		version: function (callback, filter) {
			callback('0', new Date(), function () {
				return '{}';
			});
		},

		/**
		 * Load fake data.
		 * @override
		 * @param callback {Function}
		 */
		versionData: function (callback) {
			callback('0', new Date(), function () {
				return '';
			});
		}
	});

module.exports = SourceJIT;
