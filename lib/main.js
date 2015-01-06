var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var panelModule = require("sdk/panel");
var windowUtils = require("sdk/window/utils");
var { ToggleButton } = require("sdk/ui/button/toggle");
var fileErrorHandled = false;

// Cc: Components.classes, Ci: Components.interfaces, Cu: Components.utils
const {Cc,Ci,Cu} = require("chrome");
const {Devices} = Cu.import("resource://gre/modules/devtools/Devices.jsm");
const {Services} = Cu.import("resource://gre/modules/Services.jsm");

// Addon UI initializaion
var button = ToggleButton({
    id: "layerscope-addon",
    label: "LayerScope",
    icon: {
      "26": "./icons/beer-26.png",
      "32": "./icons/beer-32.png",
      "48": "./icons/beer-48.png"
    },
    onChange: handleChange
  });

var panel = panelModule.Panel({
  width: 250,
  height: 150,
  contentURL: data.url("panel.html"),
  contentScriptFile: [
    data.url("js/jquery-1.8.3.js"),
    data.url("panel.js"),
  ],
  contentScriptWhen: "ready",
  onShow: function() {
    updateDevices();
  },
  onHide: function() {
    button.state('window', {checked: false});
  }
});

function handleChange(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
  }
}

function updateDevices() {
  panel.port.emit("updateDevices", Devices.available());
}

Devices.on("register", updateDevices);
Devices.on("unregister", updateDevices);
Devices.on("addon-status-updated", updateDevices);

// Handle connection
panel.port.on("onConnect", function(params) {
  if (params.device != "computer") {
    // Adb devices
    let device = Devices.getByName(params.device);
    device.connect(params.port).then((port) => {
      params.port = port;
    });
  }

  tabs.open({
    url: data.url("layerscope/layerview.html"),
    onReady: function onReady(tab) {
      worker = tab.attach({
        contentScriptFile: [
          data.url("js/jquery-1.8.3.js"),
          data.url("connection-handler.js")
        ],
      });

      worker.port.emit("onChangeIP", params);

      worker.port.on("saveFrames", function(framesData) {
        const nsIFilePicker = Ci.nsIFilePicker;
        var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.defaultExtension = "json";
        fp.defaultString = "layerscope";
        mode = nsIFilePicker.modeSave;
        fp.init(windowUtils.getMostRecentBrowserWindow(), null, mode);
        fp.appendFilters(nsIFilePicker.filterText);
        fp.open(function(aResult) {
          if (aResult == nsIFilePicker.returnCancel)
            return;

          // Save All Image
          var privacyContext = windowUtils.getMostRecentBrowserWindow()
                              .QueryInterface(Ci.nsIInterfaceRequestor)
                              .getInterface(Ci.nsIWebNavigation)
                              .QueryInterface(Ci.nsILoadContext);
          var file = Cc["@mozilla.org/file/local;1"].
                       createInstance(Ci.nsILocalFile);
          file.initWithPath(fp.file.parent.path);
          file.append("images");
          if (file.exists())
            file.remove(true);
          file.create(file.DIRECTORY_TYPE, parseInt("0777", 8));

          var fileCount = 1;
          for (var i = 0; i < framesData.length; ++i) {
            var frame = framesData[i];
            for (var j = 0; j < frame.textures.length; ++j) {
              var t = frame.textures[j];
              if (t.imageDataURL) {
                var imgFile = file.clone();
                imgFile.append(fileCount + ".png");
                ++fileCount;
                if (imgFile.exists())
                  imgFile.remove(true);
                imgFile.create(imgFile.NORMAL_FILE_TYPE, parseInt("0666", 8));
                var uri = Services.io.newURI(t.imageDataURL, 'utf8', null);
                var persist = Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].
                               createInstance(Ci.nsIWebBrowserPersist);
                persist.saveURI(uri, null, null, null, null, imgFile, privacyContext);
                t.imageDataURL = "images/" + imgFile.leafName;
              }
            }
          }

          // Save JSON file
          if (fp.file.exists())
            fp.file.remove(true);
          fp.file.create(fp.file.NORMAL_FILE_TYPE, parseInt("0666", 8));
          let stream = Cc["@mozilla.org/network/file-output-stream;1"].
                        createInstance(Ci.nsIFileOutputStream);
          stream.init(fp.file, 0x02, 0x200, null);
          function replacer(key,value) {
            if (key=="imageData") return undefined;
            else return value;
          }
          var jsonFramesData = JSON.stringify(framesData, replacer);
          stream.write(jsonFramesData, jsonFramesData.length);
          stream.close();
        });
      });

      worker.port.on("loadFrames", function() {
        // reset flag for error handle
        fileErrorHandled = false;

        // handle file IO
        const nsIFilePicker = Ci.nsIFilePicker;
        var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.defaultString = "layerscope";
        mode = nsIFilePicker.modeOpen;
        fp.init(windowUtils.getMostRecentBrowserWindow(), null, mode);
        fp.open(function(aResult) {
          if (aResult == nsIFilePicker.returnCancel)
            return;

          let stream = Cc["@mozilla.org/network/file-input-stream;1"].
                      createInstance(Ci.nsIFileInputStream);
          stream.init(fp.file, 0x01, parseInt("0444", 8), null);
          let streamIO = Cc["@mozilla.org/scriptableinputstream;1"].
                      createInstance(Ci.nsIScriptableInputStream);
          streamIO.init(stream);
          let input = streamIO.read(stream.available());
          streamIO.close();
          stream.close();

          var framesData = JSON.parse(input);

          //update image path
          var jsonFileDir = fp.file.parent.path;
          for (var i = 0; i < framesData.length; ++i) {
            var frame = framesData[i];
            for (var j = 0; j < frame.textures.length; ++j) {
              var t = frame.textures[j];
              if (t.imageDataURL) {
                t.imageDataURL = "file://" + fp.file.parent.path + "/" + t.imageDataURL;
              }
            }
          }
          worker.port.emit("afterLoadFrames", framesData);
        });
      });

      worker.port.on("readImageFromFile", function(fileName) {
        try {
          var url = Services.io.newURI(fileName, null, null);
          if (!url || !url.schemeIs("file")) return;
          var pngFile = url.QueryInterface(Ci.nsIFileURL).file;
          var istream = Cc["@mozilla.org/network/file-input-stream;1"].
                          createInstance(Ci.nsIFileInputStream);
          istream.init(pngFile, -1, -1, false);
        } catch(err) {
          if (!fileErrorHandled) {
            fileErrorHandled = true;
            worker.port.emit("loadFileError");
          }
          return;
        }
        var bstream = Cc["@mozilla.org/binaryinputstream;1"].
                        createInstance(Ci.nsIBinaryInputStream);
        bstream.setInputStream(istream);
        var bytes = bstream.readBytes(bstream.available());
        var base64 = require("sdk/base64");
        var encodedData = base64.encode(bytes);
        fileContent = {};
        fileContent.fileName = fileName;
        fileContent.content = "data:image/png;base64," + encodedData;
        worker.port.emit("onImageLoad", fileContent);
      });
    },
  });

  panel.hide();
});
