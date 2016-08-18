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
                tags: $("#form-tags").val(),
                content: content.prop('outerHTML')
            }
            console.log(uploadContent);

        }
    }

    if (imageCount) {
        waitToUploadImage.forEach(function(image) {
            var type = convertType[image.file.type];
            if (!type) {
                uploadErr("不支持的图片格式");
            } else {
                uploadPic(image.file, type, function(blkRet) {
                    image.dom.attr("src", staticDomain + "/" + blkRet.key);
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
            uplaodingCover = false;
            preview.src = staticDomain + "/" + blkRet.key;
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
