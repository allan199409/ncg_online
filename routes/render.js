const mew_util = require("mew_util");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const dbServer = require("dbServer");
const config = require(path.join(process.cwd(), "config.json"));

const HTMLFiles = {
    "document": path.join(process.cwd(), "views", "document.html"),
    "article": path.join(process.cwd(), "views", "article.html")
}

const errorHandler = function(err, res) {
    console.log(err);
    res.render("500");
}

const isRequestLegal = function(options, query) {
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

exports.index = function(req, res, next) {
    res.render("index");
}

exports.document = function(req, res, next) {
    var documentID = req.url.split("/")[2];

    mew_util.async(function() {
        req.models.articles.find({id:documentID}, this.test);
    }).then(function(data) {
        if (data.length) {
            this.pool.documentData = data[0];
            fs.readFile(HTMLFiles.document, this.test);
        } else {
            next();
        }
    }).then(function(htmlContent) {
        var html = cheerio.load(htmlContent.toString());
        var data = this.pool.documentData;
        html("[render=title]").text(data.title);
        html("[render=tags]").text(data.tags);
        html("[render=author]").text(data.author);
        html("[render=short]").text(data.short);
        html("[render=cover]").attr("src", data.cover);
        html("[render=content]").html(data.content);
        html("[render=update_time]").text(mew_util.formatDate(data.update_time, "YYYY-MM-DD hh:mm:ss"));
        res.send(html.html());
    }).rejected(function(err) {
        errorHandler(err, res);
    })
}

const getSummary = function(id) {
    switch (id) {
        case 1:
            return "线上课程";
        case 2:
            return "线下活动";
        case 3:
            return "通知";
        default:

    }
}

exports.editarticle = function(req, res, next) {
    var query = req.query;
    var queryTest = {
        "id": {
            type: String
        }
    }
    if (isRequestLegal(queryTest, query)) {
        mew_util.async(function() {
            req.models.articles.find({id: parseInt(query.id) }, {limit: 1}, this.test);
        }).then(function(data) {
            if (data.length) {
                this.pool.article = data[0];
                fs.readFile(path.join(process.cwd(), "views", "newarticle.html"), this.test);
            } else {
                next();
            }
        }).then(function(content) {
            var article = this.pool.article;
            var html = cheerio.load(content.toString());
            html("#form-title").attr("value", article.title);
            html("#form-author").attr("value", article.author);
            html("#form-short").text(article.short);
            html("#cover-preview").attr("src", article.cover);
            html("#form-summary").find(`option[value=${article.summary}]`).attr("selected", "selected");
            html("#form-tags").attr("value", article.tags);
            html("#editor").append(article.content);
            res.send(html.html());
        }).rejected(function(err) {
            console.log(err);
            errorHandler(err, res);
        })
    } else {
        res.status(400);
        res.end();
    }
}

exports.admin = function(req, res) {
    res.render("admin");
}

exports.newarticle = function(req, res) {
    mew_util.async(function() {
        fs.readFile(path.join(process.cwd(), "views", "newarticle.html"), this.test);
    }).then(function(content) {
        var html = cheerio.load(content.toString());
        html("#cover-preview").attr("src", config.article.defaultCover);
        res.send(html.html());
    }).rejected(function(err) {
        console.log(err);
        errorHandler(err, res);
    })
}

exports.articles = function(req, res) {
    var query = req.query;
    if (!query.page || query.page < 1) {
        query.page = 1;
    }
    mew_util.async(function() {
        var step = this;
        if (query.search) {
            mew_util.async(function() {
                dbServer.searchArticles(query.search, query.page, this.test);
            }).then(function(data) {
                step.pool.count = data.count;
                this.next(data.data);
            }).pipe(this)

        } else {
            mew_util.async(function() {
                req.models.articles.count({}, this.test);
            }).then(function(data) {
                step.pool.count = data;
                req.models.articles.find({}, {
                    "limit": 5,
                    "offset": (query.page - 1)*5
                }, this.test);
            }).pipe(this);
        }
    }).then(function(data) {
        this.pool.contents = data;
        fs.readFile(HTMLFiles.article, this.test);
    }).then(function(htmlContent) {
        var html = cheerio.load(htmlContent);
        var contentTemplate = html("#template-content-tr");
        var tagTemplate = html("#template-tag-span");
        html("#article-count").text(this.pool.count);
        html(".pagination").attr("data-total", Math.ceil(this.pool.count / 5));

        if (query.search) {
            html("#back").attr("style", "");
            html("#search").attr("value", query.search);
            html("#search-content").text("搜索到");
        } else {
            html("#search-content").text("共有");
        }

        this.pool.contents.forEach(function(content) {
            var newDom = contentTemplate.clone().find("tr");
            newDom.find("[render=title]").text(content.title).attr("href", "/document/" + content.id);
            newDom.find("[render=short]").text(content.short);
            newDom.find("[render=summary]").text(getSummary(content.summary));
            newDom.find("[render=count]").text(content.count);
            // newDom.find("[render=edit]").attr("onclick", 'window.location.href="/admin/editarticle?id=' + content.id + '"');
            newDom.find("[render=edit]").attr("href", "/admin/editarticle?id=" + content.id);
            newDom.find("[render=delete]").attr("data-id", content.id);

            var tags = content.tags.split(",");
            tags.forEach(function(tag) {
                var tagDom = tagTemplate.clone().find("span");
                tagDom.text(tag);
                newDom.find("[render=tags]").append(tagDom);
            })

            html("#content-list").append(newDom);
        })

        res.send(html.html());
    }).rejected(function(err) {
        console.log(err);
        errorHandler(err, res);
    })

}
