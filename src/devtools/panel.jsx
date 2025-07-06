import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ControlPanel from "../components/ControlPanel.jsx";
import WebSocketList from "../components/WebSocketList.jsx";
import MessageDetails from "../components/MessageDetails.jsx";
import FloatingSimulate from "../components/FloatingSimulate.jsx";
import "../styles/main.css";

const WebSocketPanel = () => {
  const [isMonitoring, setIsMonitoring] = useState(false); // Default to false - monitoring disabled
  const [websocketEvents, setWebsocketEvents] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [currentTabId, setCurrentTabId] = useState(null);
  
  // Separate connection management and message management
  const [connectionsMap, setConnectionsMap] = useState(new Map()); // All connection info (including active and inactive)
  
  // Message deduplication mechanism
  const processedMessageIds = useRef(new Set());
  
  // Get current tab ID
  useEffect(() => {
    const getCurrentTab = async () => {
      try {
        const tab = await chrome.devtools.inspectedWindow.eval('window.location.href');
        // Get current tab ID from devtools
        const tabId = chrome.devtools.inspectedWindow.tabId;
        setCurrentTabId(tabId);
        console.log("✅ Current tab ID:", tabId);
      } catch (error) {
        console.error("❌ Failed to get current tab:", error);
      }
    };

    getCurrentTab();
  }, []);

  // Check if auto-start is enabled and sync monitoring state
  useEffect(() => {
    const syncMonitoringState = async () => {
      try {
        const result = await chrome.storage.local.get({
          autoStartEnabled: true,
        });
        
        // If auto-start is enabled, the content script should already be monitoring
        // We need to sync our state with the actual monitoring state
        if (result.autoStartEnabled) {
          console.log("� Auto-start enabled, syncing monitoring state");
          setIsMonitoring(true);
          
          // Also ensure background script knows we're monitoring
          chrome.runtime.sendMessage({
            type: "start-monitoring",
          }).catch((error) => {
            console.warn("⚠️ Failed to sync monitoring state with background:", error);
          });
        }
      } catch (error) {
        console.error("❌ Failed to sync monitoring state:", error);
      }
    };

    syncMonitoringState();
  }, []);
  
  useEffect(() => {
    // Listen for messages from background script
    const messageListener = (message, sender, sendResponse) => {
      console.log("🎯 Panel received message:", message, "MessageID:", message.messageId, Date.now());

      if (message.type === "websocket-event") {
        const eventData = message.data;
        const messageId = message.messageId;
        
        // Message deduplication based on messageId
        if (messageId && processedMessageIds.current.has(messageId)) {
          console.log("🚫 Duplicate message detected by ID, skipping:", messageId);
          sendResponse({ received: true, duplicate: true, messageId });
          return;
        }
        
        // Add to processed set
        if (messageId) {
          processedMessageIds.current.add(messageId);
          console.log("✅ Message ID added to processed set:", messageId);
        }
        
        console.log("📊 Processing WebSocket event:", eventData);

        // Update connection info with tabId
        setConnectionsMap((prevConnections) => {
          const newConnections = new Map(prevConnections);
          
          // Add tabId to eventData if not present
          const tabId = eventData.tabId || sender?.tab?.id || currentTabId;
          
          if (eventData.type === "connection" || eventData.type === "open") {
            // Create or update connection to active status
            newConnections.set(eventData.id, {
              id: eventData.id,
              url: eventData.url,
              status: eventData.type === "connection" ? "connecting" : "open",
              timestamp: eventData.timestamp,
              lastActivity: eventData.timestamp,
              tabId: tabId, // Add tabId to connection info
            });
            console.log("📊 Created/Updated connection:", eventData.id, "Status:", eventData.type, "TabId:", tabId);
          } else if (eventData.type === "close" || eventData.type === "error") {
            // Update connection to inactive status, create if connection doesn't exist
            const existing = newConnections.get(eventData.id);
            newConnections.set(eventData.id, {
              id: eventData.id,
              url: existing?.url || eventData.url || "Unknown URL",
              status: eventData.type, // "close" or "error"
              timestamp: existing?.timestamp || eventData.timestamp,
              lastActivity: eventData.timestamp,
              tabId: existing?.tabId || tabId, // Preserve existing tabId or use current
            });
            console.log("📊 Updated connection to inactive:", eventData.id, "Status:", eventData.type, "TabId:", tabId);
          } else if (eventData.type === "message") {
            // Update last activity time (for message events)
            const existing = newConnections.get(eventData.id);
            if (existing) {
              newConnections.set(eventData.id, {
                ...existing,
                lastActivity: eventData.timestamp,
              });
            }
          }
          
          return newConnections;
        });

        // Add tabId to websocketEvents as well
        const eventDataWithTabId = {
          ...eventData,
          tabId: eventData.tabId || sender?.tab?.id || currentTabId,
        };

        setWebsocketEvents((prevEvents) => {
          const newEvents = [...prevEvents, eventDataWithTabId];
          console.log("📈 Total WebSocket events:", newEvents.length);
          return newEvents;
        });
      }

      sendResponse({ received: true, messageId: message.messageId });
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [currentTabId]);

  const handleStartMonitoring = () => {
    console.log("🚀 Starting WebSocket monitoring...");
    setIsMonitoring(true);

    // Send start monitoring message to background script
    chrome.runtime
      .sendMessage({
        type: "start-monitoring",
      })
      .then((response) => {
        console.log("✅ Start monitoring response:", response);
      })
      .catch((error) => {
        console.error("❌ Failed to start monitoring:", error);
      });
  };

  const handleStopMonitoring = () => {
    console.log("⏹️ Stopping WebSocket monitoring...");
    setIsMonitoring(false);

    // Send stop monitoring message to background script
    chrome.runtime
      .sendMessage({
        type: "stop-monitoring",
      })
      .then((response) => {
        console.log("✅ Stop monitoring response:", response);
      })
      .catch((error) => {
        console.error("❌ Failed to stop monitoring:", error);
      });
  };

  const handleClearConnections = () => {
    console.log("🗑️ Clearing all WebSocket connections and events...");
    setWebsocketEvents([]);
    setConnectionsMap(new Map());
    setSelectedConnectionId(null);
  };

  const handleClearMessages = (connectionId) => {
    console.log("🗑️ Clearing all messages and events for connection:", connectionId);
    setWebsocketEvents((prevEvents) => {
      // Remove all events for target connection (both messages and system events)
      return prevEvents.filter((event) => event.id !== connectionId);
    });
    // Keep connection basic info in connections Map, so connection will still show in list
  };

  const handleSelectConnection = (connectionId) => {
    console.log("👆 Selected connection:", connectionId);
    setSelectedConnectionId(connectionId);
  };

  const handleSimulateMessage = async ({
    connectionId,
    message,
    direction,
  }) => {
    console.log("🎭 Simulating message:", { connectionId, message, direction });

    try {
      // 1. Send simulate message to background (for actual simulation execution)
      const response = await chrome.runtime.sendMessage({
        type: "simulate-message",
        data: {
          connectionId,
          message,
          direction,
        },
      });

      // 2. Handle simulated message display directly within Panel
      if (response && response.success) {
        const connectionInfo = connectionsMap.get(connectionId);
        const simulatedEvent = {
          id: connectionId,
          url: connectionInfo?.url || "Unknown",
          type: "message",
          data: message,
          direction: direction,
          timestamp: Date.now(),
          status: connectionInfo?.status || "open",
          tabId: connectionInfo?.tabId || currentTabId,
          simulated: true, // Mark as simulated message
        };

        // Directly add to event list
        setWebsocketEvents((prevEvents) => [simulatedEvent, ...prevEvents]);
        
        console.log("✅ Simulated message added to panel locally");
      }

      return response;
    } catch (error) {
      console.error("❌ Failed to simulate message:", error);
      throw error;
    }
  };

  // Filter connections and events by current tab
  const getFilteredConnectionsMap = () => {
    if (!currentTabId) return connectionsMap;
    
    const filteredMap = new Map();
    for (const [id, connection] of connectionsMap) {
      if (connection.tabId === currentTabId) {
        filteredMap.set(id, connection);
      }
    }
    return filteredMap;
  };

  const getFilteredWebSocketEvents = () => {
    if (!currentTabId) return websocketEvents;
    
    return websocketEvents.filter(event => event.tabId === currentTabId);
  };

  // Get selected connection's all messages and events
  const getSelectedConnectionData = () => {
    if (!selectedConnectionId) return null;

    // Get connection basic info from connectionsMap
    const connectionInfo = connectionsMap.get(selectedConnectionId);
    if (!connectionInfo) return null;

    // Get all events/messages for this connection (filtered by current tab)
    const connectionMessages = getFilteredWebSocketEvents().filter(
      (event) => event.id === selectedConnectionId
    );

    return {
      id: selectedConnectionId,
      url: connectionInfo.url,
      messages: connectionMessages,
    };
  };

  const selectedConnection = getSelectedConnectionData();
  const filteredConnectionsMap = getFilteredConnectionsMap();
  const filteredWebSocketEvents = getFilteredWebSocketEvents();

  return (
    <div className="websocket-panel">
      <div className="panel-header">
        <h1>🔌 WebSocket Monitor</h1>
        <div className="panel-status">
          {isMonitoring ? (
            <span className="status active">🟢 Monitoring Active</span>
          ) : (
            <span className="status inactive">🔴 Monitoring Stopped</span>
          )}
          {currentTabId && (
            <span className="tab-info">📱 Tab: {currentTabId}</span>
          )}
        </div>
      </div>

      <PanelGroup direction="horizontal" className="panel-content">
        {/* Left vertical layout: ControlPanel + WebSocketList */}
        <Panel
          defaultSize={30}
          minSize={20}
          maxSize={50}
          className="panel-left-section"
        >
          <PanelGroup direction="vertical">
            <Panel
              defaultSize={30}
              minSize={12}
              maxSize={40}
              className="control-panel-container"
            >
              <div className="panel-wrapper">
                <div className="panel-title">
                  <h3>🎛️ Control Panel</h3>
                </div>
                <div className="panel-body">
                  <ControlPanel
                    isMonitoring={isMonitoring}
                    onStartMonitoring={handleStartMonitoring}
                    onStopMonitoring={handleStopMonitoring}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="panel-resize-handle horizontal" />

            <Panel className="websocket-list-container">
              <div className="panel-wrapper">
                <div className="panel-title">
                  <h3>🔗 Websocket Connections</h3>
                  {filteredConnectionsMap.size > 0 && (
                    <button
                      className="panel-title-btn"
                      onClick={handleClearConnections}
                      title="Clear all WebSocket connections and events"
                    >
                      🗑️ Clear All
                    </button>
                  )}
                </div>
                <div className="panel-body">
                  <WebSocketList
                    websocketEvents={filteredWebSocketEvents}
                    connectionsMap={filteredConnectionsMap}
                    selectedConnectionId={selectedConnectionId}
                    onSelectConnection={handleSelectConnection}
                    onClearConnections={handleClearConnections}
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="panel-resize-handle vertical" />

        {/* Right side: MessageDetails */}
        <Panel className="panel-right-section">
          <div className="panel-wrapper">
            <div className="panel-title">
              <h3>💬 Message Details</h3>
            </div>
            <div className="panel-body">
              <MessageDetails
                connection={selectedConnection}
                onSimulateMessage={handleSimulateMessage}
                onClearMessages={handleClearMessages}
              />
            </div>
          </div>
        </Panel>
      </PanelGroup>

      {/* Floating simulate message window */}
      <FloatingSimulate
        connection={selectedConnection}
        onSimulateMessage={handleSimulateMessage}
      />
    </div>
  );
};

// Render to DOM
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<WebSocketPanel />);
