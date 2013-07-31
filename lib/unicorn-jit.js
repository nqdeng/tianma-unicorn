var path = require('path'),
	util = require('pegasus').util,
	Front = require('./front-jit'),
	Source = require('./source-jit'),
	Unicorn = require('./unicorn');

var PATTERN_YUI = /(YAHOO\.register\s*\(\s*['"]event['"][\s\S]*?\))/,

	// UnicornJIT constructor.
	UnicornJIT = Unicorn.extend({
		/**
		 * Initializer.
		 * @override
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;

			this._front = new Front();
		},

		/**
		 * Combine files.
		 * @override
		 * @param files {Array}
		 * @return {Buffer}
		 */
		_combine: function (files) {
			var config = this._config,
				dev = (config.mode === 'dev'),
				output = [];

			files.forEach(function (file) {
				dev && output.push('/*** START OF ' + file.pathname + ' ***/');
				output.push(file.data);
				dev && output.push('/*** END OF ' + file.pathname + ' ***/');
			});

			return output.join('\n');
		},

		/**
		 * Turn on the debug switch for YUI2.
		 * @param data {string}
		 * @return {string}
		 */
		_enableDebug: function (data) {
			return data
				.replace(PATTERN_YUI,
					'$1,YAHOO.util.Event.throwErrors=true');
		},

		/**
		 * Refine output.
		 * @override
		 * @param extname {string}
		 * @param data {string}
		 * @return {string}
		 */
		_refine: function (extname, data) {
			data = Unicorn.prototype._refine.apply(this, arguments);

			if (extname === '.js') {
				data = this._enableDebug(data);
			}

			return data;
		},

		/**
		 * Pipe function entrance.
		 * @override
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var config = this._config,
				source = config.source,
				self = this;

			this._source = new Source({
				loader: function (pathname, callback) {
					request(source + pathname, function (response) {
						if (response.status !== 200) {
							callback(null);
						} else {
							callback({
								pathname: pathname,
								data: response.body('binary')
							});
						}
					});
				},
				mode: config.mode
			});

			Unicorn.prototype.main.apply(this, arguments);
		}
	});

module.exports = UnicornJIT;
