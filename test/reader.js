var assert = require("assert"),
	should = require('should'),
	reader = require('../lib/reader');

var SOURCE = 'fake://',

	FILES = {
		'foo': {
			head: new Buffer(0),
			body: new Buffer('Hello World!'),
			mime: 'text/plain',
			mtime: Date.now()
		},
		'bar': {
			head: new Buffer(
				'/*!meta       21{"mime":"text/plain","foo":"bar"}*/'),
			body: new Buffer([ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06 ]),
			mime: 'application/octet',
			mtime: Date.now()
		},
		'bar.bad1': {
			head: new Buffer('/*!meta        d{"foo":"bar"*/'),
			body: new Buffer([ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06 ]),
			mime: 'application/octet',
			mtime: Date.now()
		},
		'bar.bad2': {
			head: new Buffer('/*!meta ^$$#ED8@{"foo":"bar"}*/'),
			body: new Buffer([ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06 ]),
			mime: 'application/octet',
			mtime: Date.now()
		},
		'baz': null
	},

	request = function (pathname, callback) {
		assert.equal(pathname.indexOf(SOURCE), 0,
			'source should be prepended at pathname');

		pathname = pathname.replace(SOURCE, '');

		setImmediate(function () {
			if (FILES[pathname] === null) {
				callback(new Error());
			} else {
				var status = FILES.hasOwnProperty(pathname) ? 200 : 404,
					file = FILES[pathname] || {},
					headers = {
						'content-type': file.mime,
						'last-modified': file.mtime
					},
					body = (status === 200) ?
						Buffer.concat([ file.head, file.body ]) : 'ERROR';

				callback(null, {
					status: function () {
						return status;
					},
					head: function (key) {
						return headers[key];
					},
					get binary() {
						return body;
					}
				});
			}
		});
	};

describe('reader.create', function () {
	var read = reader.create(SOURCE, request);

	describe('normally', function () {
		it('should read a file without a header', function (done) {
			read('foo', function (err, file) {
				assert.equal(err, null);

				file.should.eql({
					pathname: 'foo',
					meta: {
						mtime: FILES['foo'].mtime,
						mime: FILES['foo'].mime
					},
					data: FILES['foo'].body
				});

				done();
			});
		});

		it('should read a file with a header', function (done) {
			read('bar', function (err, file) {
				assert.equal(err, null);

				file.should.eql({
					pathname: 'bar',
					meta: {
						foo: 'bar',
						mtime: FILES['bar'].mtime,
						mime: 'text/plain'
					},
					data: FILES['bar'].body
				});

				done();
			});
		});
	});

	describe('angrily', function () {
		it('should alert when file not found', function (done) {
			read('fooo', function (err, file) {
				assert(err instanceof Error);
				assert.equal(err.code, 'ENOENT');
				assert.equal(err.message, 'File not found @fooo');

				done();
			});
		});

		it('should alert when IO error occurs', function (done) {
			read('baz', function (err, file) {
				assert(err instanceof Error);
				assert.notEqual(err.code, 'ENOENT');
				assert.equal(typeof err.message, 'string');

				done();
			});
		});

		it('should alert when meta length is wrong', function (done) {
			read('bar.bad2', function (err, file) {
				assert(err instanceof Error);
				assert.notEqual(err.code, 'ENOENT');
				assert.equal(err.message, 'Broken meta @bar.bad2');

				done();
			});
		});

		it('should alert when meta is broken', function (done) {
			read('bar.bad1', function (err, file) {
				assert(err instanceof Error);
				assert.notEqual(err.code, 'ENOENT');
				assert.equal(err.message, 'Broken meta @bar.bad1');

				done();
			});
		});
	});
});