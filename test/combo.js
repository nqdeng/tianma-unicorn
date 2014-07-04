var assert = require("assert"),
	should = require('should'),
	combo = require('../lib/combo');

describe('combo', function () {
	describe('normally', function () {
		it('should concat binary blocks', function () {
			combo('text/plain', [ 'foo', 'bar' ], {
				'foo': new Buffer('foo'),
				'bar': new Buffer('bar')
			}).toString().should.eql('foobar');
		});

		it('should append \\n to JS or CSS', function () {
			combo('application/javascript', [ 'foo', 'bar' ], {
				'foo': new Buffer('foo'),
				'bar': new Buffer('bar')
			}).toString().should.eql('foo\nbar\n');

			combo('text/css', [ 'foo', 'bar' ], {
				'foo': new Buffer('foo'),
				'bar': new Buffer('bar')
			}).toString().should.eql('foo\nbar\n');
		});

		it('should merge multiple JSONs', function () {
			JSON.parse(combo('application/json', [ 'foo', 'bar' ], {
				'foo': new Buffer(JSON.stringify({
						x: 1,
						y: 1
				})),
				'bar': new Buffer(JSON.stringify({
						x: 2,
						z: 2
				}))
			}).toString()).should.eql({
				x: 2,
				y: 1,
				z: 2
			});
		});
	});
});