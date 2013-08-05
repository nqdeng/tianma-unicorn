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
			this._metaHash = '';
			this._metaModifiedTime = new Date(0);
		},

		/**
		 * Calculate CRC32 value.
		 * @param input {Object}
		 * @return {string}
		 */
		_crc32: (function () {
			var divisor = 0xEDB88320,

				table = [],

				byteCRC = function (input) {
					var i = 8,
						tmp = input;

					while (i--) {
						tmp = tmp & 1 ? (tmp >>> 1) ^ divisor : tmp >>> 1;
					}

					table[input] = tmp;
				},

				i = 0;

			for (i = 0; i < 256; ++i) {
				byteCRC(i);
			}

			return function (input) {
				var len = input.length,
					i = 0,
					crc = -1;

				for (; i < len; ++i) {
					crc = table[(crc ^ input[i]) & 0xFF] ^ (crc >>> 8);
				}

				return ((crc ^ -1) >>> 0);
			};
		}()),

		/**
		 * Flat all dependencies.
		 * @param pathnames {Array}
		 * @param extname {string}
		 * @return {Array}
		 */
		_expand: function (pathnames, extname) {
			var meta = this._meta,
				tmp = pathnames.slice(), // Keep the original array unmodified.
				expanded = [];

			if (extname === '.js') {
				tmp.unshift(GLOBAL_FILE);
			}

			tmp.forEach(function (pathname) {
				var data = meta[pathname];

				if (data) {
					expanded = expanded.concat(data.requires, pathname)
				}
			});

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
							util.throwError(new Error(err.message));
						} else {
							try {
								self._meta = JSON.parse(data.toString('utf-8'));
							} catch (err) {
								util.throwError('JSON syntax error in ".meta"');
							}
							self._metaHash = self._crc32(data).toString(16);
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
				callback(self._stamp(pathnames), function (callback) {
					pathnames = self._expand(pathnames, url.type);

					(function next(i) {
						if (i < pathnames.length) {
							var pathname = pathnames[i];

							fs.readFile(path.join(source, pathname), function (err, data) {
								if (err) {
									util.throwError(new Error(err.message));
								} else {
									files[i] = {
										pathname: pathname,
										data: data.toString('binary')
									};
									next(i + 1);
								}
							});
						} else {
							callback(files);
						}
					}(0));
				});
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
				var metaHash = self._metaHash,
					meta = self._meta,
					mtime = new Date(self._metaModifiedTime),
					ver = {};

				callback(metaHash, mtime, function () {
					util.each(meta, function (data, pathname) {
						if (PATTERN_JSON_VERSION_FILTER.test(pathname)) {
							if (!filter || filter && pathname.indexOf(filter) === 0) {
								ver[pathname] = data.dataHash + '.' + data.depsHash;
							}
						}
					});

					return JSON.stringify(ver);
				});
			});
		},

		/**
		 * Load flat version data.
		 * @param callback {Function}
		 */
		versionData: function (callback) {
			var self = this;

			this._refresh(function () {
				var metaHash = self._metaHash,
					meta = self._meta,
					mtime = new Date(self._metaModifiedTime),
					ver = [];

				callback(metaHash, mtime, function () {
					util.each(meta, function (data, pathname) {
						var re = pathname.match(PATTERN_FLAT_VERSION_FILTER);

						if (re) {
							ver.push(re[1] + '=' + data.dataHash + '.' + data.depsHash);
						}
					});

					return ver.join('|');
				});
			});
		}
	});

module.exports = Source;
