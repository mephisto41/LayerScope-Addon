var $d = $("<span>").append("<button id='saveFrameAddon' style='color:blue'>Save Frame(Addon)</button>")
                    .append("<button id='loadFrameAddon' style='color:blue'>Load Frame(Addon)</button>");

$("#saveFrame").before($d);

$("#saveFrameAddon").click(function() {
  unsafeWindow.convertImageDataToDataURL(unsafeWindow.frames);
  self.port.emit("saveFrames", unsafeWindow.frames);
});

$("#loadFrameAddon").click(function() {
  self.port.emit("loadFrames");
});

self.port.on("onChangeIP", function(params) {
  $("#urlfield").val("ws://localhost:" + params.port);
  $("#connect").click();
});

// create new object into layerview.js (page script) scope
var Addon = createObjectIn(unsafeWindow, {defineAs: "Addon"});

self.port.on("afterLoadFrames", function(frames) {
  // we should clone this object for layerview.js
  unsafeWindow.assignNewFrames(cloneInto(frames, Addon));
});

var fileQueue = [];
function readImageFromFile(texture, context) {
  fileQueue[texture.imageDataURL] = { context: context, texture: texture };
  self.port.emit("readImageFromFile", texture.imageDataURL);
};
// export function into layerview.js
exportFunction(readImageFromFile, Addon, {defineAs: "readImageFromFile"});

self.port.on("onImageLoad", function(fileContent) {
  var texture = fileQueue[fileContent.fileName].texture;
  var cx = fileQueue[fileContent.fileName].context;
  delete fileQueue[fileContent.fileName];
  texture.imageDataURL = fileContent.content;
  unsafeWindow.loadImageToCanvas(texture, cx);
});

self.port.on("loadFileError", function(){
  var $log = $("#error-log").empty();
  $log.append("<p>Loading files error. Do you use a correct JSON file or do you have the ./image folder?</p>");
});
