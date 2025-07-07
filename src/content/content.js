// Content script - 桥接页面和 background script
console.log("🌉 WebSocket Proxy content script loaded");

// 检查扩展是否启用
function checkExtensionEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
      resolve(result["websocket-proxy-enabled"] !== false); // 默认启用
    });
  });
}

// 消息去重机制
let messageIdCounter = 0;
function generateMessageId() {
  return `msg_${Date.now()}_${++messageIdCounter}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
}

// 使用外部文件注入，避免 CSP 内联脚本限制
function injectWebSocketProxy() {
  console.log("💉 Injecting WebSocket proxy from external file...");

  try {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/content/injected.js");
    script.onload = function () {
      console.log("✅ External script loaded and executed");
      this.remove(); // 清理script标签
    };
    script.onerror = function () {
      console.error("❌ Failed to load external script");
      console.error("Script src:", this.src);
    };

    // 尽可能早地注入
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error("❌ Error injecting script:", error);
  }
}

// 检查扩展状态后执行注入
checkExtensionEnabled().then((enabled) => {
  if (enabled) {
    console.log("✅ Extension enabled, injecting WebSocket proxy");
    if (document.readyState === "loading") {
      injectWebSocketProxy();
    } else {
      injectWebSocketProxy();
    }
  } else {
    console.log("❌ Extension disabled, skipping WebSocket proxy injection");
  }
});

console.log("📍 Content script injection attempt completed");

// 监听来自注入脚本的消息
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.source === "websocket-proxy-injected") {
    console.log(
      "📨 Content script received message from injected script:",
      event.data
    );

    // 给消息添加唯一ID，用于去重
    const messageId = generateMessageId();
    const messageWithId = {
      type: "websocket-event",
      data: event.data.payload,
      messageId: messageId,
      timestamp: Date.now(),
      source: "content-script",
    };

    console.log("📤 Sending message with ID:", messageId);

    // 直接发送到 DevTools Panel，同时也发送到 Background Script 用于数据存储
    chrome.runtime
      .sendMessage(messageWithId)
      .then((response) => {
        console.log("✅ Message sent to extension, response:", response);
      })
      .catch((error) => {
        console.error("❌ Failed to send message to extension:", error);
      });
  }
});

// 监听来自 background script 的控制消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📥 Content script received message from background:", message);

  // 转发控制命令到注入脚本
  switch (message.type) {
    case "start-monitoring":
      console.log("🚀 Forwarding start monitoring to injected script");
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "start-monitoring",
        },
        "*"
      );
      break;

    case "stop-monitoring":
      console.log("⏹️ Forwarding stop monitoring to injected script");
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "stop-monitoring",
        },
        "*"
      );
      break;

    case "block-outgoing":
      console.log(
        "🚫 Forwarding block outgoing to injected script:",
        message.enabled
      );
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "block-outgoing",
          enabled: message.enabled,
        },
        "*"
      );
      break;

    case "block-incoming":
      console.log(
        "🚫 Forwarding block incoming to injected script:",
        message.enabled
      );
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "block-incoming",
          enabled: message.enabled,
        },
        "*"
      );
      break;

    case "get-proxy-state":
      console.log("📊 Forwarding get proxy state to injected script");
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "get-proxy-state",
        },
        "*"
      );
      break;

    case "simulate-message":
      console.log(
        "🎭 Forwarding simulate message to injected script:",
        message
      );
      window.postMessage(
        {
          source: "websocket-proxy-content",
          type: "simulate-message",
          connectionId: message.connectionId,
          message: message.message,
          direction: message.direction,
        },
        "*"
      );
      break;

    case "show-devtools-hint":
      console.log("💡 Showing DevTools hint notification");
      // 可以在页面上显示一个临时提示
      showDevToolsHint();
      break;

    default:
      console.log("❓ Unknown control message type:", message.type);
      break;
  }

  sendResponse({ received: true });
});

// 显示DevTools提示
function showDevToolsHint() {
  const hint = document.createElement("div");
  hint.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1a202c;
      color: #f7fafc;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      border: 1px solid #3182ce;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">📊 WebSocket Proxy</div>
      <div style="margin-bottom: 12px;">Press <strong>F12</strong> to open DevTools</div>
      <div style="margin-bottom: 8px;">Find <strong>"WebSocket Proxy"</strong> tab</div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: #3182ce;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        float: right;
        margin-top: 8px;
      ">Got it</button>
    </div>
  `;

  document.body.appendChild(hint);

  // 5秒后自动消失
  setTimeout(() => {
    if (hint.parentElement) {
      hint.remove();
    }
  }, 5000);
}

console.log("✅ Content script initialization complete");
