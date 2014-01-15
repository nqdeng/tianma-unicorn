var fs = require('fs'),
	path = require('path'),
	util = require('pegasus').util;

var CascadeFile = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._source = config.source;
			this._patch = config.patch;
			this._mergeTag = path.join(config.source, '.merging');
		},

		/**
		 * Read the first available candidates.
		 * @param bases {Array}
		 * @param pathnames {Array}
		 * @param callback {Function}
		 */
		_read: function (bases, pathnames, callback) {
			var files = [],
				len1 = pathnames.length,
				len2 = bases.length;

			(function nextFile(i) {
				if (i < len1) {
					(function nextCandidate(j, pathname, lastError) {
						if (j < len2) {
							var fullPath = path.join(bases[j], pathname);

							fs.stat(fullPath, function (err, status) {
								if (err) {
                                    if (err.code === 'ENOENT') {
                                        nextCandidate(j + 1, pathname, err);
                                    } else {
                                        util.throwError(new Error(err.message));
                                    }
								} else {
									fs.readFile(fullPath, function (err, data) {
										if (err) {
                                            if (err.code === 'ENOENT') {
                                                nextCandidate(j + 1, pathname, err);
                                            } else {
                                                util.throwError(new Error(err.message));
                                            }
										} else {
											files.push({
												data: data,
												mtime: status.mtime.getTime(),
												pathname: pathname
											});
											nextFile(i + 1);
										}
									});
								}
							});
						} else {
							util.throwError(new Error(lastError.message));
						}
					}(0, pathnames[i], null));
				} else {
					callback(files);
				}
			}(0));
		},

		/**
		 * Read files.
		 * @param pathnames {Array}
		 * @param callback {Function}
		 */
		read: function (pathnames, callback) {
			var source = this._source,
				patch = this._patch,
				mergeTag = this._mergeTag,
				single = false,
				self = this;

			if (util.isString(pathnames)) {
				single = true;
				pathnames = [ pathnames ];
			}

			fs.exists(mergeTag, function (exists) {
				var bases = exists ? [ patch, source ] : [ source ];

				self._read(bases, pathnames, function (files) {
					callback(single ? files[0] : files);
				});
			});
		}
	});

module.exports = CascadeFile;
