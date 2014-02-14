var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
var panelModule = require("sdk/panel");
const {Cu} = require("chrome");
const toolbarButton = require("ui/toolbarbutton");
var {Devices} = Cu.import("resource://gre/modules/devtools/Devices.jsm");
const {devtools} = Cu.import("resource://gre/modules/devtools/Loader.jsm", {});
const devtoolsRequire = devtools.require;
const {ConnectionManager} = devtoolsRequire("devtools/client/connection-manager");

panel = panelModule.Panel({
  width: 320,
  height: 300,
  contentURL: data.url("panel.html"),
  contentScriptFile: [
    data.url("js/jquery-1.8.3.js"),
    data.url("panel.js"),
  ],
  contentScriptWhen: "ready",
  onShow: function() {
    panel.port.emit("onShow", Devices.available());
  },
});

panel.port.on("onConnect", function(params) {
  if (params.device == "computer") {
  } else {
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

tbbOptions = {
  panel: panel,
  id: "layerscope-button",
  image: data.url("toolbar_on.png"),
  label: "LayerScope",
  toolbarID: "nav-bar",
  forceMove: true
};
tbb = toolbarButton.ToolbarButton(tbbOptions);
tbb.moveTo({toolbarID: "nav-bar", forceMove: true});

/*tabs.open({
    url: data.url("layerscope/layerview.html")
});

pageMod.PageMod({
    include: /.*layerview.html/,
    contentScriptFile: [
      data.url("js/jquery-1.8.3.js"),
      data.url("connection-handler.js")
      ],
    onAttach: function(worker) {
      console.log(Devices.available());
      worker.port.on("gotFrames", function(framesContent) {
        //window.alert("gotFrames");
        console.log("gotFrames! " + framesContent);
      });
    }
});*/
