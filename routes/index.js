var mew_util = require("mew_util");
var fs = require("fs");
var path = require("path");

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
    res.render("newarticle");
}
