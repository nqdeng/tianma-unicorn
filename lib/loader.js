var resolve = require('url').resolve,
	url = require('./url');

var PATTERN_PLACEHOLDERS = /\{(\w+)\}/g,

	/**
	 * Fill the placeholders in pathnames.
	 * @param names {Array}
	 * @param vars {Object}
	 * @return {Array}
	 */
	fill = function (names, vars) {
		var result = [],
			i = 0,
			len = names.length,
			name,
			miss, dynamic;

		for (; i < len; ++i) {
			// Is any placeholder undefined in vars?
			miss = false;
			// Is a pathname dynamic?
			dynamic = false;

			name = names[i].replace(PATTERN_PLACEHOLDERS, function (all, ph) {
				// Placeholder existence check.
				miss = miss || !vars[ph];
				// A dynamic pathname.
				dynamic = true;
				// Do not replace undefined placeholder.
				return vars[ph] || all;
			});

			if (!miss) { // Skip pathname with undefined placeholder.
				if (dynamic) { /* Dynamic pathname should be normalized
								  for security. */
					// Normalize URL and remove "../" or "./"
					name = resolve('/', name);
					// Remove leading slash.
					name = name.substring(1);
				}
				result.push(name);
			}
		}

		return result;
	},

	/**
	 * Travel the dependencies tree.
	 * @param nodes {Array}
	 * @param vars {Object}
	 * @param read {Function}
	 * @param callback {Function}
	 * @param [queue] {Array}
	 * @param [cache] {Object}
	 * @param [meta] {Object}
	 */
	travel = function (nodes, vars, read, callback, cache, queue, meta) {
		cache = cache || {};
		queue = queue || [];
		meta = meta || {
			mtime: 0,
			mime: null
		};

		(function next(i, len) {
			if (i < len) { // Still have siblings.
				var node = nodes[i];

				if (cache.hasOwnProperty(node)) {
					// Skip the visited node to avoid duplicate travel,
					// also to avoid circular path.
					next(i + 1, len);
				} else {
					// Read current node.
					read(node, function (err, file) {
						if (err) {
							callback(err);
						} else if (meta.mime && meta.mime !== file.meta.mime) {
							// MIME consistence check fails.
							callback(new Error('Inconsistent MIME type @'
								+ file.pathname));
						} else {
							// Save MIME of current node.
							meta.mime = file.meta.mime;

							// Set the later one to be the mtime.
							meta.mtime = Math.max(meta.mtime, file.meta.mtime);

							// Mark current node as visited.
							cache[node] = file.data;

							var children = file.meta.requires;

							if (children) {
								// Fill the placeholders in pathnames.
								children = fill(children, vars);
								// and visit all the child nodes.
								travel(children, vars, read, function (err) {
									if (err) {
										callback(err);
									} else {
										// Use Post-Order travel to ensure
										// the dependencies appear first.
										queue.push(node);
										// Visit the next sibling node.
										next(i + 1, len);
									}
								}, cache, queue, meta);
							} else {
								// No children, finish current node.
								queue.push(node);
								// Visit the next sibling node.
								next(i + 1, len);
							}
						}
					});
				}
			} else { // All nodes visited.
				callback(null, cache, queue, meta);
			}
		}(0, nodes.length));
	},

	/**
	 * Load all required files.
	 * @param path {string}
	 * @param read {Function}
	 * @param callback {Function}
	 */
	load = function (path, read, callback) {
		var re = url.parse(path);

		// Find all exclude nodes at first.
		travel(re.excludes, re.params, read, function (err, cache) {
			if (err) {
				callback(err);
			} else {
				// Then find all required nodes.
				travel(re.requires, re.params, read, callback, cache);
			}
		});
	};

exports.load = load;
