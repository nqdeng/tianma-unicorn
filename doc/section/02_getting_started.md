入门
------------------------------

我们先把独角兽服务器环境搭建起来，以便接下来可以手把手地介绍如何使用独角兽。

独角兽是为[天马HTTP中间件](http://nqdeng.github.io/pegasus/)（以下简称*天马*）开发的一个功能模块，而后者又运行在[NodeJS](http://nodejs.org/)之上，因此环境搭建的过程非常类似编写一个NodeJS应用程序。

### 准备目录

#### 工作目录

首先新建一个目录作为*工作目录*，然后在该目录下运行以下命令（目前独角兽还没有发布到NPM上，以下命令只是示意一下，暂时不要当真）：

>	npm install pegasus
>	npm install unicorn

最后，我们在工作目录下再新建一个`app.js`文件。完成这些操作后，应该能得到以下目录结构：

	- workdir/
		- node_modules/
			+ pegasus/
			+ unicorn/
		app.js

#### 服务目录

然后再新建一个目录（例如`/home/admin/deploy/`）作为*服务目录*，用于存放对外服务的静态资源文件。有了一个空荡荡的目录后，我们可以再放入一点文件（例如`index.html`）。完成这些操作后，应该能得到以下目录结构：

	- /home/admin/deploy/
		index.html

### 编写代码

接下来，我们需要编辑`app.js`，使用*天马*编写一个HTTP服务器，并配置和使用*独角兽*模块。

	var http = require('http'),
		pegasus = require('pegasus'),
		unicorn = require('unicorn');

	var router = pegasus()
		.mount('/', unicorn('file:///home/admin/deploy/'));

	http.createServer(router).listen(8080);

### 启动服务

虽然生产环境下的服务运行方式要更加复杂和周全，但我们在开发环境下暂时只需要在工作目录下运行`node app.js`命令把服务跑起来。正常的话，服务目录里的文件应该能够被访问了：

	=> GET http://127.0.0.1:8080/index.html
	<= HTTP/1.1 200 OK
	   Content-Type: text/html
	   ...
	   
	   $(index.html)

>	我们约定使用`$(pathname)`来表示请求的文件的内容，后边的示例中也是如此。