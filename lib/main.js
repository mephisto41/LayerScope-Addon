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
const {Downloads} = Cu.import("resource://gre/modules/Downloads.jsm");
const FileUtils = Cu.import("resource://gre/modules/FileUtils.jsm").FileUtils

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
    },
  });

  panel.hide();
});
