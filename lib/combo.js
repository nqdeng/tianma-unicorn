var pegasus = require('pegasus'),
	util = pegasus.util;

var handlers = {
		// Concat binary blocks by default.
		'$default': function (queue, cache) {
			var i = 0,
				len = queue.length,
				data = [],
				chunk,
				size = 0;

			for (; i < len; ++i) {
				chunk = cache[queue[i]];
				size += chunk.length;
				data.push(chunk);
			}

			return Buffer.concat(data, size);
		}
	},

	/**
	 * Register a handler.
	 * @param extname {string|Array}
	 * @param factory {Function}
	 */
	register = function (extname, factory) {
		if (util.isArray(extname)) {
			extname.forEach(function (extname) {
				register(extname, factory);
			});
		} else {
			handlers[util.mime(extname)] = factory();
		}
	};

// Append "\n" to JS or CSS.
register([ '.js', '.css' ], function () {
	var delimiter = new Buffer('\n');

	return function (queue, cache) {
		var i = 0,
			len = queue.length,
			data = [],
			chunk,
			size = 0;

		for (; i < len; ++i) {
			chunk = cache[queue[i]];
			size += chunk.length;
			size += delimiter.length;
			data.push(chunk);
			data.push(delimiter);
		}

		return Buffer.concat(data, size);
	};
});

// Merge multiple JSON data.
register('.json', function () {
	return function (queue, cache) {
		var i = 0,
			len = queue.length,
			data = [];

		for (; i < len; ++i) {
			data.push(JSON.parse(cache[queue[i]].toString('binary')));
		}

		data = util.merge.apply(util, data);
		data = JSON.stringify(data);

		return new Buffer(data);
	};
});

/**
 * Combine multiple files.
 * @param mime {string}
 * @param queue {Array}
 * @param cache {Object}
 * @return {Buffer}
 */
module.exports = function (mime, queue, cache) {
	var handler = handlers[mime] || handlers['$default'];

	return handler(queue, cache);
};