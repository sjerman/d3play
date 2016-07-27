$(function () {
    $.getJSON("data/format.json", function (data) {
        var jsonPretty = JSON.stringify(data, null, '\t');

        $("pre").text(jsonPretty);
    });
});