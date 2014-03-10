$("#saveFrame").after("<button id='saveFrameAddon'>Save Frame(Addon)</button>");
$("#saveFrameAddon").click(function() {
  unsafeWindow.convertImageDataToDataURL(unsafeWindow.frames);
  self.port.emit("saveFrames", unsafeWindow.frames);
});

$("#files").after("<button id='loadFrameAddon'>Load Frame(Addon)</button>");
$("#loadFrameAddon").click(function() {
  self.port.emit("loadFrames");
});

self.port.on("onChangeIP", function(params) {
  $("#urlfield").val("ws://localhost:" + params.port);
  $("#connect").click();
});

self.port.on("afterLoadFrames", function(frames) {
  unsafeWindow.assignNewFrames(frames);
});

var fileQueue = [];
unsafeWindow.readImageFromFile = function(texture, context) {
  fileQueue[texture.imageDataURL] = { context: context, texture: texture };
  self.port.emit("readImageFromFile", texture.imageDataURL);
};

self.port.on("onImageLoad", function(fileContent) {
  var texture = fileQueue[fileContent.fileName].texture;
  var cx = fileQueue[fileContent.fileName].context;
  delete fileQueue[fileContent.fileName];
  texture.imageDataURL = fileContent.content;
  unsafeWindow.loadImageToCanvas(texture, cx);
});
