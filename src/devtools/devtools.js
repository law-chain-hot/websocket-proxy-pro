// DevTools 主入口文件

// 检查扩展是否启用
function checkExtensionEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
      resolve(result["websocket-proxy-enabled"] !== false); // 默认启用
    });
  });
}

// 只有在扩展启用时才创建 DevTools Panel
checkExtensionEnabled().then((enabled) => {
  if (enabled) {
    console.log("✅ Extension enabled, creating WebSocket Proxy panel");

    chrome.devtools.panels.create(
      "WebSocket Proxy",
      "icon.png", // 可选的图标
      "src/devtools/panel.html",
      function (panel) {
        console.log("WebSocket Proxy panel created");

        // 当 panel 显示时
        panel.onShown.addListener(function (panelWindow) {
          console.log("WebSocket Proxy panel shown");
        });

        // 当 panel 隐藏时
        panel.onHidden.addListener(function () {
          console.log("WebSocket Proxy panel hidden");
        });
      }
    );
  } else {
    console.log("❌ Extension disabled, skipping DevTools panel creation");
  }
});
