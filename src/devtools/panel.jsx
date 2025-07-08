import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import ControlPanel from "../components/ControlPanel.jsx";
import WebSocketList from "../components/WebSocketList.jsx";
import MessageDetails from "../components/MessageDetails.jsx";
import FloatingSimulate from "../components/FloatingSimulate.jsx";
import "../styles/main.css";

const WebSocketPanel = () => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [websocketEvents, setWebsocketEvents] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [currentTabId, setCurrentTabId] = useState(null);

  // 分离连接管理和消息管理
  const [connectionsMap, setConnectionsMap] = useState(new Map()); // 所有连接的基础信息（包括active和inactive）

  // 消息去重机制
  const processedMessageIds = useRef(new Set());

  // FloatingSimulate组件的ref
  const floatingSimulateRef = useRef(null);

  useEffect(() => {
    // 获取当前DevTools所附加的tab ID
    const tabId = chrome.devtools.inspectedWindow.tabId;
    setCurrentTabId(tabId);
    console.log("🎯 DevTools Panel attached to tab:", tabId);

    // 请求现有数据
    const loadExistingData = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "get-existing-data",
        });

        if (response && response.success) {
          console.log(
            "📊 Loading existing data:",
            response.data?.length || 0,
            "events"
          );

          // 同步监控状态
          if (response.isMonitoring !== undefined) {
            setIsMonitoring(response.isMonitoring);
            console.log("🔄 Synced monitoring state:", response.isMonitoring);
          }

          // 加载现有事件数据
          if (response.data && response.data.length > 0) {
            // 过滤当前tab的事件
            const tabEvents = response.data.filter(
              (event) => event.tabId === tabId
            );
            console.log(
              "📊 Filtered events for current tab:",
              tabEvents.length
            );

            // 更新连接信息
            const newConnectionsMap = new Map();
            tabEvents.forEach((eventData) => {
              if (
                eventData.type === "connection" ||
                eventData.type === "open"
              ) {
                newConnectionsMap.set(eventData.id, {
                  id: eventData.id,
                  url: eventData.url,
                  status:
                    eventData.type === "connection" ? "connecting" : "open",
                  timestamp: eventData.timestamp,
                  lastActivity: eventData.timestamp,
                });
              } else if (
                eventData.type === "close" ||
                eventData.type === "error"
              ) {
                const existing = newConnectionsMap.get(eventData.id);
                newConnectionsMap.set(eventData.id, {
                  id: eventData.id,
                  url: existing?.url || eventData.url || "Unknown URL",
                  status: eventData.type,
                  timestamp: existing?.timestamp || eventData.timestamp,
                  lastActivity: eventData.timestamp,
                });
              } else if (eventData.type === "message") {
                const existing = newConnectionsMap.get(eventData.id);
                if (existing) {
                  newConnectionsMap.set(eventData.id, {
                    ...existing,
                    lastActivity: eventData.timestamp,
                  });
                }
              }
            });

            setConnectionsMap(newConnectionsMap);
            setWebsocketEvents(tabEvents);
            console.log(
              "✅ Loaded existing data:",
              tabEvents.length,
              "events,",
              newConnectionsMap.size,
              "connections"
            );
          }
        }
      } catch (error) {
        console.error("❌ Failed to load existing data:", error);
      }
    };

    // 加载现有数据
    loadExistingData();

    // 监听来自 background script 的消息
    const messageListener = (message, sender, sendResponse) => {
      if (message.type === "websocket-event") {
        const eventData = message.data;
        const messageId = message.messageId;

        // Filter: only process events from current tab
        if (eventData.tabId !== tabId) {
          sendResponse({
            received: true,
            ignored: true,
            messageId,
            reason: "different-tab",
          });
          return;
        }

        // 基于messageId的去重机制
        if (messageId && processedMessageIds.current.has(messageId)) {
          console.log(
            "🚫 Duplicate message detected by ID, skipping:",
            messageId
          );
          sendResponse({ received: true, duplicate: true, messageId });
          return;
        }

        // Add to processed set
        if (messageId) {
          processedMessageIds.current.add(messageId);
        }

        console.log("📊 Processing WebSocket event:", eventData);

        // 更新连接信息
        setConnectionsMap((prevConnections) => {
          const newConnections = new Map(prevConnections);

          if (eventData.type === "connection" || eventData.type === "open") {
            // 创建或更新连接为active状态
            newConnections.set(eventData.id, {
              id: eventData.id,
              url: eventData.url,
              status: eventData.type === "connection" ? "connecting" : "open",
              timestamp: eventData.timestamp,
              lastActivity: eventData.timestamp,
            });
            console.log(
              "📊 Created/Updated connection:",
              eventData.id,
              "Status:",
              eventData.type
            );
          } else if (eventData.type === "close" || eventData.type === "error") {
            // 更新连接为inactive状态，如果连接不存在则创建它
            const existing = newConnections.get(eventData.id);
            newConnections.set(eventData.id, {
              id: eventData.id,
              url: existing?.url || eventData.url || "Unknown URL",
              status: eventData.type, // "close" 或 "error"
              timestamp: existing?.timestamp || eventData.timestamp,
              lastActivity: eventData.timestamp,
            });
            console.log(
              "📊 Updated connection to inactive:",
              eventData.id,
              "Status:",
              eventData.type
            );
          } else if (eventData.type === "message") {
            // 更新最后活动时间（对于消息事件）
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

        setWebsocketEvents((prevEvents) => {
          const newEvents = [...prevEvents, eventData];
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
  }, []);

  const handleStartMonitoring = () => {
    console.log("🚀 Starting WebSocket monitoring...");
    setIsMonitoring(true);

    // 发送开始监控消息到 background script
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

    // 发送停止监控消息到 background script
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
    console.log(
      "🗑️ Clearing all messages and events for connection:",
      connectionId
    );
    setWebsocketEvents((prevEvents) => {
      // 移除目标连接的所有事件（消息和系统事件都清除）
      return prevEvents.filter((event) => event.id !== connectionId);
    });
    // 连接基础信息保留在connections Map中，所以连接仍会显示在列表中
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
          tabId: currentTabId, // 包含当前tab ID
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
          simulated: true, // Mark as simulated message
        };

        // 直接添加到事件列表中
        setWebsocketEvents((prevEvents) => [simulatedEvent, ...prevEvents]);

        console.log("✅ Simulated message added to panel locally");
      }

      return response;
    } catch (error) {
      console.error("❌ Failed to simulate message:", error);
      throw error;
    }
  };

  // 获取选中连接的所有消息和事件
  const getSelectedConnectionData = () => {
    if (!selectedConnectionId) return null;

    // 从connectionsMap获取连接基本信息
    const connectionInfo = connectionsMap.get(selectedConnectionId);
    if (!connectionInfo) return null;

    // 获取该连接的所有事件/消息
    const connectionMessages = websocketEvents.filter(
      (event) => event.id === selectedConnectionId
    );

    return {
      id: selectedConnectionId,
      url: connectionInfo.url,
      messages: connectionMessages,
    };
  };

  // 处理打开SimulateMessagePanel
  const handleOpenSimulatePanel = (options = {}) => {
    console.log(
      "🎯 Panel: handleOpenSimulatePanel called with options:",
      options
    );

    if (floatingSimulateRef.current) {
      console.log("🎯 Panel: FloatingSimulate ref found, calling openPanel");
      floatingSimulateRef.current.openPanel(options);
    } else {
      console.warn("🎯 Panel: FloatingSimulate ref not found");
    }
  };

  const selectedConnection = getSelectedConnectionData();

  return (
    <MantineProvider>
      <div className="websocket-panel">
        <div className="panel-header">
          <h1>🔌 WebSocket Monitor</h1>
          <div className="panel-status">
            {isMonitoring ? (
              <span className="status active">🟢 Monitoring Active</span>
            ) : (
              <span className="status inactive">🔴 Monitoring Stopped</span>
            )}
          </div>
        </div>

        <div className="panel-content-fixed">
          {/* 左侧固定宽度布局：ControlPanel + WebSocketList */}
          <div className="panel-left-section-fixed">
            <div className="control-panel-container-fixed">
              <div className="panel-wrapper">
                <div className="panel-body">
                  <ControlPanel
                    isMonitoring={isMonitoring}
                    onStartMonitoring={handleStartMonitoring}
                    onStopMonitoring={handleStopMonitoring}
                  />
                </div>
              </div>
            </div>

            <div className="websocket-list-container-fixed">
              <div className="panel-wrapper">
                <div className="panel-body">
                  <WebSocketList
                    websocketEvents={websocketEvents}
                    connectionsMap={connectionsMap}
                    selectedConnectionId={selectedConnectionId}
                    onSelectConnection={handleSelectConnection}
                    onClearConnections={handleClearConnections}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-resize-handle vertical disabled" />

          {/* 右侧：MessageDetails */}
          <div className="panel-right-section-fixed">
            <div className="panel-wrapper">
              <div className="panel-title">
                <h3>💬 Message Details</h3>
              </div>
              <div className="panel-body">
                <MessageDetails
                  connection={selectedConnection}
                  onSimulateMessage={handleSimulateMessage}
                  onClearMessages={handleClearMessages}
                  onOpenSimulatePanel={handleOpenSimulatePanel}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 悬浮模拟消息窗口 */}
        <FloatingSimulate
          ref={floatingSimulateRef}
          connection={selectedConnection}
          onSimulateMessage={handleSimulateMessage}
        />
      </div>
    </MantineProvider>
  );
};

// 渲染到 DOM
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<WebSocketPanel />);
