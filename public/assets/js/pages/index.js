var TO_RADIANS = Math.PI/180;

$('input').change(function() {
    var name = $(this).attr("name");
    var reader = new FileReader();
    if (this.files.length) {
        reader.readAsDataURL(this.files[0]);
        reader.onload = function(e) {
            var image = reader.result;
            $('img#' + name).attr('src', image);
            tryToDraw();
        }
    }
    //var url = window.URL.createObjectURL(this);
})


var width = $("#preViewContaniner").width();

var tryToDraw = function() {
    var test = [];
    test[0] = $("#frontView").attr('src');
    test[1] = $("#rightView").attr('src');
    test[2] = $("#leftView").attr('src');
    test[3] = $("#backView").attr('src');

    if (test[0] && test[1] && test[2] && test[3]) {
        draw();
    }
}

function rotateAndPaintImage ( context, image, angleInRad , positionX, positionY, axisX, axisY ) {
    context.translate( positionX, positionY );
    context.rotate( angleInRad );
    context.drawImage( image, -axisX, -axisY );
    context.rotate( -angleInRad );
    context.translate( -positionX, -positionY );
}

var draw = function() {
    var c=document.getElementById("real");
    var cxt=c.getContext("2d");
    cxt.fillStyle="#000000";
    cxt.fillRect(0,0,720,720);
    var frontImage = new Image();
    var backImage = new Image();
    var leftImage = new Image();
    var rightImage = new Image();

    frontImage.src = $("#frontView").attr('src');
    frontImage.onload = function() {
        var xPorp = 240 / frontImage.width;
        var yPorp = 240 / frontImage.height;
        cxt.rotate(TO_RADIANS * 180);
        if (xPorp < yPorp) {
            var newWidth = frontImage.width * xPorp;
            var newHeight = frontImage.height * xPorp;
            var offset = (240 - newHeight)/2;

            cxt.drawImage(frontImage, -480, -240 + offset, newWidth, newHeight);
        } else {
            var newWidth = frontImage.width * yPorp;
            var newHeight = frontImage.height * yPorp;
            var offset = (240 - newWidth)/2;

            cxt.drawImage(frontImage, -480 + offset, -240, newWidth, newHeight);
        }
        cxt.rotate(-TO_RADIANS * 180);
        drawPreview();
    }

    leftImage.src = $("#leftView").attr('src');
    leftImage.onload = function() {
        var xPorp = 240 / leftImage.width;
        var yPorp = 240 / leftImage.height;
        cxt.rotate(TO_RADIANS * 90);
        if (xPorp < yPorp) {
            var newWidth = leftImage.width * xPorp;
            var newHeight = leftImage.height * xPorp;
            var offset = (240 - newHeight)/2;

            cxt.drawImage(leftImage, 240, -240 + offset, newWidth, newHeight);
        } else {
            var newWidth = leftImage.width * yPorp;
            var newHeight = leftImage.height * yPorp;
            var offset = (240 - newWidth)/2;

            cxt.drawImage(leftImage, 240 + offset, -240, newWidth, newHeight);
        }
        cxt.rotate(-TO_RADIANS * 90);

        drawPreview();
    }

    rightImage.src = $("#rightView").attr('src');
    rightImage.onload = function() {
        var xPorp = 240 / rightImage.width;
        var yPorp = 240 / rightImage.height;
        cxt.rotate(-TO_RADIANS * 90);
        if (xPorp < yPorp) {
            var newWidth = rightImage.width * xPorp;
            var newHeight = rightImage.height * xPorp;
            var offset = (240 - newHeight)/2;

            cxt.drawImage(rightImage, -480, 480 + offset, newWidth, newHeight);
        } else {
            var newWidth = rightImage.width * yPorp;
            var newHeight = rightImage.height * yPorp;
            var offset = (240 - newWidth)/2;

            cxt.drawImage(rightImage, -480 + offset, 480, newWidth, newHeight);
        }
        cxt.rotate(TO_RADIANS * 90);

        drawPreview();
    }

    backImage.src = $("#backView").attr('src');
    backImage.onload = function() {
        var xPorp = 240 / backImage.width;
        var yPorp = 240 / backImage.height;
        if (xPorp < yPorp) {
            var newWidth = backImage.width * xPorp;
            var newHeight = backImage.height * xPorp;
            var offset = (240 - newHeight)/2;

            cxt.drawImage(backImage, 240, 480 + offset, newWidth, newHeight);
        } else {
            var newWidth = backImage.width * yPorp;
            var newHeight = backImage.height * yPorp;
            var offset = (240 - newWidth)/2;

            cxt.drawImage(backImage, 240 + offset, 480, newWidth, newHeight);
        }

        drawPreview();
    }
}

var drawPreview = function() {
    $('canvas#preView').attr('width', width*0.5);
    $('canvas#preView').attr('height', width*0.5);

    var canvasWidth = width*0.5;
    var c=document.getElementById("preView");
    var cxt=c.getContext("2d");
    cxt.fillStyle="#000000";
    cxt.fillRect(0,0,canvasWidth,canvasWidth);
    var c=document.getElementById("real");

    cxt.drawImage(document.getElementById("real"), 0, 0, canvasWidth,canvasWidth);

}

$('#get').click(function() {
    var Pic = document.getElementById("real").toDataURL("image/png");
    Pic = Pic.replace(/^data:image\/(png|jpg);base64,/, "");

    $.ajax({
        type: 'POST',
        url: 'uploadPic',
        data: {
            picData: Pic
        },
        success: function (msg) {
            $("#showID").text(msg);
            jQuery('#apps-modal').modal('show');
        }
    });
})
