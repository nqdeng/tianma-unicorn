文件合并
------------------------------

独角兽允许浏览器通过以下形式的URL，一次请求多个同类型的文件。

>	GET /base/??a.js,b.js

这个URL可以拆分为以下两个文件路径：

>	"base/a.js"
>	"base/b.js"

独角兽从*文件源*读取文件内容，并按照文件路径出现的顺序合并文件内容后返回响应。

	=> GET /base/??a.js,b.js
	<= HTTP/1.1 200 OK
	   Content-Type: application/javascript
	   Expires: Mon, 25 May 2015 13:40:23 GMT
	   Cache-Control: max-age=31536000
	   Last-Modified: Mon, 25 May 2014 13:40:23 GMT
	   ...
	   
	   $(base/a.js) + $(base/b.js)

文件合并后，响应头中的最后修改日期使用多个文件当中*最新*时间。

### 异常处理

#### 文件路径重复

当URL中同一个文件路径出现了一次以上时，独角兽会*忽略*重复的路径，而*不会*把同一个文件合并两次。

	=> GET /base/??a.js,b.js,a.js
	<= HTTP/1.1 200 OK
	   ...
	   
	   $(base/a.js) + $(base/b.js)

#### 文件不存在

当URL中的*任意*文件无法被读取时，独角兽返回404响应。

	=> GET /base/??a.js,b.js,unexist.js
	<= HTTP/1.1 404 Not Found

#### 文件类型不一致

当URL中出现的所有文件的文件类型（MIME）*不一致*时，独角兽返回500响应。

	=> GET /base/??a.js,b.css
	<= HTTP/1.1 500 Internal Server Error
