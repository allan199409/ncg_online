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
const orm = require('orm');

const routes = require('./routes/index.js');
const users = require('./routes/user.js');
const render = require('./routes/render.js');

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
app.use(orm.express(`mysql://${config.dataBase.user}:${config.dataBase.password}@${config.dataBase.host}:${config.dataBase.port}/${config.dataBase.database}`, {
    define: function (db, models, next) {
        models.articles = db.define("articles", {
			"id": { type: 'integer', key: true },
			"title": String,
			"author": String,
			"short": String,
			"cover": String,
			"summary": { type: 'integer' },
			"tags": String,
			"content": String,
			"count": { type: "integer" },
			"update_time": Date
		});
        next();
    }
}));

app.get("/admin/getUploadToken", routes.getUploadToken);
app.post("/admin/saveArticle", routes.saveArticle);
app.post("/admin/removeArticle", routes.removeArticle);

app.get("/document/*", render.document);

app.get('/admin', render.admin);
app.get('/admin/article*', render.articles);
app.get('/admin/newarticle', render.newarticle);
app.get("/admin/editarticle", render.editarticle);

app.use(function(req, res, next) {
	res.status(404);
	res.render("404");
});

app.use(function(err, req, res, next) {
	console.log(err);
	res.status(500);
	res.render("500");
})

mew_util.async(function() {
	routes.init(this.next);
}).then(function() {
	app.listen(config.serverRuntime.port);
	console.log("server try to listen on " + config.serverRuntime.port);
	console.log('server started');
})
