var pegasus = require('pegasus'),
	util = pegasus.util,
	Unicorn = require('./unicorn'),
	UnicornJIT = require('./unicorn-jit');

var FACTORY = {};

FACTORY.prod = pegasus.createPipe(Unicorn);

FACTORY.dev = FACTORY.test = pegasus.createPipe(UnicornJIT);

/**
 * Call different factory per mode.
 * @param config {Object}
 * @return {Function}
 */
module.exports = function (config) {
	config = util.mix({
		longExpires: 3600 * 24 * 365, // Seconds.
		mode: 'dev',
		normalExpires: 1800, // Seconds.
		shortExpires: 30, // Seconds.
		source: null
	}, config);

	return (FACTORY[config.mode] || FACTORY.dev)(config);
};
