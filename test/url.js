var assert = require("assert"),
	should = require('should'),
	url = require('../lib/url');

describe('url.parse', function () {
	describe('normally', function () {
		it('should parse "/foo/bar.js"', function () {
			url.parse('/foo/bar.js').should.eql({
				requires: [ 'foo/bar.js' ],
				excludes: [],
				params: {}
			});
		});

		it('should parse "/foo/bar.js?m=n&x=y"', function () {
			url.parse('/foo/bar.js?m=n&x=y').should.eql({
				requires: [ 'foo/bar.js' ],
				excludes: [],
				params: {
					m: 'n',
					x: 'y'
				}
			});
		});

		it('should parse "/base/??foo.js,bar.js"', function () {
			url.parse('/base/??foo.js,bar.js').should.eql({
				requires: [ 'base/foo.js', 'base/bar.js' ],
				excludes: [],
				params: {}
			});
		});

		it('should parse "/base/??foo.js,bar.js?m=n&x=y"', function () {
			url.parse('/base/??foo.js,bar.js?m=n&x=y').should.eql({
				requires: [ 'base/foo.js', 'base/bar.js' ],
				excludes: [],
				params: {
					m: 'n',
					x: 'y'
				}
			});
		});

		it('should parse "/base/??-foo.js,bar.js?m=n&x=y"', function () {
			url.parse('/base/??-foo.js,bar.js?m=n&x=y').should.eql({
				requires: [ 'base/bar.js' ],
				excludes: [ 'base/foo.js' ],
				params: {
					m: 'n',
					x: 'y'
				}
			});
		});
	});

	describe('wisely', function () {
		it('should parse "/foo/bar.js?x=y&x=z"', function () {
			url.parse('/foo/bar.js?x=y&x=z').should.eql({
				requires: [ 'foo/bar.js' ],
				excludes: [],
				params: {
					x: 'z'
				}
			}, 'Param with a same key will override the previous one');
		});

		it('should parse "/foo/bar.js?m&x=y"', function () {
			url.parse('/foo/bar.js?m&x=y').should.eql({
				requires: [ 'foo/bar.js' ],
				excludes: [],
				params: {
					m: '',
					x: 'y'
				}
			}, 'Param without a value will get a default value ""');
		});

		it('should parse "/base/??foo.js,foo.js"', function () {
			url.parse('/base/??foo.js,foo.js').should.eql({
				requires: [ 'base/foo.js', 'base/foo.js' ],
				excludes: [],
				params: {}
			}, 'Keep the duplicates');
		});

		it('should parse "/base/??-foo.js,foo.js"', function () {
			url.parse('/base/??-foo.js,foo.js').should.eql({
				requires: [ 'base/foo.js' ],
				excludes: [ 'base/foo.js' ],
				params: {}
			}, 'Separate the requires and excludes');
		});

		it('should parse "/base/??../foo.js,./bar.js"', function () {
			url.parse('/base/??../foo.js,./bar.js').should.eql({
				requires: [ 'foo.js', 'base/bar.js' ],
				excludes: [],
				params: {}
			}, 'Normalize the pathname');
		});
	});
});

