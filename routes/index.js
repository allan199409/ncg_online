const mew_util = require("mew_util");
const fs = require("fs");
const path = require("path");
const qiniu = require("qiniu");
const cheerio = require("cheerio");
const dbServer = require("dbServer");

const config = require(path.join(process.cwd(), "config.json"));

qiniu.conf.ACCESS_KEY = config.qiniu.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.qiniu.SECRET_KEY;

var isRequestLegal = function(options, query) {
    var result = true;
    for (var i = 0; i < Object.keys(options).length; i++) {
        var key = Object.keys(options)[i];

        var option = mew_util.advancedMerge({
            "require": {
                "!defaultValue": true
            },
            "type": {
                "!defaultValue": "all"
            },
            "length": {
                "!valueType": "number"
            }
        }, options[key]) ;

        var valueToCheck = mew_util.getProperty(query, key);
        if (valueToCheck != undefined || !option.require) {
            if (option.type == "all" || mew_util.isKindOf(valueToCheck, option.type)) {
                if (option.length) {
                    if (valueToCheck.length < option.length) {
                        result = false;
                        break;
                    }
                }
            } else {
                result = false;
                break;
            }
        } else {
            result = false;
            break;
        }
    }
    return result;
}

exports.init = function(callback) {
    mew_util.async(function() {
        console.log("start to connect database");
        dbServer.init(this.next);
    }).then(function() {
        callback();
    })
}

exports.getUploadToken = function(req, res) {
    function uptoken(bucket, key) {
      var putPolicy = new qiniu.rs.PutPolicy(bucket+":"+key);
      return putPolicy.token();
    }
    var query = req.query;
    var queryTest = {
        "type": {
            "type": String
        }
    }

    if (isRequestLegal(queryTest, query)) {
        bucket = config.qiniu.bucket;
        key = "images/" + Math.random().toString(36).substr(2) + mew_util.formatDate(new Date(), "YYMMDDhhmmss") + query.type;
        token = uptoken(bucket, key);

        res.json({
            key: key,
            url: config.resources.domain + "/" +key,
            token: token
        })
    } else {
        res.status(400);
        res.end();
    }

}

exports.saveArticle = function(req, res) {

    var query = req.body;
    var queryTest = {
        "title": {
            "type": String,
            "length": 1
        },
        "author": {
            "type": String,
            "length": 1
        },
        "short": {
            "type": String,
            "length": 1
        },
        "cover": {
            "type": String,
            "length": 1
        },
        "summary": {
            "type": Number
        },
        "tags": {
            "type": String
        },
        "content": {
            "type": String,
            "length": 1
        }
    }

    if (isRequestLegal(queryTest, query)) {
        mew_util.async(function() {
            dbServer.saveArticle(query, this.test);
        }).then(function(insertId) {
            res.json({
                "documentID": insertId
            })
        }).rejected(function() {
            res.status(500);
            res.render("500");
        })

    } else {
        res.status(400);
        res.end();
    }
}
