import React, { useState } from "react";
import { CheckCircle, XCircle, Wifi, Trash2 } from "lucide-react";
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

  // 使用connectionsMap构建连接列表
  const uniqueConnections =
    connectionsMap && connectionsMap.size > 0
      ? Array.from(connectionsMap.values()).map((connInfo) => {
          const messageCount = websocketEvents
            .filter(
              (event) => event.id === connInfo.id && event.type === "message"
            )
            .filter(
              (msg, index, arr) =>
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
        })
      : [];

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

  // 渲染连接项的通用函数
  const renderConnection = (connection, isActive) => {
    const isSelected = connection.id === selectedConnectionId;

    return (
      <div
        key={connection.id}
        style={{
          background: isSelected
            ? "rgba(59, 130, 246, 0.2)" // 选中时使用蓝色背景
            : "rgba(75, 85, 99, 0.3)",
          border: isSelected
            ? "1px solid rgba(59, 130, 246, 0.8)" // 选中时使用更明显的蓝色边框
            : "1px solid rgba(107, 114, 128, 0.5)",
          borderRadius: "8px",
          padding: "12px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginBottom: "8px",
        }}
        onClick={() => onSelectConnection(connection.id)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = "rgba(75, 85, 99, 0.4)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = "rgba(75, 85, 99, 0.3)";
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isActive ? (
              <CheckCircle size={14} color="#10b981" />
            ) : (
              <XCircle size={14} color="#ef4444" />
            )}
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: isActive ? "#10b981" : "#ef4444",
                letterSpacing: "0.5px",
              }}
            >
              {isActive ? "CONNECTED" : "CLOSED"}
            </span>
          </div>
          <button
            style={{
              padding: "4px",
              background: "none",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(75, 85, 99, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <div
              style={{
                width: "4px",
                height: "4px",
                backgroundColor: "#9ca3af",
                borderRadius: "50%",
              }}
            />
          </button>
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "var(--text-secondary)",
            marginBottom: "8px",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            wordBreak: "break-all",
            lineHeight: 1.3,
          }}
        >
          {connection.url}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            color: "var(--text-muted)",
          }}
        >
          <span>Messages: {connection.messageCount}</span>
          <span>Created: {formatTimestamp(connection.timestamp)}</span>
        </div>
      </div>
    );
  };

  const ArrowTriangle = ({ collapsed, color }) => (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: "4px solid transparent",
        borderRight: "4px solid transparent",
        borderTop: `6px solid ${color}`,
        transform: collapsed ? "rotate(-90deg)" : "none",
        transition: "transform 0.2s ease",
      }}
    />
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Fixed Header */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px 16px 8px 16px",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid rgba(74, 222, 128, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wifi size={12} color="rgb(74, 222, 128)" />
            </div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "rgb(229, 231, 235)",
                margin: 0,
              }}
            >
              WebSocket Connections
            </span>
          </div>
          {connectionsMap && connectionsMap.size > 0 && (
            <button
              style={{
                padding: "3px",
                background: "transparent",
                color: "#f87171",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={onClearConnections}
              title="Clear all WebSocket connections and events"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(220, 38, 38, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Active Connections */}
          {activeConnections.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  cursor: "pointer",
                }}
                onClick={() => setActiveCollapsed(!activeCollapsed)}
              >
                <ArrowTriangle collapsed={activeCollapsed} color="#10b981" />
                <span
                  style={{
                    fontSize: "11px",
                    color: "#10b981",
                    fontWeight: 500,
                  }}
                >
                  Active Connections ({activeConnections.length})
                </span>
              </div>
              {!activeCollapsed && (
                <div style={{ marginBottom: "16px" }}>
                  {activeConnections.map((conn) =>
                    renderConnection(conn, true)
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inactive Connections */}
          {inactiveConnections.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  cursor: "pointer",
                }}
                onClick={() => setInactiveCollapsed(!inactiveCollapsed)}
              >
                <ArrowTriangle collapsed={inactiveCollapsed} color="#ef4444" />
                <span
                  style={{
                    fontSize: "11px",
                    color: "#ef4444",
                    fontWeight: 500,
                  }}
                >
                  Inactive Connections ({inactiveConnections.length})
                </span>
              </div>
              {!inactiveCollapsed && (
                <div>
                  {inactiveConnections.map((conn) =>
                    renderConnection(conn, false)
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketList;
