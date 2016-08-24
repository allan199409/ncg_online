var QueryString = (function() {
    const QueryString = {};
    function ParsedQueryString() {}
    ParsedQueryString.prototype = Object.create(null);

    function qsUnescape(s, decodeSpaces) {
      try {
        return decodeURIComponent(s);
      } catch (e) {
        return QueryString.unescapeBuffer(s, decodeSpaces).toString();
      }
    }
    QueryString.unescape = qsUnescape;


    var hexTable = new Array(256);
    for (var i = 0; i < 256; ++i)
      hexTable[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
    QueryString.escape = function(str) {
      if (typeof str !== 'string') {
        if (typeof str === 'object')
          str = String(str);
        else
          str += '';
      }
      var out = '';
      var lastPos = 0;

      for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);

        if (c === 0x21 || c === 0x2D || c === 0x2E || c === 0x5F || c === 0x7E ||
            (c >= 0x27 && c <= 0x2A) ||
            (c >= 0x30 && c <= 0x39) ||
            (c >= 0x41 && c <= 0x5A) ||
            (c >= 0x61 && c <= 0x7A)) {
          continue;
        }

        if (i - lastPos > 0)
          out += str.slice(lastPos, i);

        if (c < 0x80) {
          lastPos = i + 1;
          out += hexTable[c];
          continue;
        }

        if (c < 0x800) {
          lastPos = i + 1;
          out += hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)];
          continue;
        }
        if (c < 0xD800 || c >= 0xE000) {
          lastPos = i + 1;
          out += hexTable[0xE0 | (c >> 12)] +
                 hexTable[0x80 | ((c >> 6) & 0x3F)] +
                 hexTable[0x80 | (c & 0x3F)];
          continue;
        }

        ++i;
        var c2;
        if (i < str.length)
          c2 = str.charCodeAt(i) & 0x3FF;
        else
          throw new URIError('URI malformed');
        lastPos = i + 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | c2);
        out += hexTable[0xF0 | (c >> 18)] +
               hexTable[0x80 | ((c >> 12) & 0x3F)] +
               hexTable[0x80 | ((c >> 6) & 0x3F)] +
               hexTable[0x80 | (c & 0x3F)];
      }
      if (lastPos === 0)
        return str;
      if (lastPos < str.length)
        return out + str.slice(lastPos);
      return out;
    };

    var stringifyPrimitive = function(v) {
      if (typeof v === 'string')
        return v;
      if (typeof v === 'number' && isFinite(v))
        return '' + v;
      if (typeof v === 'boolean')
        return v ? 'true' : 'false';
      return '';
    };


    QueryString.stringify = QueryString.encode = function(obj, sep, eq, options) {
      sep = sep || '&';
      eq = eq || '=';

      var encode = QueryString.escape;
      if (options && typeof options.encodeURIComponent === 'function') {
        encode = options.encodeURIComponent;
      }

      if (obj !== null && typeof obj === 'object') {
        var keys = Object.keys(obj);
        var len = keys.length;
        var flast = len - 1;
        var fields = '';
        for (var i = 0; i < len; ++i) {
          var k = keys[i];
          var v = obj[k];
          var ks = encode(stringifyPrimitive(k)) + eq;

          if (Array.isArray(v)) {
            var vlen = v.length;
            var vlast = vlen - 1;
            for (var j = 0; j < vlen; ++j) {
              fields += ks + encode(stringifyPrimitive(v[j]));
              if (j < vlast)
                fields += sep;
            }
            if (vlen && i < flast)
              fields += sep;
          } else {
            fields += ks + encode(stringifyPrimitive(v));
            if (i < flast)
              fields += sep;
          }
        }
        return fields;
      }
      return '';
    };

    QueryString.parse = QueryString.decode = function(qs, sep, eq, options) {
      sep = sep || '&';
      eq = eq || '=';

      const obj = new ParsedQueryString();

      if (typeof qs !== 'string' || qs.length === 0) {
        return obj;
      }

      if (typeof sep !== 'string')
        sep += '';

      const eqLen = eq.length;
      const sepLen = sep.length;

      var maxKeys = 1000;
      if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
      }

      var pairs = Infinity;
      if (maxKeys > 0)
        pairs = maxKeys;

      var decode = QueryString.unescape;
      if (options && typeof options.decodeURIComponent === 'function') {
        decode = options.decodeURIComponent;
      }
      const customDecode = (decode !== qsUnescape);

      const keys = [];
      var lastPos = 0;
      var sepIdx = 0;
      var eqIdx = 0;
      var key = '';
      var value = '';
      var keyEncoded = customDecode;
      var valEncoded = customDecode;
      var encodeCheck = 0;
      for (var i = 0; i < qs.length; ++i) {
        const code = qs.charCodeAt(i);

        if (code === sep.charCodeAt(sepIdx)) {
          if (++sepIdx === sepLen) {
            const end = i - sepIdx + 1;
            if (eqIdx < eqLen) {
              if (lastPos < end)
                key += qs.slice(lastPos, end);
            } else if (lastPos < end)
              value += qs.slice(lastPos, end);
            if (keyEncoded)
              key = decodeStr(key, decode);
            if (valEncoded)
              value = decodeStr(value, decode);
            if (keys.indexOf(key) === -1) {
              obj[key] = value;
              keys[keys.length] = key;
            } else {
              const curValue = obj[key];
              if (curValue instanceof Array)
                curValue[curValue.length] = value;
              else
                obj[key] = [curValue, value];
            }
            if (--pairs === 0)
              break;
            keyEncoded = valEncoded = customDecode;
            encodeCheck = 0;
            key = value = '';
            lastPos = i + 1;
            sepIdx = eqIdx = 0;
          }
          continue;
        } else {
          sepIdx = 0;
          if (!valEncoded) {
            if (code === 37/*%*/) {
              encodeCheck = 1;
            } else if (encodeCheck > 0 &&
                       ((code >= 48/*0*/ && code <= 57/*9*/) ||
                        (code >= 65/*A*/ && code <= 70/*F*/) ||
                        (code >= 97/*a*/ && code <= 102/*f*/))) {
              if (++encodeCheck === 3)
                valEncoded = true;
            } else {
              encodeCheck = 0;
            }
          }
        }

        if (eqIdx < eqLen) {
          if (code === eq.charCodeAt(eqIdx)) {
            if (++eqIdx === eqLen) {
              const end = i - eqIdx + 1;
              if (lastPos < end)
                key += qs.slice(lastPos, end);
              encodeCheck = 0;
              lastPos = i + 1;
            }
            continue;
          } else {
            eqIdx = 0;
            if (!keyEncoded) {

              if (code === 37/*%*/) {
                encodeCheck = 1;
              } else if (encodeCheck > 0 &&
                         ((code >= 48/*0*/ && code <= 57/*9*/) ||
                          (code >= 65/*A*/ && code <= 70/*F*/) ||
                          (code >= 97/*a*/ && code <= 102/*f*/))) {
                if (++encodeCheck === 3)
                  keyEncoded = true;
              } else {
                encodeCheck = 0;
              }
            }
          }
        }

        if (code === 43/*+*/) {
          if (eqIdx < eqLen) {
            if (i - lastPos > 0)
              key += qs.slice(lastPos, i);
            key += '%20';
            keyEncoded = true;
          } else {
            if (i - lastPos > 0)
              value += qs.slice(lastPos, i);
            value += '%20';
            valEncoded = true;
          }
          lastPos = i + 1;
        }
      }

      // Check if we have leftover key or value data
      if (pairs > 0 && (lastPos < qs.length || eqIdx > 0)) {
        if (lastPos < qs.length) {
          if (eqIdx < eqLen)
            key += qs.slice(lastPos);
          else if (sepIdx < sepLen)
            value += qs.slice(lastPos);
        }
        if (keyEncoded)
          key = decodeStr(key, decode);
        if (valEncoded)
          value = decodeStr(value, decode);

        if (keys.indexOf(key) === -1) {
          obj[key] = value;
          keys[keys.length] = key;
        } else {
          const curValue = obj[key];

          if (curValue instanceof Array)
            curValue[curValue.length] = value;
          else
            obj[key] = [curValue, value];
        }
      }

      return obj;
    };

    function decodeStr(s, decoder) {
      try {
        return decoder(s);
      } catch (e) {
        return QueryString.unescape(s, true);
      }
    }

    return QueryString;
})()

$(".js-summernote").summernote({
    height: 300,
    minHeight: null,
    maxHeight: null,
    focus: false,
    toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'underline', 'clear']],
        ['fontname', ['fontname']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['table', ['table']],
        ['insert', ['link', 'picture', 'video']],
        ['view', ['fullscreen', 'codeview']]
    ]
});

$.validator.methods.seleted = function(value, element) {
    return value != 0;
}

jQuery('.js-validation-material').validate({
    ignore: "",
    errorClass: 'help-block text-right animated fadeInDown',
    errorElement: 'div',
    errorPlacement: function(error, e) {
        jQuery(e).parents('.form-group > div').append(error);
    },
    highlight: function(e) {
        var elem = jQuery(e);

        elem.closest('.form-group').removeClass('has-error').addClass('has-error');
        elem.closest('.help-block').remove();
    },
    success: function(e) {
        var elem = jQuery(e);

        elem.closest('.form-group').removeClass('has-error');
        elem.closest('.help-block').remove();
    },
    rules: {
        // "form-title": {
        //     required: true
        // },
        // "form-author": {
        //     required: true
        // },
        // "form-short": {
        //     required: true
        // },
        // "form-summary": {
        //     seleted: true
        // }
    },
    messages: {
        "form-title": "必须输入标题",
        "form-author": "必须输入作者",
        "form-short": "必须输入摘要",
        "form-summary": "必须选择一个类别"
    },
    submitHandler: function(form) {
        var textareaValue = $('.js-summernote').summernote('code');
        upload(textareaValue);
    }
});

function dataURItoBlob(dataURI) {

    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}

var convertType = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif"
}

var uploadErr = function(err) {

}

var Qiniu_UploadUrl = "http://up.qiniu.com";
var uploadToQiniu = function(f, token, key, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', Qiniu_UploadUrl, true);
    var formData, startDate;
    formData = new FormData();
    if (key !== null && key !== undefined) formData.append('key', key);
    formData.append('token', token);
    formData.append('file', f);

    // var taking;
    // xhr.upload.addEventListener("progress", function(evt) {
    //     if (evt.lengthComputable) {
    //         var nowDate = new Date().getTime();
    //         taking = nowDate - startDate;
    //         var x = (evt.loaded) / 1024;
    //         var y = taking / 1000;
    //         var uploadSpeed = (x / y);
    //         var formatSpeed;
    //         if (uploadSpeed > 1024) {
    //             formatSpeed = (uploadSpeed / 1024).toFixed(2) + "Mb\/s";
    //         } else {
    //             formatSpeed = uploadSpeed.toFixed(2) + "Kb\/s";
    //         }
    //         var percentComplete = Math.round(evt.loaded * 100 / evt.total);
    //         progressbar.progressbar("value", percentComplete);
    //         // console && console.log(percentComplete, ",", formatSpeed);
    //     }
    // }, false);

    xhr.onreadystatechange = function(response) {
        if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
            var blkRet = JSON.parse(xhr.responseText);
            callback(blkRet);
            //$("#dialog").html(xhr.responseText).dialog();
        } else if (xhr.status != 200 && xhr.responseText) {
            switch (xhr.status) {
                case 400:
                    break;
                case 401:
                    break;
                case 413:
                    break;
                default:

            }
            console.log(xhr.responseText);
        }
    };
    startDate = new Date().getTime();
    // $("#progressbar").show();
    xhr.send(formData);
};

var uploadPic = function(file, type, callback) {
    $.ajax({
        url: "/admin/getUploadToken",
        type: 'get',
        data: {
            'type': type
        },
        success: function (data) {
            uploadToQiniu(file, data.token, data.key, function(blkRet) {
                blkRet.url = data.url;
                callback(blkRet);
            });
        },
        error: function (err) {

        }
    })
}

var upload = function(textareaValue) {
    var content = $("<div>" + textareaValue + "</div>").clone();
    var imageDoms = content.find("img");

    var waitToUploadImage = [];
    for(var i = 0; i < imageDoms.length; i++) {
        var imageUrl = $(imageDoms[i]).attr("src");
        if (imageUrl.indexOf("data") == 0) {
            var imageFile = dataURItoBlob(imageUrl);
            waitToUploadImage.push({
                file: imageFile,
                dom: $(imageDoms[i])
            });
        }
    }
    var imageCount = waitToUploadImage.length;

    var tryFinalSubmit = function() {
        if (imageCount == 0) {

            var uploadContent = {
                title: $("#form-title").val(),
                author: $("#form-author").val(),
                short: $("#form-short").val(),
                cover: $("#cover-preview").attr("src"),
                summary: parseInt($("#form-summary").val()),
                tags: $("#form-tags").val() || "",
                content: content.prop('innerHTML')
            }
            if (QueryString.parse(window.location.search.substr(1)).id) {
                uploadContent.id = parseInt(QueryString.parse(window.location.search.substr(1)).id);
            }

            $.ajax({
                "url": "/admin/saveArticle",
                "method": "post",
                "data": JSON.stringify(uploadContent),
                "contentType": "application/json",
                "success": function(data) {
                    window.location.href = "/document/" + data.documentID;
                },
                "error": function() {

                }
            })

        }
    }

    if (imageCount) {
        waitToUploadImage.forEach(function(image) {
            var type = convertType[image.file.type];
            if (!type) {
                uploadErr("不支持的图片格式");
            } else {
                uploadPic(image.file, type, function(blkRet) {
                    console.log(blkRet);
                    image.dom.attr("src", blkRet.url);
                    imageCount = imageCount - 1;
                    tryFinalSubmit();
                });
            }
        })
    } else {
        tryFinalSubmit();
    }
}

var uplaodingCover = false;
$("#form-image").on("change", function() {
    var preview = $("#cover-preview")[0];
    var file    = $('#form-image')[0].files[0];
    var reader  = new FileReader();

    if (file) {
        uplaodingCover = true;
        uploadPic(file, convertType[file.type], function(blkRet) {
            console.log(blkRet);
            uplaodingCover = false;
            preview.src = blkRet.url;
        })
    } else {
        preview.src="/assets/img/cover/default.png";
    }
})

$("button").click(function() {
    $(this).blur();
})

// var checkForm = function() {
//     if ($("#form-title").val() == "") {
//         $("#form-error").text("必须填标题");
//     }
// }
//
$("#form-submit").click(function() {

})

window.onbeforeunload = function(event) {
    //TODO cancel the //
    //event.returnValue = "确定离开本页？已做的修改将不被保存";
}
