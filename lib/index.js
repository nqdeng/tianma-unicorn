var pegasus = require('pegasus'),
	util = pegasus.util,
	Unicorn = require('./unicorn'),
	UnicornJIT = require('./unicorn-jit');

var FACTORY = {},

	CONFIG = {};

FACTORY.prod = pegasus.createPipe(Unicorn);

FACTORY.dev = FACTORY.test = pegasus.createPipe(UnicornJIT);

CONFIG.prod = CONFIG.test = {
	imageBase: 'http://i02.i.aliimg.com/',
	imageBaseSSL: 'https://stylessl.aliunicorn.com/',
	imageBaseWhitelist: { '//ipaystyle.alibaba.com' : true },
	longExpires: 31536000,
	normalExpires: 1800,
	shortExpires: 30
};

CONFIG.dev = {
	imageBase: 'http://i02.i.aliimg.com/',
	imageBaseSSL: 'https://stylessl.aliunicorn.com/',
	imageBaseWhitelist: { '//ipaystyle.alibaba.com' : true },
	longExpires: 0,
	normalExpires: 0,
	shortExpires: 0
};

/**
 * Call different factory per mode.
 * @param config {Object}
 * @return {Function}
 */
module.exports = function (config) {
	config = util.mix({
		mode: 'dev',
		source: null
	}, config);

	config = util.mix(config, CONFIG[config.mode]);

	return (FACTORY[config.mode] || FACTORY.dev)(config);
};
