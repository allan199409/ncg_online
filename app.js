var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var fs = require('fs');
var routes = require('./routes/index.js');
var users = require('./routes/user.js');
var mew_util = require('mew_util');
var app = express();
var cors = require('cors');

// view engine setup
app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.use(logger('dev'));
app.use(express.bodyParser({
	uploadDir: './uploads'
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('sctalk admin manager'));
app.use(express.session());
app.use(express.static(path.join(__dirname, "public")));
app.use(app.router);

app.get('/admin', routes.admin);
app.get('/admin/article*', routes.article);
app.get('/admin/newarticle', routes.newarticle);
app.get("/admin/getUploadToken", routes.getUploadToken);
app.post("/admin/saveArticle", routes.saveArticle);

// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
	res.status(404);
	res.end();
});
/// error handlers

//development error handler
//will print stacktrace
// app.use(function(err, req, res, next) {
// 	res.json({
// 		err: true,
// 		msg: '服务器出错',
// 		result: null
// 	});
// });

mew_util.async(function() {
	routes.init(this.next);
}).then(function() {
	app.listen(config.serverRuntime.port);
	console.log("server try to listen on " + port);
	console.log('server started');
})
console.log('server started');
