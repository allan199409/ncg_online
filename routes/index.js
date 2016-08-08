var mew_util = require("mew_util");
var fs = require("fs");
var path = require("path");

exports.index = function(req, res, next) {
    res.render("index");
}

exports.uploadPic = function(req, res, next) {
    var name = mew_util.createUUID().slice(0, 4);
    var data = new Buffer(req.body.picData, 'base64');

    fs.writeFile(path.resolve(__dirname, '..', 'public', 'pics', name + '.png'), data);
    res.end(name);
}
