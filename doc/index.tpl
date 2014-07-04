<!DOCTYPE HTML>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
<title>独角兽使用手册</title>
<style>
html, body {
margin: 0;
padding: 0;
}

body {
background: #777;
font-family: sans-serif;
line-height: 170%;
}

header, nav, article, footer {
display: block;
}

#wrapper {
background: #fff;
margin: 0 auto;
max-width: 1200px;
}

#menu {
background: #000;
border-radius: 24px;
bottom: 30px;
display: none;
height: 48px;
opacity: 0.5;
position: fixed;
right: 30px;
transition: opacity 0.3s ease;
width: 48px;
}

#menu span {
background: #ccc;
display: block;
height: 3px;
margin: 5px auto;
width: 24px;
}

#menu span.first {
margin-top: 15px;
}

.show-menu #menu {
opacity: 0.75;
}

.show-menu #menu span {
background: #fff;
}

nav {
background: #fff;
border-right: 5px solid #777;
bottom: 0;
color: #333;
font-size: 10pt;
overflow-x: hidden;
overflow-y: auto;
padding: 20px 0 20px 40px;
position: fixed;
top: 0;
width: 195px;
}

nav ul {
margin: 0;
padding: 0;
}

nav a {
color: #777;
text-decoration: none;
}

nav a:hover {
text-decoration: underline;
}

nav li {
list-style: none;
margin: 0;
padding: 0;
}

nav .level2 {
font-size: 11pt;
font-weight: bold;
}

nav .level3 {
padding-left: 1em;
}

nav .level3:before { 
content: "» ";
}

nav .level4 {
padding-left: 2em;
}

nav .level4:before { 
content: "› ";
}

article {
color: #333;
font-size: 11pt;
margin-left: 240px;
padding: 40px;
word-break: break-all;
}

header {
border-bottom: solid 2px #333;
height: 90px;
margin-bottom: 30px;
}

header h1 {
color: #f60;
font-family: monospace;
font-size: 20pt;
margin: 0 0 2pt 0;
}

header h1 sup {
color: #f90;
font-size: 11pt;
}

header .link {
float: right;
font-size: 9pt;
}

header .comment {
color: #777;
font-family: monospace;
font-size: 10pt;
}

article h2 {
border-bottom: dotted 1px #777;
color: #000;
font-size: 12pt;
margin: 1em 0;
padding: 0 0 0.3em 0;
}

article h2:before {
content: "# "
}

article h3 {
color: #000;
font-size: 11pt;
margin: 1em 0;
padding: 0;
}

article h4 {
color: #000;
font-size: inherit;
font-style: italic;
font-weight: normal;
margin: 1em 0;
padding: 0;
}

article a {
color: #06f;
font-weight: bold;
}

article p {
margin: 1em 0;
}

article p em {
border-bottom: 2px solid #f90;
font-style: normal;
}

article p strong {
border-bottom: 2px solid #c00;
}

article p code {
font-size: 10pt;
outline: 2px solid #ff9;
}

article pre {
border: dashed 1px #ccc;
border-left: solid 2px #ccc;
font-size: 10pt;
line-height: 140%;
margin: 1em 0;
overflow-x: auto;
overflow-y: padding;
padding: 1em 0 1em 2em;
}

article blockquote {
border-left: solid 2px #f90;
margin: 0;
padding: 0 0 0 2em;
}

footer {
border-top: 1px solid #ccc;
font-size: 10pt;
font-weight: bold;
margin-top: 4em;
}

@media (max-width: 768px) {
	#menu {
	display: block;
	}

	nav {
	border-right: none;
	line-height: 240%;
	margin-left: -240px;
	transition: margin 0.3s ease;
	width: 200px;
	}

	.show-menu nav {
	box-shadow: 5px 5px 5px #777;
	margin-left: 0;
	}

	article {
	margin-left: 0;
	padding: 20px;
	}
}

@media (max-width: 480px) {
	article {
	padding: 10px;
	}
}
</style>
<script>
(function (tags) {
	var i = 0, len = tags.length;

	for (; i < len; ++i) {
	    document.createElement(tags[i]);
	}
}([ 'header', 'nav', 'article', 'footer' ]));
</script>
</head>
<body>
<div id="wrapper">
<div id="menu">
<span class="first"></span>
<span></span>
<span></span>
</div>
<nav>
<x-index />
</nav>
<article>
<header>
<h1>Unicorn();<sup>3.0.0 beta</sup></h1>
<div class="comment">// Assets server with dependencies resolution</div>
</header>
<x-markdown src="section/01_preface.md" />
<x-markdown src="section/02_getting_started.md" />
<x-markdown src="section/03_specification.md" />
<x-markdown src="section/04_static.md" />
<x-markdown src="section/05_combo.md" />
<x-markdown src="section/06_meta.md" />
<x-markdown src="section/07_dependencies.md" />
<footer>
<x-markdown src="section/99_footer.md" />
</footer>
</article>
<script>/*
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-48219354-1', 'nqdeng.github.io');
  ga('send', 'pageview');
*/
(function () {
	var wrapper = document.getElementById('wrapper'),
		article = document.getElementsByTagName('article')[0],
		menu = document.getElementById('menu');

	menu.addEventListener &&
	menu.addEventListener('click', function (e) {
		if (!wrapper.className) {
			wrapper.className = 'show-menu';
		} else {
			wrapper.className = '';
		}
	});

	article.addEventListener &&
	article.addEventListener('click', function (e) {
		wrapper.className = '';
	});
}());
</script>
</div>
</body>
</html>