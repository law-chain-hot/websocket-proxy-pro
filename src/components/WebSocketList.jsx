import React, { useState } from "react";
import { filterConnections } from "../utils/filterUtils";

const WebSocketList = ({
  websocketEvents, // 所有WebSocket事件的数组
  connectionsMap, // 所有连接的基础信息Map（包括active和inactive）
  selectedConnectionId,
  onSelectConnection,
  onClearConnections,
}) => {
  const [activeCollapsed, setActiveCollapsed] = useState(false); // 活跃连接折叠状态
  const [inactiveCollapsed, setInactiveCollapsed] = useState(true); // 非活跃连接折叠状态
  const [filterText, setFilterText] = useState(""); // 连接过滤文本
  const [filterInvert, setFilterInvert] = useState(false); // 反向过滤
  if (!connectionsMap || connectionsMap.size === 0) {
    return (
      <div className="websocket-list-empty">
        <div className="empty-state">
          <div className="empty-icon">🔌</div>
          <div className="empty-text">No WebSocket connections detected</div>
          <div className="empty-description">
            WebSocket connections will appear here when detected on the current
            page.
          </div>
        </div>
      </div>
    );
  }

  const getStatusIndicator = (status) => {
    switch (status) {
      case "connecting":
        return { emoji: "🔄", color: "#ffa500", text: "Connecting" };
      case "open":
        return { emoji: "✅", color: "#4caf50", text: "Connected" };
      case "closed":
        return { emoji: "❌", color: "#f44336", text: "Closed" };
      case "error":
        return { emoji: "⚠️", color: "#ff9800", text: "Error" };
      default:
        return { emoji: "❓", color: "#9e9e9e", text: "Unknown" };
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
    return `${timeString}.${milliseconds.substring(0, 3)}`;
  };

  const getConnectionById = (connectionId) => {
    return websocketEvents.find((conn) => conn.id === connectionId);
  };

  // 获取每个连接的最新状态
  const getConnectionStatus = (connectionId) => {
    const messages = websocketEvents
      .filter((conn) => conn.id === connectionId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (messages.length === 0) return "unknown";

    // 查找最新的状态信息
    const latestStatusMessage = messages.find(
      (msg) =>
        msg.type === "open" ||
        msg.type === "close" ||
        msg.type === "error" ||
        msg.status
    );

    return latestStatusMessage
      ? latestStatusMessage.status || latestStatusMessage.type
      : "unknown";
  };

  // 使用connectionsMap构建连接列表
  const uniqueConnections = Array.from(connectionsMap.values()).map((connInfo) => {
    const messageCount = websocketEvents
      .filter((event) => event.id === connInfo.id && event.type === "message")
      .filter((msg, index, arr) =>
        arr.findIndex(
          (m) =>
            m.timestamp === msg.timestamp &&
            m.data === msg.data &&
            m.direction === msg.direction
        ) === index
      ).length;

    const lastActivity = Math.max(
      connInfo.lastActivity,
      ...websocketEvents
        .filter((event) => event.id === connInfo.id)
        .map((event) => event.timestamp)
    );

          return {
        id: connInfo.id,
        url: connInfo.url,
        type: "connection",
        timestamp: connInfo.timestamp,
        status: connInfo.status === "close" ? "closed" : connInfo.status, // 映射"close"为"closed"
        messageCount,
        lastActivity,
      };
    });

  // 分组连接：活跃和非活跃，按创建时间排序（新到旧）
  const filteredConnections = filterConnections(uniqueConnections, {
    text: filterText,
    invert: filterInvert,
  });

  const activeConnections = filteredConnections
    .filter((conn) => conn.status === "open" || conn.status === "connecting")
    .sort((a, b) => b.timestamp - a.timestamp);

  const inactiveConnections = filteredConnections
    .filter((conn) => conn.status === "closed" || conn.status === "error")
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleClearFilter = () => {
    setFilterText("");
    setFilterInvert(false);
  };

  // 渲染连接项的通用函数
  const renderConnection = (connection) => {
    const status = getStatusIndicator(connection.status);
    const isSelected = connection.id === selectedConnectionId;

    return (
      <div
        key={connection.id}
        className={`connection-item ${isSelected ? "selected" : ""}`}
        onClick={() => onSelectConnection(connection.id)}
      >
        <div className="connection-header">
          <div className="connection-status">
            <span
              className="status-indicator"
              style={{ color: status.color }}
              title={status.text}
            >
              {status.emoji}
            </span>
            <span className="status-text" style={{ color: status.color }}>
              {status.text}
            </span>
          </div>
          <div className="connection-id">
            {connection.id ? connection.id.split("_").pop() : "N/A"}
          </div>
        </div>

        <div className="connection-url" title={connection.url}>
          {connection.url}
        </div>

        <div className="connection-info">
          <div className="info-item">
            <span className="info-label">Messages:</span>
            <span className="info-value">{connection.messageCount}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Created:</span>
            <span className="info-value">
              {formatTimestamp(connection.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="websocket-list">
      <div className="connections-container">
        {/* 活跃连接 */}
        {activeConnections.length > 0 && (
          <div className="connection-group">
            <div
              className="connection-group-header clickable"
              onClick={() => setActiveCollapsed(!activeCollapsed)}
            >
              <h4>
                {activeCollapsed ? "▶" : "▼"} 🟢 Active Connections (
                {activeConnections.length})
              </h4>
            </div>
            {!activeCollapsed && (
              <div className="connection-group-content">
                {activeConnections.map(renderConnection)}
              </div>
            )}
          </div>
        )}

        {/* 非活跃连接 */}
        {inactiveConnections.length > 0 && (
          <div className="connection-group">
            <div
              className="connection-group-header clickable"
              onClick={() => setInactiveCollapsed(!inactiveCollapsed)}
            >
              <h4>
                {inactiveCollapsed ? "▶" : "▼"} 🔴 Inactive Connections (
                {inactiveConnections.length})
              </h4>
            </div>
            {!inactiveCollapsed && (
              <div className="connection-group-content">
                {inactiveConnections.map(renderConnection)}
              </div>
            )}
          </div>
        )}

        {/* 没有连接时的提示 */}
        {activeConnections.length === 0 && inactiveConnections.length === 0 && (
          <div className="empty-state">
            <p>No connections found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketList;
