// Content script - Bridge between page and background script
console.log("🌉 WebSocket Proxy content script loaded");

// Message deduplication mechanism
let messageIdCounter = 0;
function generateMessageId() {
  return `msg_${Date.now()}_${++messageIdCounter}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get current tab ID
let currentTabId = null;
chrome.runtime.sendMessage({ type: 'get-tab-id' }, (response) => {
  if (response && response.tabId) {
    currentTabId = response.tabId;
  }
});

// Use external file injection to avoid CSP inline script restrictions
function injectWebSocketProxy() {
  console.log("💉 Injecting WebSocket proxy from external file...");

  try {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/content/injected.js");
    script.onload = function () {
      console.log("✅ External script loaded and executed");
      this.remove(); // Clean up script tag
    };
    script.onerror = function () {
      console.error("❌ Failed to load external script");
      console.error("Script src:", this.src);
    };

    // Inject as early as possible
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error("❌ Error injecting script:", error);
  }
}

// Immediately execute injection
if (document.readyState === "loading") {
  injectWebSocketProxy();
} else {
  injectWebSocketProxy();
}

console.log("📍 Content script injection attempt completed");

// Listen for messages from injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data && event.data.source === "websocket-proxy-injected") {
    console.log(
      "📨 Content script received message from injected script:",
      event.data
    );

    // Add unique ID to message for deduplication
    const messageId = generateMessageId();
    const messageWithId = {
      type: "websocket-event",
      data: {
        ...event.data.payload,
        tabId: currentTabId, // Add tabId to message data
      },
      messageId: messageId,
      timestamp: Date.now(),
      source: "content-script"
    };

    console.log("📤 Sending message with ID:", messageId, "TabId:", currentTabId);

    // Send directly to DevTools Panel, also send to Background Script for data storage
    chrome.runtime
      .sendMessage(messageWithId)
      .then((response) => {
        console.log(
          "✅ Message sent to extension, response:",
          response
        );
      })
      .catch((error) => {
        console.error("❌ Failed to send message to extension:", error);
      });
  }
});

// Listen for control messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📥 Content script received message from background:", message);

  // Update tabId if provided
  if (sender.tab && sender.tab.id) {
    currentTabId = sender.tab.id;
  }

  // Forward control commands to injected script
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

    case "get-tab-id":
      console.log("📍 Providing tab ID to background script");
      sendResponse({ tabId: currentTabId });
      break;

    default:
      console.log("❓ Unknown control message type:", message.type);
      break;
  }

  sendResponse({ received: true });
});

// Auto-start functionality: Check if auto-start is enabled and start monitoring
chrome.storage.local.get({ autoStartEnabled: true }, (result) => {
  if (result.autoStartEnabled) {
    console.log("🚀 Auto-start enabled, requesting monitoring start");
    
    // Send start monitoring message to background script
    chrome.runtime.sendMessage({
      type: "start-monitoring",
    }).then((response) => {
      console.log("✅ Auto-start monitoring requested:", response);
    }).catch((error) => {
      console.warn("⚠️ Auto-start monitoring request failed:", error);
    });
  }
});

// Listen for page navigation events to maintain auto-start functionality
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM Content loaded, checking auto-start settings");
  
  chrome.storage.local.get({ autoStartEnabled: true }, (result) => {
    if (result.autoStartEnabled) {
      console.log("🚀 Auto-start enabled on DOM ready, requesting monitoring start");
      
      // Send start monitoring message to background script
      chrome.runtime.sendMessage({
        type: "start-monitoring",
      }).then((response) => {
        console.log("✅ Auto-start monitoring requested on DOM ready:", response);
      }).catch((error) => {
        console.warn("⚠️ Auto-start monitoring request failed on DOM ready:", error);
      });
    }
  });
});

console.log("✅ Content script initialization complete");
