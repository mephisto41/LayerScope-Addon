self.port.on("onChangeIP", function(params) {
  $("#urlfield").val("ws://localhost:" + params.port);
  $("#connect").click();
});
