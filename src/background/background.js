// Background script - Service Worker for Chrome Extension V3
console.log("🚀 WebSocket Proxy background script loaded");

// Store WebSocket connection data
let websocketData = {
  connections: [],
  isMonitoring: false,
  autoStartEnabled: true, // Auto-start setting
};

// Load settings from storage on startup
chrome.storage.local.get({
  autoStartEnabled: true,
}).then((result) => {
  websocketData.autoStartEnabled = result.autoStartEnabled;
  console.log("✅ Auto-start setting loaded:", result.autoStartEnabled);
});

// Listen for messages from DevTools Panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Background received message:", message, "from:", sender);

  switch (message.type) {
    case "start-monitoring":
      console.log("🚀 Starting WebSocket monitoring");
      websocketData.isMonitoring = true;
      
      // Notify all content scripts to start monitoring
      notifyAllTabs("start-monitoring");
      sendResponse({ success: true, monitoring: true });
      break;

    case "stop-monitoring":
      console.log("⏹️ Stopping WebSocket monitoring");
      websocketData.isMonitoring = false;

      // Notify all content scripts to stop monitoring
      notifyAllTabs("stop-monitoring");
      sendResponse({ success: true, monitoring: false });
      break;

    case "set-auto-start":
      console.log("🔄 Setting auto-start:", message.enabled);
      websocketData.autoStartEnabled = message.enabled;
      
      // Save to storage
      chrome.storage.local.set({ autoStartEnabled: message.enabled });
      sendResponse({ success: true, autoStartEnabled: message.enabled });
      break;

    case "get-tab-id":
      console.log("📍 Providing tab ID:", sender.tab?.id);
      sendResponse({ tabId: sender.tab?.id });
      break;

    case "block-outgoing":
      console.log("🚫 Toggling outgoing message blocking:", message.enabled);

      // Notify all content scripts to toggle outgoing message blocking
      notifyAllTabs("block-outgoing", { enabled: message.enabled });
      sendResponse({ success: true, blockOutgoing: message.enabled });
      break;

    case "block-incoming":
      console.log("🚫 Toggling incoming message blocking:", message.enabled);

      // Notify all content scripts to toggle incoming message blocking
      notifyAllTabs("block-incoming", { enabled: message.enabled });
      sendResponse({ success: true, blockIncoming: message.enabled });
      break;

    case "websocket-event":
      console.log("📊 WebSocket event received:", message.data, "MessageID:", message.messageId);

      // Add tabId to event data if not present
      const eventDataWithTabId = {
        ...message.data,
        tabId: message.data.tabId || sender?.tab?.id,
      };

      // Store connection data
      websocketData.connections.push(eventDataWithTabId);

      // Forward to DevTools Panel with tabId
      forwardToDevTools({
        ...message,
        data: eventDataWithTabId,
      });
      sendResponse({ received: true });
      break;

    case "proxy-state-change":
      console.log("🎛️ Proxy state change:", message.data);

      // Forward state change to DevTools Panel
      forwardToDevTools(message);
      sendResponse({ received: true });
      break;

    case "simulate-message":
      console.log("🎭 Simulating message:", message.data);

      // Notify specified tab's content script to simulate message
      notifyAllTabs("simulate-message", message.data);
      sendResponse({ success: true, simulated: true });
      break;

    default:
      console.log("❓ Unknown message type:", message.type);
      sendResponse({ error: "Unknown message type" });
      break;
  }

  return true; // Keep message channel open for async response
});

// Notify all active tabs' content scripts
async function notifyAllTabs(type, data = {}) {
  try {
    const tabs = await chrome.tabs.query({});
    console.log(`📢 Notifying ${tabs.length} tabs about: ${type}`);

    const promises = tabs.map((tab) => {
      if (tab.id) {
        return chrome.tabs
          .sendMessage(tab.id, {
            type: type,
            ...data,
          })
          .catch((error) => {
            // This is expected for tabs that don't have our content script
            console.log(`⚠️ Tab ${tab.id} not responding (expected):`, error.message);
          });
      }
    });

    await Promise.all(promises);
    console.log(`✅ Notification sent to all tabs: ${type}`);
  } catch (error) {
    console.error("❌ Failed to notify tabs:", error);
  }
}

// Forward message to DevTools Panel
function forwardToDevTools(message) {
  try {
    // DevTools Panel also listens through chrome.runtime.onMessage
    // We can directly broadcast the message, Panel will receive it
    chrome.runtime.sendMessage(message).catch((error) => {
      // This is normal, as Panel might not be open yet
      console.log("📤 Message queued for DevTools Panel:", message.type);
    });
  } catch (error) {
    console.error("❌ Failed to forward to DevTools Panel:", error);
  }
}

// Listen for tab updates, may need to reinject scripts
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    console.log("🔄 Tab updated:", tabId, "Auto-start enabled:", websocketData.autoStartEnabled);
    
    // If auto-start is enabled, automatically start monitoring for new/refreshed pages
    if (websocketData.autoStartEnabled) {
      console.log("🚀 Auto-starting monitoring for tab:", tabId);
      
      try {
        // Send start monitoring message to this specific tab
        await chrome.tabs.sendMessage(tabId, {
          type: "start-monitoring",
        });
        console.log("✅ Auto-start monitoring sent to tab:", tabId);
      } catch (error) {
        console.warn("⚠️ Failed to auto-start monitoring for tab:", tabId, error.message);
      }
    }
  }
});

// Listen for tab activation (user switches to different tab)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log("🔄 Tab activated:", activeInfo.tabId, "Auto-start enabled:", websocketData.autoStartEnabled);
  
  // If auto-start is enabled and global monitoring is active, start monitoring for this tab
  if (websocketData.autoStartEnabled && websocketData.isMonitoring) {
    console.log("🚀 Auto-starting monitoring for activated tab:", activeInfo.tabId);
    
    try {
      await chrome.tabs.sendMessage(activeInfo.tabId, {
        type: "start-monitoring",
      });
      console.log("✅ Auto-start monitoring sent to activated tab:", activeInfo.tabId);
    } catch (error) {
      console.warn("⚠️ Failed to auto-start monitoring for activated tab:", activeInfo.tabId, error.message);
    }
  }
});

// When extension starts
chrome.runtime.onStartup.addListener(() => {
  console.log("🌅 Extension started");
  websocketData = {
    connections: [],
    isMonitoring: false,
    autoStartEnabled: true,
  };
  
  // Load settings from storage
  chrome.storage.local.get({
    autoStartEnabled: true,
  }).then((result) => {
    websocketData.autoStartEnabled = result.autoStartEnabled;
    console.log("✅ Auto-start setting loaded on startup:", result.autoStartEnabled);
  });
});

// When extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("📦 Extension installed/updated");
  websocketData = {
    connections: [],
    isMonitoring: false,
    autoStartEnabled: true,
  };
  
  // Load settings from storage
  chrome.storage.local.get({
    autoStartEnabled: true,
  }).then((result) => {
    websocketData.autoStartEnabled = result.autoStartEnabled;
    console.log("✅ Auto-start setting loaded on install:", result.autoStartEnabled);
  });
});

console.log("✅ Background script initialization complete");
