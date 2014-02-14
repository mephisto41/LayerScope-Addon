/*$("#saveFrame").click(function() {
  alert("A");
  self.port.emit("gotFrames", unsafeWindow.frames);
});*/

self.port.on("onChangeIP", function(params) {
  $("#urlfield").val("ws://localhost:" + params.port);
  $("#connect").click();
});
