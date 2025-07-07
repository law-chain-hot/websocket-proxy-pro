import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 加载保存的状态
  useEffect(() => {
    chrome.storage.local.get(["websocket-proxy-enabled"], (result) => {
      setIsEnabled(result["websocket-proxy-enabled"] !== false); // 默认启用
      setIsLoading(false);
    });
  }, []);

  // 处理开关切换
  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    // 保存状态
    chrome.storage.local.set({
      "websocket-proxy-enabled": newState,
    });

    // 通知background script状态变化
    chrome.runtime.sendMessage({
      type: "toggle-extension",
      enabled: newState,
    });
  };

  // 打开DevTools提示
  const handleOpenDevTools = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "show-devtools-hint",
      });
    });

    // 关闭popup
    window.close();
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 标题 */}
      <div style={styles.header}>
        <h3 style={styles.title}>WebSocket Proxy</h3>
      </div>

      {/* 开关控制 */}
      <div style={styles.section}>
        <div style={styles.switchContainer}>
          <span style={styles.switchLabel}>Enable Extension</span>
          <button
            style={{
              ...styles.switchButton,
              backgroundColor: isEnabled ? "#38a169" : "#4a5568",
            }}
            onClick={handleToggle}
          >
            <div
              style={{
                ...styles.switchThumb,
                transform: isEnabled ? "translateX(22px)" : "translateX(2px)",
              }}
            />
          </button>
        </div>
        <div style={styles.switchHint}>
          {isEnabled ? "Active on new pages" : "Disabled on new pages"}
        </div>
      </div>

      {/* 使用提示 */}
      <div style={styles.section}>
        <button style={styles.instructionButton} onClick={handleOpenDevTools}>
          📊 Open DevTools Panel
        </button>
        <div style={styles.hint}>Press F12 → Find "WebSocket Monitor" tab</div>
      </div>

      {/* 状态提示 */}
      <div style={styles.footer}>
        <div style={styles.status}>
          Status:{" "}
          <span style={{ color: isEnabled ? "#38a169" : "#e53e3e" }}>
            {isEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "16px",
    minHeight: "200px",
    backgroundColor: "#1a202c",
    color: "#f7fafc",
  },
  header: {
    textAlign: "center",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #4a5568",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
  },
  section: {
    marginBottom: "16px",
  },
  switchContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  switchLabel: {
    fontSize: "14px",
    fontWeight: "500",
  },
  switchButton: {
    width: "48px",
    height: "24px",
    borderRadius: "12px",
    border: "none",
    position: "relative",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  switchThumb: {
    width: "20px",
    height: "20px",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    position: "absolute",
    top: "2px",
    transition: "transform 0.2s",
  },
  switchHint: {
    fontSize: "12px",
    color: "#a0aec0",
    fontStyle: "italic",
  },
  instructionButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#3182ce",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  hint: {
    fontSize: "12px",
    color: "#a0aec0",
    textAlign: "center",
    marginTop: "8px",
  },
  footer: {
    borderTop: "1px solid #4a5568",
    paddingTop: "12px",
    textAlign: "center",
  },
  status: {
    fontSize: "12px",
    color: "#e2e8f0",
  },
  loading: {
    textAlign: "center",
    padding: "20px",
    color: "#a0aec0",
  },
};

// 渲染到DOM
const container = document.getElementById("popup-root");
const root = createRoot(container);
root.render(<Popup />);
