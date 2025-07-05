// Injected script - 注入到页面上下文中监听 WebSocket
(function () {
  "use strict";

  // 立即标记脚本已加载
  console.log("🔧 WebSocket Proxy injected script STARTING...");
  console.log("🔍 Current WebSocket:", window.WebSocket);
  console.log("🌍 Script context:", window.location.href);

  // 避免重复注入
  if (window.websocketProxyInjected) {
    console.log("⚠️ WebSocket Proxy already injected, skipping");
    return;
  }

  // 立即设置标记
  window.websocketProxyInjected = true;
  console.log("✅ WebSocket Proxy injection started");

  // 保存原始的 WebSocket 构造函数
  const OriginalWebSocket = window.WebSocket;
  console.log("💾 Original WebSocket saved:", OriginalWebSocket);

  let connectionIdCounter = 0;
  const connections = new Map();

  // 控制状态
  let proxyState = {
    isMonitoring: false,
    blockOutgoing: false,
    blockIncoming: false,
  };

  // 生成唯一连接 ID
  function generateConnectionId() {
    return `ws_${Date.now()}_${++connectionIdCounter}`;
  }

  // 发送事件到 content script
  function sendEvent(eventData) {
    try {
      console.log("📤 Sending event to content script:", eventData);
      window.postMessage(
        {
          source: "websocket-proxy-injected",
          payload: eventData,
        },
        "*"
      );
    } catch (error) {
      console.error("❌ Failed to send event:", error);
    }
  }

  // 处理模拟消息
  function handleSimulateMessage(connectionId, message, direction) {
    console.log(`🎭 Handling simulate message for ${connectionId}:`, {
      message,
      direction,
    });

    const connectionInfo = connections.get(connectionId);
    if (!connectionInfo) {
      console.error("❌ Connection not found:", connectionId);
      return;
    }

    const ws = connectionInfo.ws;
    if (!ws) {
      console.error("❌ WebSocket instance not found for:", connectionId);
      return;
    }

    try {
      if (direction === "outgoing") {
        // 模拟发送消息
        console.log("📤 Simulating outgoing message");

        // No longer send sendEvent to Panel, Panel handles display itself
        // Only responsible for actual simulation execution

        // Actually call ws.send() to send real message
        try {
          console.log("🚀 Actually sending simulated message via WebSocket");
          connectionInfo.originalSend(message);
          console.log("✅ Simulated outgoing message sent successfully");
        } catch {
        }
      } else if (direction === "incoming") {
        // 模拟接收消息
        console.log("📥 Simulating incoming message");

        // No longer send sendEvent to Panel, Panel handles display itself
        // Only responsible for actual simulation execution

        // Create simulated MessageEvent
        const simulatedEvent = new MessageEvent("message", {
          data: message,
          origin: connectionInfo.url,
          lastEventId: "",
          source: window,
          ports: [],
          bubbles: false,
          cancelable: false,
        });
        
        // 添加模拟标记，便于调试
        simulatedEvent._isSimulated = true;

        // 触发模拟消息事件
        try {
          // 只通过 dispatchEvent 触发即可，现在onmessage也通过addEventListener包装了
          console.log("🎯 Dispatching simulated message event");
          ws.dispatchEvent(simulatedEvent);
          console.log("✅ Simulated message dispatched successfully");
        } catch (error) {
          console.error("❌ Error in simulated message processing:", error);
        }

        console.log("✅ Simulated incoming message processed");
      }
    } catch (error) {
      console.error("❌ Failed to simulate message:", error);
    }
  }

  // 创建代理的 WebSocket 构造函数
  function ProxiedWebSocket(url, protocols) {
    console.log("🚀 ProxiedWebSocket called with:", url, protocols);

    const connectionId = generateConnectionId();
    let ws;

    try {
      ws = new OriginalWebSocket(url, protocols);
      console.log("✅ WebSocket created with ID:", connectionId);
    } catch (error) {
      console.error("❌ Failed to create WebSocket:", error);
      throw error;
    }

    // 存储连接信息
    const connectionInfo = {
      id: connectionId,
      url: url,
      ws: ws,
      status: "connecting",
      originalSend: ws.send.bind(ws),
      originalClose: ws.close.bind(ws),
      originalOnMessage: null, // 将在onmessage setter中更新
      originalAddEventListener: ws.addEventListener.bind(ws),
      originalOnOpen: ws.onopen,
      originalOnClose: ws.onclose,
      messageQueue: [], // 暂停期间的消息队列
      blockedMessages: [], // 被阻止的消息
    };

    connections.set(connectionId, connectionInfo);
    console.log("📊 Total connections:", connections.size);

    // 发送连接事件
    sendEvent({
      id: connectionId,
      url: url,
      type: "connection",
      data: "WebSocket connection established",
      direction: "system",
      timestamp: Date.now(),
      status: "connecting",
    });

    // 拦截 send 方法 - 添加控制逻辑
    const originalSend = ws.send.bind(ws);
    ws.send = function (data) {
      console.log("📡 WebSocket send intercepted:", connectionId, data);

      // 记录发送事件
      const eventData = {
        id: connectionId,
        url: url,
        type: "message",
        data: data,
        direction: "outgoing",
        timestamp: Date.now(),
        status: connectionInfo.status,
      };

      // 检查是否应该阻止发送
      if (proxyState.blockOutgoing) {
        console.log("🚫 Message sending BLOCKED by proxy:", connectionId);

        // 添加阻止标记
        eventData.blocked = true;
        eventData.reason = "Outgoing messages blocked";

        // 存储被阻止的消息
        connectionInfo.blockedMessages.push({
          data: data,
          timestamp: Date.now(),
          direction: "outgoing",
        });

        // 通知扩展消息被阻止
        sendEvent(eventData);

        // 不调用原始send方法，直接返回
        return;
      }

      // 正常发送消息
      sendEvent(eventData);

      try {
        return originalSend(data);
      } catch (error) {
        console.error("❌ Send failed:", error);
        throw error;
      }
    };

    // 拦截 addEventListener - 添加控制逻辑
    const originalAddEventListener = ws.addEventListener.bind(ws);
    ws.addEventListener = function (type, listener, options) {
      if (type === "message" && listener) {
        const wrappedListener = function (event) {
          // 模拟消息不受block影响
          if (!event._isSimulated && proxyState.blockIncoming) {
            console.log("🚫 Message receiving BLOCKED by proxy:", connectionId);

            // 存储被阻止的消息
            connectionInfo.blockedMessages.push({
              data: event.data,
              timestamp: Date.now(),
              direction: "incoming",
            });

            // 通知扩展消息被阻止
            sendEvent({
              id: connectionId,
              url: url,
              type: "message",
              data: event.data,
              direction: "incoming",
              timestamp: Date.now(),
              status: connectionInfo.status,
              blocked: true,
              reason: "Incoming messages blocked",
            });

            // 不调用原始监听器，阻止应用程序接收消息
            return;
          }

          // For simulated messages, don't call sendEvent again, as Panel handles display directly
          if (!event._isSimulated) {
            // Handle real messages normally
            sendEvent({
              id: connectionId,
              url: url,
              type: "message",
              data: event.data,
              direction: "incoming",
              timestamp: Date.now(),
              status: connectionInfo.status,
            });
          }

          try {
            const result = listener.call(this, event);
            return result;
          } catch (error) {
            console.error("❌ Message listener failed:", error);
          }
        };

        return originalAddEventListener(type, wrappedListener, options);
      } else {
        return originalAddEventListener(type, listener, options);
      }
    };

    // 拦截 onmessage 属性 - 添加控制逻辑
    let originalOnMessage = null;
    let currentOnMessageHandler = null;
    
    Object.defineProperty(ws, "onmessage", {
      get: function () {
        return originalOnMessage;
      },
      set: function (handler) {
        console.log("🎯 Setting onmessage handler for:", connectionId);
        originalOnMessage = handler;
        
        // 存储到connectionInfo中，供模拟消息使用
        connectionInfo.originalOnMessage = handler;
        
        // 移除之前的处理器（如果有）
        if (currentOnMessageHandler) {
          try {
            ws.removeEventListener("message", currentOnMessageHandler);
          } catch (e) {
            console.warn("⚠️ Failed to remove previous onmessage handler:", e);
          }
        }
        
        if (handler) {
          // 创建包装的处理器来拦截真实消息
          const wrappedOnMessageHandler = function (event) {
            console.log(
              "📨 WebSocket message via onmessage:",
              connectionId,
              event.data,
              event._isSimulated ? "(SIMULATED)" : "(REAL)"
            );

            // 检查是否应该阻止接收真实消息
            console.log("🔍 Checking proxy state (onmessage):", {
              blockIncoming: proxyState.blockIncoming,
              willBlock: !event._isSimulated && proxyState.blockIncoming,
              connectionId: connectionId,
              isSimulated: event._isSimulated
            });
            
            // 模拟消息不受block影响
            if (!event._isSimulated && proxyState.blockIncoming) {
              console.log("🚫 onmessage BLOCKED by proxy:", connectionId);

              // 存储被阻止的消息
              connectionInfo.blockedMessages.push({
                data: event.data,
                timestamp: Date.now(),
                direction: "incoming",
              });

              // 通知扩展消息被阻止
              sendEvent({
                id: connectionId,
                url: url,
                type: "message",
                data: event.data,
                direction: "incoming",
                timestamp: Date.now(),
                status: connectionInfo.status,
                blocked: true,
                reason: "Incoming messages blocked",
              });

              // 不调用原始处理器
              return;
            }

            // For simulated messages, don't call sendEvent again, as Panel handles display directly
            if (!event._isSimulated) {
              // Handle real messages normally
              sendEvent({
                id: connectionId,
                url: url,
                type: "message",
                data: event.data,
                direction: "incoming",
                timestamp: Date.now(),
                status: connectionInfo.status,
              });
            }

            try {
              const result = handler.call(this, event);
            
              return result;
            } catch (error) {
              console.error("❌ onmessage handler failed:", error);
            }
          };
          
          currentOnMessageHandler = wrappedOnMessageHandler;
            
          originalAddEventListener("message", wrappedOnMessageHandler);
        } else {
          currentOnMessageHandler = null;
        }
      },
    });

    // 监听连接状态变化
    ["open", "close", "error"].forEach((eventType) => {
      originalAddEventListener(eventType, (event) => {
        console.log(`🔔 WebSocket ${eventType}:`, connectionId);

        // 更新连接状态
        if (eventType === "open") {
          connectionInfo.status = "open";
        } else if (eventType === "close") {
          connectionInfo.status = "closed";
        } else if (eventType === "error") {
          connectionInfo.status = "error";
        }

        sendEvent({
          id: connectionId,
          url: url,
          type: eventType,
          data: event.reason || event.message || `WebSocket ${eventType}`,
          direction: "system",
          timestamp: Date.now(),
          status: connectionInfo.status,
        });

        if (eventType === "close") {
          connections.delete(connectionId);
          console.log(
            "🗑️ Connection removed:",
            connectionId,
            "Remaining:",
            connections.size
          );
        }
      });
    });

    // 添加代理控制方法
    ws._proxyControl = {
      getBlockedMessages: () => connectionInfo.blockedMessages,
      clearBlockedMessages: () => {
        connectionInfo.blockedMessages = [];
      },
      getConnectionInfo: () => connectionInfo,
    };

    // 添加代理标记
    ws._isProxied = true;
    ws._connectionId = connectionId;

    return ws;
  }

  // 复制原始 WebSocket 的属性和方法
  try {
    Object.setPrototypeOf(ProxiedWebSocket, OriginalWebSocket);
    ProxiedWebSocket.prototype = OriginalWebSocket.prototype;

    // 复制静态常量
    ProxiedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    ProxiedWebSocket.OPEN = OriginalWebSocket.OPEN;
    ProxiedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
    ProxiedWebSocket.CLOSED = OriginalWebSocket.CLOSED;

    console.log("✅ WebSocket properties copied successfully");
  } catch (error) {
    console.error("❌ Failed to copy WebSocket properties:", error);
  }

  // 替换全局 WebSocket!
  try {
    Object.defineProperty(window, "WebSocket", {
      value: ProxiedWebSocket,
      writable: true,
      configurable: true,
    });

    console.log("✅ WebSocket replaced successfully");
    console.log("🔍 New WebSocket:", window.WebSocket);
    console.log("🧪 Replacement test:", window.WebSocket === ProxiedWebSocket);
  } catch (error) {
    console.error("❌ Failed to replace WebSocket:", error);
    // 备用方案
    try {
      window.WebSocket = ProxiedWebSocket;
      console.log("🔄 Fallback replacement successful");
    } catch (fallbackError) {
      console.error("❌ Fallback replacement failed:", fallbackError);
    }
  }

  // 监听来自content script的控制消息
  window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "websocket-proxy-content") {
      console.log("📥 Received control message:", event.data);

      switch (event.data.type) {
        case "start-monitoring":
          console.log("🚀 Starting WebSocket monitoring...");
          try {
            // 重新设置WebSocket代理
            Object.defineProperty(window, "WebSocket", {
              value: ProxiedWebSocket,
              writable: true,
              configurable: true,
            });
            console.log("✅ WebSocket monitoring restarted");
            console.log("🔍 Current WebSocket:", window.WebSocket);
            console.log("🧪 Proxy verification:", window.WebSocket === ProxiedWebSocket);
          } catch (error) {
            console.error("❌ Failed to restart monitoring:", error);
            // 备用方案
            try {
              window.WebSocket = ProxiedWebSocket;
              console.log("🔄 Fallback restart successful");
            } catch (fallbackError) {
              console.error("❌ Fallback restart failed:", fallbackError);
            }
          }
          break;

        case "stop-monitoring":
          console.log("⏹️ Stopping WebSocket monitoring...");
          try {
            window.WebSocket = OriginalWebSocket;
            connections.clear();
            console.log("✅ WebSocket monitoring stopped");
          } catch (error) {
            console.error("❌ Failed to stop monitoring:", error);
          }
          break;

        case "block-outgoing":
          console.log("🚫 Blocking outgoing messages...");
          proxyState.blockOutgoing = event.data.enabled;
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
          });
          break;

        case "block-incoming":
          console.log("🚫 Blocking incoming messages...");
          proxyState.blockIncoming = event.data.enabled;
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
          });
          break;

        case "get-proxy-state":
          sendEvent({
            type: "proxy-state-response",
            state: proxyState,
            connectionCount: connections.size,
            timestamp: Date.now(),
          });
          break;

        case "simulate-message":
          console.log("🎭 Simulating message:", event.data);
          handleSimulateMessage(
            event.data.connectionId,
            event.data.message,
            event.data.direction
          );
          break;
      }
    }
  });

  // 暴露调试信息到全局
  window.websocketProxyDebug = {
    connections: connections,
    originalWebSocket: OriginalWebSocket,
    proxiedWebSocket: ProxiedWebSocket,
    proxyState: proxyState,
    getConnectionCount: () => connections.size,
    getConnectionIds: () => Array.from(connections.keys()),
    blockOutgoing: (enabled) => {
      proxyState.blockOutgoing = enabled;
    },
    blockIncoming: (enabled) => {
      proxyState.blockIncoming = enabled;
    },
  };

  console.log("🏁 WebSocket Proxy injection complete");
  console.log("🔍 Final WebSocket:", window.WebSocket);
  console.log(
    "🧪 Injection verification:",
    window.WebSocket.toString().includes("ProxiedWebSocket")
  );
  console.log("🎛️ Proxy state:", proxyState);
})();
