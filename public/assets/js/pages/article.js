$("button[render=delete]").click(function() {
    var id = parseInt($(this).attr("data-id"));
    if (id) {
        $.ajax({
            url: "/admin/removeArticle",
            method: "post",
            data: JSON.stringify({
                id: id
            }),
            contentType: "application/json",
            error: function(err) {

            },
            success: function(data) {
                console.log(data);
                location.reload(false);
            }
        })
    }

})
