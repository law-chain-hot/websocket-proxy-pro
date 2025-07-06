// Injected script - Inject into page context to monitor WebSocket
(function () {
  "use strict";

  // Immediately mark script as loaded
  console.log("🔧 WebSocket Proxy injected script STARTING...");
  console.log("🔍 Current WebSocket:", window.WebSocket);
  console.log("🌍 Script context:", window.location.href);

  // Avoid duplicate injection
  if (window.websocketProxyInjected) {
    console.log("⚠️ WebSocket Proxy already injected, skipping");
    return;
  }

  // Immediately set marker
  window.websocketProxyInjected = true;
  console.log("✅ WebSocket Proxy injection started");

  // Save original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  console.log("💾 Original WebSocket saved:", OriginalWebSocket);

  let connectionIdCounter = 0;
  const connections = new Map();

  // Control state
  let proxyState = {
    isMonitoring: false, // Only send events when monitoring is enabled
    blockOutgoing: false,
    blockIncoming: false,
  };

  // Generate unique connection ID
  function generateConnectionId() {
    return `ws_${Date.now()}_${++connectionIdCounter}`;
  }

  // Send event to content script - Only if monitoring is enabled
  function sendEvent(eventData) {
    // Only send events when monitoring is enabled
    if (!proxyState.isMonitoring) {
      console.log("� Monitoring disabled, skipping event:", eventData.type);
      return;
    }

    try {
      console.log("�📤 Sending event to content script:", eventData);
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

  // Handle simulate message
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
        // Simulate outgoing message
        console.log("📤 Simulating outgoing message");

        // Actually call ws.send() to send real message
        try {
          console.log("🚀 Actually sending simulated message via WebSocket");
          connectionInfo.originalSend(message);
          console.log("✅ Simulated outgoing message sent successfully");
        } catch {
        }
      } else if (direction === "incoming") {
        // Simulate incoming message
        console.log("📥 Simulating incoming message");

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
        
        // Add simulation marker for debugging
        simulatedEvent._isSimulated = true;

        // Trigger simulated message event
        try {
          // Just trigger through dispatchEvent, onmessage is now wrapped via addEventListener
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

  // Create proxied WebSocket constructor
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

    // Store connection info
    const connectionInfo = {
      id: connectionId,
      url: url,
      ws: ws,
      status: "connecting",
      originalSend: ws.send.bind(ws),
      originalClose: ws.close.bind(ws),
      originalOnMessage: null, // Will be updated in onmessage setter
      originalAddEventListener: ws.addEventListener.bind(ws),
      originalOnOpen: ws.onopen,
      originalOnClose: ws.onclose,
      messageQueue: [], // Message queue during pause
      blockedMessages: [], // Blocked messages
    };

    connections.set(connectionId, connectionInfo);
    console.log("📊 Total connections:", connections.size);

    // Send connection event (only if monitoring is enabled)
    sendEvent({
      id: connectionId,
      url: url,
      type: "connection",
      data: "WebSocket connection established",
      direction: "system",
      timestamp: Date.now(),
      status: "connecting",
    });

    // Intercept send method - Add control logic
    const originalSend = ws.send.bind(ws);
    ws.send = function (data) {
      console.log("📡 WebSocket send intercepted:", connectionId, data);

      // Record send event
      const eventData = {
        id: connectionId,
        url: url,
        type: "message",
        data: data,
        direction: "outgoing",
        timestamp: Date.now(),
        status: connectionInfo.status,
      };

      // Check if should block sending
      if (proxyState.blockOutgoing) {
        console.log("🚫 Message sending BLOCKED by proxy:", connectionId);

        // Add block marker
        eventData.blocked = true;
        eventData.reason = "Outgoing messages blocked";

        // Store blocked message
        connectionInfo.blockedMessages.push({
          data: data,
          timestamp: Date.now(),
          direction: "outgoing",
        });

        // Notify extension about blocked message (only if monitoring)
        sendEvent(eventData);

        // Don't call original send method, return directly
        return;
      }

      // Normal send message (only if monitoring)
      sendEvent(eventData);

      try {
        return originalSend(data);
      } catch (error) {
        console.error("❌ Send failed:", error);
        throw error;
      }
    };

    // Intercept addEventListener - Add control logic
    const originalAddEventListener = ws.addEventListener.bind(ws);
    ws.addEventListener = function (type, listener, options) {
      if (type === "message" && listener) {
        const wrappedListener = function (event) {
          // Simulated messages not affected by block
          if (!event._isSimulated && proxyState.blockIncoming) {
            console.log("🚫 Message receiving BLOCKED by proxy:", connectionId);

            // Store blocked message
            connectionInfo.blockedMessages.push({
              data: event.data,
              timestamp: Date.now(),
              direction: "incoming",
            });

            // Notify extension about blocked message (only if monitoring)
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

            // Don't call original listener, prevent app from receiving message
            return;
          }

          // For simulated messages, don't call sendEvent again, as Panel handles display directly
          if (!event._isSimulated) {
            // Handle real messages normally (only if monitoring)
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

    // Intercept onmessage property - Add control logic
    let originalOnMessage = null;
    let currentOnMessageHandler = null;
    
    Object.defineProperty(ws, "onmessage", {
      get: function () {
        return originalOnMessage;
      },
      set: function (handler) {
        console.log("🎯 Setting onmessage handler for:", connectionId);
        originalOnMessage = handler;
        
        // Store in connectionInfo for simulated message use
        connectionInfo.originalOnMessage = handler;
        
        // Remove previous handler (if any)
        if (currentOnMessageHandler) {
          try {
            ws.removeEventListener("message", currentOnMessageHandler);
          } catch (e) {
            console.warn("⚠️ Failed to remove previous onmessage handler:", e);
          }
        }
        
        if (handler) {
          // Create wrapped handler to intercept real messages
          const wrappedOnMessageHandler = function (event) {
            console.log(
              "📨 WebSocket message via onmessage:",
              connectionId,
              event.data,
              event._isSimulated ? "(SIMULATED)" : "(REAL)"
            );

            // Check if should block receiving real messages
            console.log("🔍 Checking proxy state (onmessage):", {
              blockIncoming: proxyState.blockIncoming,
              willBlock: !event._isSimulated && proxyState.blockIncoming,
              connectionId: connectionId,
              isSimulated: event._isSimulated
            });
            
            // Simulated messages not affected by block
            if (!event._isSimulated && proxyState.blockIncoming) {
              console.log("🚫 onmessage BLOCKED by proxy:", connectionId);

              // Store blocked message
              connectionInfo.blockedMessages.push({
                data: event.data,
                timestamp: Date.now(),
                direction: "incoming",
              });

              // Notify extension about blocked message (only if monitoring)
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

              // Don't call original handler
              return;
            }

            // For simulated messages, don't call sendEvent again, as Panel handles display directly
            if (!event._isSimulated) {
              // Handle real messages normally (only if monitoring)
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

    // Listen for connection state changes
    ["open", "close", "error"].forEach((eventType) => {
      originalAddEventListener(eventType, (event) => {
        console.log(`🔔 WebSocket ${eventType}:`, connectionId);

        // Update connection status
        if (eventType === "open") {
          connectionInfo.status = "open";
        } else if (eventType === "close") {
          connectionInfo.status = "closed";
        } else if (eventType === "error") {
          connectionInfo.status = "error";
        }

        // Send event (only if monitoring)
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

    // Add proxy control methods
    ws._proxyControl = {
      getBlockedMessages: () => connectionInfo.blockedMessages,
      clearBlockedMessages: () => {
        connectionInfo.blockedMessages = [];
      },
      getConnectionInfo: () => connectionInfo,
    };

    // Add proxy marker
    ws._isProxied = true;
    ws._connectionId = connectionId;

    return ws;
  }

  // Copy original WebSocket properties and methods
  try {
    Object.setPrototypeOf(ProxiedWebSocket, OriginalWebSocket);
    ProxiedWebSocket.prototype = OriginalWebSocket.prototype;

    // Copy static constants
    ProxiedWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    ProxiedWebSocket.OPEN = OriginalWebSocket.OPEN;
    ProxiedWebSocket.CLOSING = OriginalWebSocket.CLOSING;
    ProxiedWebSocket.CLOSED = OriginalWebSocket.CLOSED;

    console.log("✅ WebSocket properties copied successfully");
  } catch (error) {
    console.error("❌ Failed to copy WebSocket properties:", error);
  }

  // Replace global WebSocket!
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
    // Fallback
    try {
      window.WebSocket = ProxiedWebSocket;
      console.log("🔄 Fallback replacement successful");
    } catch (fallbackError) {
      console.error("❌ Fallback replacement failed:", fallbackError);
    }
  }

  // Listen for control messages from content script
  window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "websocket-proxy-content") {
      console.log("📥 Received control message:", event.data);

      switch (event.data.type) {
        case "start-monitoring":
          console.log("🚀 Starting WebSocket monitoring...");
          proxyState.isMonitoring = true;
          console.log("✅ WebSocket monitoring enabled");
          
          // Send state change event
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
          });
          break;

        case "stop-monitoring":
          console.log("⏹️ Stopping WebSocket monitoring...");
          proxyState.isMonitoring = false;
          console.log("✅ WebSocket monitoring disabled");
          
          // Send state change event (this will be the last event sent)
          window.postMessage(
            {
              source: "websocket-proxy-injected",
              payload: {
                type: "proxy-state-change",
                state: proxyState,
                timestamp: Date.now(),
              },
            },
            "*"
          );
          break;

        case "block-outgoing":
          console.log("🚫 Blocking outgoing messages:", event.data.enabled);
          proxyState.blockOutgoing = event.data.enabled;
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
          });
          break;

        case "block-incoming":
          console.log("🚫 Blocking incoming messages:", event.data.enabled);
          proxyState.blockIncoming = event.data.enabled;
          sendEvent({
            type: "proxy-state-change",
            state: proxyState,
            timestamp: Date.now(),
          });
          break;

        case "get-proxy-state":
          // Always respond to state requests regardless of monitoring status
          window.postMessage(
            {
              source: "websocket-proxy-injected",
              payload: {
                type: "proxy-state-response",
                state: proxyState,
                connectionCount: connections.size,
                timestamp: Date.now(),
              },
            },
            "*"
          );
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

  // Expose debug info to global
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
