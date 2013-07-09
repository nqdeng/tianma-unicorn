var fs = require('fs'),
	path = require('path'),
	util = require('pegasus').util;

var PATTERN_JSON_VERSION_FILTER = /\.(?:js|css)$/,

	PATTERN_FLAT_VERSION_FILTER = /^(?:js\/5v\/|css\/)(.*(?:js|css))$/,

	GLOBAL_FILE = 'js/5v/lib/ae/debug/global-img-server.js',

	// Source constructor.
	Source = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._source = config.source;
			this._meta = {};
			this._metaPath = path.join(this._source, '.meta');
			this._metaModifiedTime = 0;
		},

		/**
		 * Flat all dependencies.
		 * @param pathnames {Array}
		 * @param extname {string}
		 * @return {Array}
		 */
		_expand: function (pathnames, extname) {
			var meta = this._meta,
				expanded = [];

			pathnames.forEach(function (pathname) {
				var data = meta[pathname];

				if (data) {
					expanded = expanded.concat(data.requires, pathname)
				}
			});

			if (extname === '.js') {
				expanded.unshift(GLOBAL_FILE);
			}

			return util.unique(expanded);
		},

		/**
		 * Update metadata.
		 * @param pathnames {Array}
		 * @param callback {Array}
		 */
		_refresh: function (callback) {
			var metaModifiedTime = this._metaModifiedTime,
				metaPath = this._metaPath,
				self = this,
				mtime;

			fs.stat(metaPath, function (err, stats) {
				if (err) {
					util.throwError('Cannot read ".meta"');
				} else if ((mtime = stats.mtime.getTime()) !== metaModifiedTime) {
					self._metaModifiedTime = mtime;

					fs.readFile(metaPath, 'utf8', function (err, data) {
						if (err) {
							util.throwError(err.message);
						} else {
							try {
								self._meta = JSON.parse(data.toString('utf-8'));
							} catch (err) {
								util.throwError('JSON syntax error in ".meta"');
							}
							callback();
						}
					});
				} else {
					callback();
				}
			});
		},

		/**
		 * Calculate stamp.
		 * @param pathnames {Array}
		 * @param [stamp] {string}
		 * @return {number}
		 */
		_stamp: function (pathnames) {
			var meta = this._meta,
				dataHash = 0,
				depsHash = 0;

			pathnames.forEach(function (pathname) {
				if (meta[pathname]) {
					dataHash += parseInt(meta[pathname].dataHash, 16);
					depsHash += parseInt(meta[pathname].depsHash, 16);
				}
			});

			return dataHash.toString(16) + '_' + depsHash.toString(16);
		},

		/**
		 * Load files and all dependencies.
		 * @param url {Object}
		 * @param callback {Function}
		 */
		load: function (url, callback) {
			var source = this._source,
				pathnames = url.pathnames,
				files = [],
				self = this;

			this._refresh(function () {
				pathnames = self._expand(pathnames, url.type);

				(function next(i) {
					if (i < pathnames.length) {
						var pathname = pathnames[i];

						fs.readFile(path.join(source, pathname), function (err, data) {
							if (err) {
								util.throwError(err.message);
							} else {
								files[i] = {
									pathname: pathname,
									data: data.toString('binary')
								};
								next(i + 1);
							}
						});
					} else {
						callback(files, self._stamp(url.pathnames));
					}
				}(0));
			});
		},

		/**
		 * Load JSON version data.
		 * @param callback {Function}
		 * @param filter {string}
		 */
		version: function (callback, filter) {
			var self = this;

			this._refresh(function () {
				var meta = self._meta,
					ver = {};

				util.each(meta, function (data, pathname) {
					if (PATTERN_JSON_VERSION_FILTER.test(pathname)) {
						if (!filter || filter && pathname.indexOf(filter) === 0) {
							ver[pathname] = data.stamp + '.0';
						}
					}
				});

				callback(JSON.stringify(ver));
			});
		},

		/**
		 * Load flat version data.
		 * @param callback {Function}
		 */
		versionData: function (callback) {
			var self = this;

			this._refresh(function () {
				var meta = self._meta,
					ver = [];

				util.each(meta, function (data, pathname) {
					var re = pathname.match(PATTERN_FLAT_VERSION_FILTER);

					if (re) {
						ver.push(re[1] + '=' + data.stamp + '.0');
					}
				});

				callback(ver.join('|'));
			});
		}
	});

module.exports = Source;
