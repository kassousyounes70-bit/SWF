// Windows desktop authentication bridge for YK PubEngine.
(function () {
  "use strict";
  var BASE_URL = "https://yk-pubengine-v1.onrender.com";
  function invoke(command) {
    if (!window.__TAURI__ || !window.__TAURI__.core || !window.__TAURI__.core.invoke) return Promise.reject(new Error("Windows bridge is unavailable"));
    return window.__TAURI__.core.invoke(command);
  }
  window.DesktopBridge = { getDeviceId: function () { return invoke("get_device_id"); } };
  function getDeviceId() { return window.DesktopBridge.getDeviceId(); }
  function callServer(path, payload) {
    return fetch(BASE_URL + path, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) })
      .then(function(res){ return res.json().then(function(data){ return {ok:res.ok,data:data}; }); })
      .catch(function(){ return {ok:false,data:{error:"تعذّر الاتصال بالخادم"}}; });
  }
  window.createAccount = function(couponCode,email,password){ return getDeviceId().then(function(deviceId){ return callServer("/createAccount",{couponCode:couponCode,deviceId:deviceId,email:email,password:password}); }); };
  window.loginAccount = function(couponCode,email,password){ return getDeviceId().then(function(deviceId){ return callServer("/login",{couponCode:couponCode,deviceId:deviceId,email:email,password:password}); }); };
  window.getDesktopDeviceId = getDeviceId;
})();
