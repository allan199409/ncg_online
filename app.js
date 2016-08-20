const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const fs = require('fs');
const logger = require('morgan');
const mew_util = require('mew_util');
const cors = require('cors');
const session = require('express-session');
const methodOverride = require('method-override');

const routes = require('./routes/index.js');
const users = require('./routes/user.js');

const config = require('./config.json');

const app = express();

app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json({
	"limit": "10mb"
}));
app.use(bodyParser.urlencoded({
	"limit": "10mb",
	"extended": false
}));
app.use(methodOverride());
app.use(cookieParser('sctalk admin manager'));
app.use(session({
	secret: 'niconiconi',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
}));
app.use(express.static(path.join(__dirname, "public")));

app.get('/admin', routes.admin);
app.get('/admin/article*', routes.article);
app.get('/admin/newarticle', routes.newarticle);
app.get("/admin/getUploadToken", routes.getUploadToken);
app.post("/admin/saveArticle", routes.saveArticle);


app.use(function(req, res, next) {
	res.status(404);
	res.end();
});

mew_util.async(function() {
	routes.init(this.next);
}).then(function() {
	app.listen(config.serverRuntime.port);
	console.log("server try to listen on " + config.serverRuntime.port);
	console.log('server started');
})
