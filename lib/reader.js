var util = require('pegasus').util;

	/**
	 * Split meta and data.
	 * @param file {Object}
	 * @return {Object}
	 */
var	split = function (file) {
		var data = file.data,
			magic = data.slice(0, 8),
			meta,
			length;

		// If first 8 bytes equal to "/*!meta " in ASCII?
		if (magic.length === 8
			&& !(data[0] ^ 0x2F) && !(data[1] ^ 0x2A)
			&& !(data[2] ^ 0x21) && !(data[3] ^ 0x6D)
			&& !(data[4] ^ 0x65) && !(data[5] ^ 0x74)
			&& !(data[6] ^ 0x61) && !(data[7] ^ 0x20)) {

			// The next 4 bytes are reserved for the header version.

			// The next 4 bytes should be the binary length of META
			// in string format.
			length = parseInt(data.slice(12, 16).toString(), 16);

			if (!util.isNumber(length)) {
				throw new Error('Broken meta @' + file.pathname);
			}

			// The next {length} bytes should be the META
			// in JSON format.
			meta = data.slice(16, 16 + length).toString();

			try { // Convert JSON string.
				meta = JSON.parse(meta);
			} catch (err) {
				throw new Error('Broken meta @' + file.pathname);
			}

			// The next 2 bytes should be "*/" in ASCII
			// and all the rest should be the DATA.
			data = data.slice(18 + length);
		}

		file.data = data;

		// Property such as mime defined in META has a higher priority
		// than the default one.
		if (meta) {
			util.mix(file.meta, meta);
		}

		return file;
	},

	/**
	 * Create a reader function.
	 * @param source {string}
	 * @param request {Function}
	 * @return {Function}
	 */
	create = function (source, request) {
		return function (pathname, callback) {
			request(source + pathname, function (err, response) {
				var file;

				if (err) {
					// Fall through.
				} else if (response.status() === 200) {
					try {
						file = split({
							data: response.binary,
							meta: {
								mime: response.head('content-type')
									// Set a default MIME.
									|| 'application/octet-stream',
								mtime: new Date(response.head('last-modified')
									// Set default mtime to now.
									|| Date.now()).getTime()
							},
							pathname: pathname
						});
					} catch (e) { // Cannot split data.
						err = e;
					}
				} else if (response.status() === 404) { // File not found.
					err = new Error('File not found @' + pathname);
					err.code = 'ENOENT';
				} else { // IO error, etc.
					err = new Error(response.body());
				}

				callback(err, file);
			});
		};
	};

exports.create = create;
