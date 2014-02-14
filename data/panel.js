self.port.on("onShow", function(devicesList) {
  $("#selectDevices").empty().append("<option value='computer'>local computer</option>");
  for (var index in devicesList) {
    $("#selectDevices").append("<option value='" + devicesList[index] + "'>" + devicesList[index] + "</option>");
  }
});

$("#btnConnect").click(function() {
  var params = {};
  params.port = $("#txtPort").val();
  params.device = $("#selectDevices").val();
  self.port.emit("onConnect", params);
});
