var assert = require("assert"),
	loader = require('../lib/loader'),
	should = require('should');

var FILES = {
		'a.js': {
			data: new Buffer('var a;'),
			meta: {
				requires: [ 'b.js', 'c.js' ],
				mtime: 1,
				mime: 'application/javascript'
			},
			pathname: 'a.js'
		},

		'b.js': {
			data: new Buffer('var b;'),
			meta: {
				mtime: 2,
				mime: 'application/javascript'
			},
			pathname: 'b.js'
		},

		'c.js': {
			data: new Buffer('var c;'),
			meta: {
				requires: [ '{x}.js' ],
				mtime: 3,
				mime: 'application/javascript'
			},
			pathname: 'c.js'
		},

		'd.js': {
			data: new Buffer('var d;'),
			meta: {
				requires: [ 'b.js' ],
				mtime: 4,
				mime: 'application/javascript'
			},
			pathname: 'd.js'
		},

		'a.css': {
			data: new Buffer('#a {}'),
			meta: {
				mtime: 5,
				mime: 'text/css'
			},
			pathname: 'a.css'
		},

		'b.css': {
			data: new Buffer('#b {}'),
			meta: {
				mtime: 6,
				mime: 'text/css'
			},
			pathname: 'b.css'
		},
	},

	read = function (pathname, callback) {
		setImmediate(function () {
			if (FILES[pathname]) {
				callback(null, FILES[pathname]);
			} else {
				callback(new Error('File not found @' + pathname));
			}
		});
	},

	load = function (pathname, callback) {
		loader.load(pathname, read, function (error, cache, queue, meta) {
			callback({
				error: error,
				cache: cache,
				queue: queue,
				meta: meta
			});
		});
	};

describe('loader.load', function () {
	describe('normally', function () {
		it('should load a single file', function (done) {
			load('/a.css', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'a.css': FILES['a.css'].data
					},
					queue: [ 'a.css' ],
					meta: {
						mtime: FILES['a.css'].meta.mtime,
						mime: FILES['a.css'].meta.mime
					}
				});

				done();
			});
		});

		it('should combine multiple files', function (done) {
			load('/??a.css,b.css', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'a.css': FILES['a.css'].data,
						'b.css': FILES['b.css'].data
					},
					queue: [ 'a.css', 'b.css' ],
					meta: {
						mtime: Math.max(
							FILES['a.css'].meta.mtime,
							FILES['b.css'].meta.mtime
						),
						mime: FILES['a.css'].meta.mime
					}
				});

				done();
			});
		});

		it('should resolve dependencies', function (done) {
			load('/??a.js,c.js', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'a.js': FILES['a.js'].data,
						'b.js': FILES['b.js'].data,
						'c.js': FILES['c.js'].data
					},
					queue: [ 'b.js', 'c.js', 'a.js' ],
					meta: {
						mtime: Math.max(
							FILES['a.js'].meta.mtime,
							FILES['b.js'].meta.mtime,
							FILES['c.js'].meta.mtime
						),
						mime: FILES['a.js'].meta.mime
					}
				});

				done();
			});
		});

		it('should ignore given nodes from dependencies', function (done) {
			load('/??-d.js,a.js', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'a.js': FILES['a.js'].data,
						'b.js': FILES['b.js'].data,
						'c.js': FILES['c.js'].data,
						'd.js': FILES['d.js'].data
					},
					queue: [ 'c.js', 'a.js' ],
					meta: {
						mtime: Math.max(
							FILES['a.js'].meta.mtime,
							FILES['c.js'].meta.mtime
						),
						mime: FILES['a.js'].meta.mime
					}
				});

				done();
			});
		});

		it('should ignore unknown dynamic dependencies', function (done) {
			load('/c.js', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'c.js': FILES['c.js'].data
					},
					queue: [ 'c.js' ],
					meta: {
						mtime: Math.max(
							FILES['c.js'].meta.mtime
						),
						mime: FILES['c.js'].meta.mime
					}
				});

				done();
			});
		});

		it('should include known dynamic dependencies', function (done) {
			load('/c.js?x=b', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'b.js': FILES['b.js'].data,
						'c.js': FILES['c.js'].data
					},
					queue: [ 'b.js', 'c.js' ],
					meta: {
						mtime: Math.max(
							FILES['b.js'].meta.mtime,
							FILES['c.js'].meta.mtime
						),
						mime: FILES['c.js'].meta.mime
					}
				});

				done();
			});
		});
	});

	describe('wisely', function () {
		it('should ignore duplicate pathname', function (done) {
			load('/??a.css,a.css', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'a.css': FILES['a.css'].data
					},
					queue: [ 'a.css' ],
					meta: {
						mtime: Math.max(
							FILES['a.css'].meta.mtime
						),
						mime: FILES['a.css'].meta.mime
					}
				});

				done();
			});
		});

		it('should ignore unknown params', function (done) {
			load('/c.js?y=b', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'c.js': FILES['c.js'].data
					},
					queue: [ 'c.js' ],
					meta: {
						mtime: Math.max(
							FILES['c.js'].meta.mtime
						),
						mime: FILES['c.js'].meta.mime
					}
				});

				done();
			});
		});

		it('should normalize pathnames in params', function (done) {
			load('/c.js?x=c/../b', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'b.js': FILES['b.js'].data,
						'c.js': FILES['c.js'].data
					},
					queue: [ 'b.js', 'c.js' ],
					meta: {
						mtime: Math.max(
							FILES['b.js'].meta.mtime,
							FILES['c.js'].meta.mtime
						),
						mime: FILES['c.js'].meta.mime
					}
				});

				done();
			});
		});

		it('should prevent circular dependencies', function (done) {
			load('/c.js?x=a', function (ret) {
				ret.should.eql({
					error: null,
					cache: {
						'a.js': FILES['a.js'].data,
						'b.js': FILES['b.js'].data,
						'c.js': FILES['c.js'].data
					},
					queue: [ 'b.js', 'a.js', 'c.js' ],
					meta: {
						mtime: Math.max(
							FILES['a.js'].meta.mtime,
							FILES['b.js'].meta.mtime,
							FILES['c.js'].meta.mtime
						),
						mime: FILES['c.js'].meta.mime
					}
				});

				done();
			});
		});
	});

	describe('angrily', function () {
		it('should alert when file not found', function (done) {
			load('/c.css', function (ret) {
				assert(ret.error instanceof Error);
				done();
			});
		});

		it('should alert when file not found', function (done) {
			load('/??a.css,c.css', function (ret) {
				assert(ret.error instanceof Error);
				done();
			});
		});

		it('should alert when dynamic dependency not found', function (done) {
			load('/c.js?x=e', function (ret) {
				assert(ret.error instanceof Error);
				done();
			});
		});

		it('should alert when MIME conflicts', function (done) {
			load('/??a.js,a.css', function (ret) {
				assert(ret.error instanceof Error);
				done();
			});
		});
	});
});