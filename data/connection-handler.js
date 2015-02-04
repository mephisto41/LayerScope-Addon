var $d = $("<span>").append("<button id='saveFrameAddon'>Save Frame(Addon)</button>")
                    .append("<button id='loadFrameAddon'>Load Frame(Addon)</button>");

$("#save-btn").after($d);

$("#saveFrameAddon, #loadFrameAddon")
  .addClass("button-danger-color")
  .css({"border-color": "#D43F3A",
        "margin-left": "5px",
        "background": "#D9534F !important"});

$("#saveFrameAddon").click(function() {
  var frames = unsafeWindow.LayerScope.Session.frames;
  self.port.emit("saveFrames", frames);
});

$("#loadFrameAddon").click(function() {
  self.port.emit("loadFrames");
});

self.port.on("onChangeIP", function(params) {
  $("#url-address").val("ws://localhost:" + params.port);
  $("#connection-btn").click();
});

// create new object into layerview.js (page script) scope
var Addon = createObjectIn(unsafeWindow, {defineAs: "Addon"});

self.port.on("afterLoadFrames", function(frames) {
  // we should clone this object for layerview.js
  unsafeWindow.LayerScope.Session.begin(cloneInto(frames, Addon));
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
