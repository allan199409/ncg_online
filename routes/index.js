const mew_util = require("mew_util");
const fs = require("fs");
const path = require("path");
const qiniu = require("qiniu");
const cheerio = require("cheerio");

const config = require(path.join(process.cwd(), "config.json"));

qiniu.conf.ACCESS_KEY = config.qiniu.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.qiniu.SECRET_KEY;

exports.index = function(req, res, next) {
    res.render("index");
}

exports.admin = function(req, res) {
    res.render("admin");
}

exports.article = function(req, res) {
    res.render("article");
}

exports.newarticle = function(req, res) {
    mew_util.async(function() {
        fs.readFile(path.join(process.cwd(), "views", "newarticle.html"), this.test);
    }).then(function(content) {
        var html = cheerio.load(content.toString());
        html("#static-domain").html(`var staticDomain = "${config.resources.domain}"`);
        html("#cover-preview").attr("src", config.article.defaultCover);
        res.send(html.html());
    })
}

function uptoken(bucket, key) {
  var putPolicy = new qiniu.rs.PutPolicy(bucket+":"+key);
  return putPolicy.token();
}
exports.getUploadToken = function(req, res) {

    var query = req.query;

    bucket = config.qiniu.bucket;

    key = "images/" + Math.random().toString(36).substr(2) + mew_util.formatDate(new Date(), "YYMMDDhhmmss") + query.type;

    token = uptoken(bucket, key);

    res.json({
        key: key,
        token: token
    })
}
