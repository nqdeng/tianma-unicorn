静态文件服务
------------------------------

独角兽首先是一个基本的静态资源服务器，能够处理以下形式的任何静态文件请求：

>	GET /some/file

例如，在处理`GET /index.html`时，如果能够读取到请求的文件，则返回如下的200响应：

	=> GET /index.html
	<= HTTP/1.1 200 OK
	   Content-Type: text/html
	   Expires: Tue, 26 May 2015 07:46:28 GMT
	   Cache-Control: max-age=31536000
	   Last-Modified: Sun, 04 May 2014 08:32:49 GMT

	   $(index.html)

可以看到，响应头里包含了*文件类型*、*最后修改日期*、*缓存有效期*等基本信息，响应数据则是文件自身的内容。

### 异常处理

当请求的文件无法被读取时，独角兽返回404响应。

	=> GET /unexist.js
	<= HTTP/1.1 404 Not Found
