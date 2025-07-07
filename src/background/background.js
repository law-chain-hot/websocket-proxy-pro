// Background script - Service Worker for Chrome Extension V3
console.log("🚀 WebSocket Proxy background script loaded");

// 存储 WebSocket 连接数据
let websocketData = {
  connections: [],
  isMonitoring: true, // 默认开启监控
};

// 检查扩展是否启用
async function isExtensionEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
      resolve(result["websocket-proxy-enabled"] !== false); // 默认启用
    });
  });
}

// 监听来自 DevTools Panel 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Background received message:", message, "from:", sender);

  switch (message.type) {
    case "start-monitoring":
      console.log("🚀 Starting WebSocket monitoring");
      websocketData.isMonitoring = true;

      // 通知所有 content scripts 开始监控
      notifyAllTabs("start-monitoring");
      sendResponse({ success: true, monitoring: true });
      break;

    case "stop-monitoring":
      console.log("⏹️ Stopping WebSocket monitoring");
      websocketData.isMonitoring = false;

      // 通知所有 content scripts 停止监控
      notifyAllTabs("stop-monitoring");
      sendResponse({ success: true, monitoring: false });
      break;

    case "get-existing-data":
      console.log(
        "📊 Panel requesting existing data, connections:",
        websocketData.connections.length
      );

      // 发送现有数据到 DevTools Panel
      sendResponse({
        success: true,
        data: websocketData.connections,
        isMonitoring: websocketData.isMonitoring,
      });
      break;

    case "block-outgoing":
      console.log("🚫 Toggling outgoing message blocking:", message.enabled);

      // 通知所有 content scripts 切换出站消息阻止
      notifyAllTabs("block-outgoing", { enabled: message.enabled });
      sendResponse({ success: true, blockOutgoing: message.enabled });
      break;

    case "block-incoming":
      console.log("🚫 Toggling incoming message blocking:", message.enabled);

      // 通知所有 content scripts 切换入站消息阻止
      notifyAllTabs("block-incoming", { enabled: message.enabled });
      sendResponse({ success: true, blockIncoming: message.enabled });
      break;

    case "websocket-event":
      // Ensure tabId is present
      if (!sender.tab?.id) {
        console.warn(
          "⚠️ WebSocket event missing tabId, ignoring:",
          message.data
        );
        sendResponse({ received: false, reason: "missing-tabId" });
        break;
      }

      // Add tabId to event data
      message.data.tabId = sender.tab.id;
      message.tabId = sender.tab.id;

      // Store connection data
      websocketData.connections.push(message.data);

      // Forward to DevTools Panel
      forwardToDevTools(message);
      sendResponse({ received: true });
      break;

    case "proxy-state-change":
      console.log("🎛️ Proxy state change:", message.data);

      // 转发状态变化到 DevTools Panel
      forwardToDevTools(message);
      sendResponse({ received: true });
      break;

    case "simulate-message":
      console.log("🎭 Simulating message:", message.data);

      // 如果有指定的 tabId，只通知那个标签页；否则通知所有标签页
      const targetTabId = message.data.tabId || null;
      notifyAllTabs("simulate-message", message.data, targetTabId);
      sendResponse({ success: true, simulated: true });
      break;

    case "toggle-extension":
      console.log("🔄 Toggling extension:", message.enabled);

      // 保存状态
      chrome.storage.local.set({
        "websocket-proxy-enabled": message.enabled,
      });

      sendResponse({ success: true, enabled: message.enabled });
      break;

    case "show-devtools-hint":
      console.log("💡 Showing DevTools hint");
      // 这个消息由popup发送，不需要特别处理
      sendResponse({ success: true });
      break;

    default:
      console.log("❓ Unknown message type:", message.type);
      sendResponse({ error: "Unknown message type" });
      break;
  }

  return true; // 保持消息通道开放以支持异步响应
});

// 通知所有标签页或特定标签页的 content scripts
async function notifyAllTabs(type, data = {}, targetTabId = null) {
  try {
    let tabs;

    if (targetTabId) {
      // 通知特定标签页
      tabs = await chrome.tabs.query({ currentWindow: true });
      tabs = tabs.filter((tab) => tab.id === targetTabId);
    } else {
      // 通知所有标签页（不仅仅是活动的）
      tabs = await chrome.tabs.query({ currentWindow: true });
    }

    console.log(
      `📢 Notifying ${tabs.length} tabs about: ${type}`,
      targetTabId ? `(target: ${targetTabId})` : "(all tabs)"
    );

    const promises = tabs.map((tab) => {
      if (tab.id) {
        return chrome.tabs
          .sendMessage(tab.id, {
            type: type,
            ...data,
          })
          .catch((error) => {
            console.warn(`⚠️ Failed to notify tab ${tab.id}:`, error);
          });
      }
    });

    await Promise.all(promises);
    console.log(`✅ Notification sent to tabs: ${type}`);
  } catch (error) {
    console.error("❌ Failed to notify tabs:", error);
  }
}

// 转发消息到 DevTools Panel
function forwardToDevTools(message) {
  try {
    // DevTools Panel 也通过 chrome.runtime.onMessage 监听
    // 我们可以直接广播消息，Panel 会接收到
    chrome.runtime.sendMessage(message).catch((error) => {
      // 这是正常的，因为 Panel 可能还未打开
      console.log("📤 Message queued for DevTools Panel:", message.type);
    });
  } catch (error) {
    console.error("❌ Failed to forward to DevTools Panel:", error);
  }
}

// 监听标签页更新，可能需要重新注入脚本
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && websocketData.isMonitoring) {
    console.log("🔄 Tab updated, monitoring is active for tab:", tabId);
    // 可以在这里重新注入脚本或发送状态更新
  }
});

// 当扩展启动时
chrome.runtime.onStartup.addListener(() => {
  console.log("🌅 Extension started");
  websocketData = {
    connections: [],
    isMonitoring: true, // 默认开启监控
  };

  // 开始监控所有标签页
  console.log("🚀 Auto-starting WebSocket monitoring on startup");
  notifyAllTabs("start-monitoring");
});

// 当扩展安装时
chrome.runtime.onInstalled.addListener(() => {
  console.log("📦 Extension installed/updated");
  websocketData = {
    connections: [],
    isMonitoring: true, // 默认开启监控
  };

  // 开始监控所有标签页
  console.log("🚀 Auto-starting WebSocket monitoring on install");
  notifyAllTabs("start-monitoring");
});

console.log("✅ Background script initialization complete");
