var SaveButton = function (context) {
  var ui = $.summernote.ui;

  var button = ui.button({
    contents: '<i class="fa fa-floppy-o"/>',
    tooltip: 'save',
    click: function () {
        console.log("save");
    }
  });

  return button.render();
}

$(".js-summernote").summernote({
    height: 300,
    minHeight: null,
    maxHeight: null,
    focus: true,
    buttons: {
        save: SaveButton
    },
    toolbar: [
        ['style', ['style']],
        ['font', ['bold', 'underline', 'clear']],
        ['fontname', ['fontname']],
        ['color', ['color']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['table', ['table']],
        ['insert', ['link', 'picture', 'video']],
        ['view', ['fullscreen', 'codeview', 'help']],
        ['saves', ['save']]
    ]
});

$("button").click(function() {
    $(this).blur();
})
