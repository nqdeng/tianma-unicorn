规格描述
------------------------------

### 适用场景

独角兽*适合*为小文件（兆级别）提供静态资源服务，*不适合*为大文件（百兆级别）提供下载服务。

### 配置选项

>	unicorn(config:Object|string)

`unicorn`是一个模块工厂函数，在创建模块实例的时候可以传入一个`config`配置。

+ config.source:string

	配置*文件源*所在位置。独角兽在读取被请求的静态文件时，使用`source + pathname`作为*请求地址*，并使用天马的[服务端请求](http://nqdeng.github.io/pegasus/#5)读取文件内容，支持`file:`、`http(s):`与`loop:`三种请求协议。
		
	当`config`中只包含`source`字段时，可以直接使用该字段的值作为配置项：

		unicorn('file:///some/dir/')

+ config.expires:number

	文件缓存有效期，以*秒*为单位，默认为*一年*。

### 生效条件

独角兽模块位于某一条流水线中。当传入独角兽模块的请求和响应数据同时满足以下条件时，模块才会生效：

+ `request.method()`等于`GET`或`HEAD`。

+ `response.status()`等于`404`。

因此，以下情况下，独角兽模块不会对请求做处理:

+ 不是一个`GET`或`HEAD`请求。

		.mount('/', [
			function (context) {
				context.request.method('POST');
			},
			unicorn('file:///home/admin/deploy/')
		])

+ 上一个模块已经处理了请求。

		.mount('/', [
			function (context) {
				context.response
					.status(200).data('Hello World!');
			},
			unicorn('file:///home/admin/deploy/')
		])

### 异常处理

独角兽在处理请求的过程中，如果发生了一些*可预见*的异常（比如请求的文件不存在），独角兽会直接返回一个合适的响应。但如果发生了独角兽*无法处理*的异常（比如磁盘IO错误），独角兽会把异常抛给天马。通过天马的路由器回调函数可以捕获异常，并可以记录一些日志。

	pegasus(function (err) {
		console.error(err.stack);
	})
	.mount('/', unicorn('file:///home/admin/deploy/'));