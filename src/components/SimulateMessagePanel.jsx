import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Rnd } from "react-rnd";
import { Tabs } from "@mantine/core";
import JsonViewer from "./JsonViewer";
import useWindowConstraints from "../hooks/useWindowConstraints";
import useAutoResize from "../hooks/useAutoResize";
import useWindowAnimation from "../hooks/useWindowAnimation";
import usePanelManager from "../hooks/usePanelManager";

const SimulateMessagePanel = forwardRef(
  ({ connection, onSimulateMessage }, ref) => {
    const [simulateMessage, setSimulateMessage] = useState(
      '{\n  "message": "Hello World",\n  "timestamp": "2025-01-01T00:00:00Z"\n}'
    );
    const [isSending, setIsSending] = useState(false);
    const [isWindowOpen, setIsWindowOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
    const [windowSize, setWindowSize] = useState({ width: 400, height: 500 });
    const windowRef = useRef(null);

    // 使用窗口约束 hook
    const { maxSize, validateAndFixPositionAndSize } = useWindowConstraints();

    // 使用窗口动画 hook
    const { isAnimating, animateWindowOpen } =
      useWindowAnimation(setWindowPosition);

    // 使用面板管理 hook
    const { openPanel, toggleWindow, minimizeWindow } = usePanelManager({
      isWindowOpen,
      isAnimating,
      windowSize,
      setIsWindowOpen,
      setWindowSize,
      validateAndFixPositionAndSize,
      animateWindowOpen,
    });

    // 使用自动resize hook
    useAutoResize({
      isWindowOpen,
      isAnimating,
      windowPosition,
      windowSize,
      validateAndFixPositionAndSize,
      setWindowPosition,
      setWindowSize,
    });

    // Load saved state from localStorage
    useEffect(() => {
      const savedState = localStorage.getItem("simulateMessagePanel");
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setSimulateMessage(
            parsed.message ||
              '{\n  "message": "Hello World",\n  "timestamp": "2025-01-01T00:00:00Z"\n}'
          );
          setIsPinned(parsed.isPinned || false);
          setWindowPosition(
            parsed.position || { x: window.innerWidth - 420, y: 100 }
          );
          setWindowSize(parsed.size || { width: 400, height: 500 });
        } catch (error) {
          console.error("Failed to load saved state:", error);
        }
      } else {
        // Default position
        setWindowPosition({ x: window.innerWidth - 420, y: 100 });
      }
    }, []);

    // Save state to localStorage whenever relevant state changes
    useEffect(() => {
      // 在动画期间忽略位置变化，避免保存临时位置
      if (isAnimating) return;

      const stateToSave = {
        message: simulateMessage,
        isPinned,
        position: windowPosition,
        size: windowSize,
      };
      localStorage.setItem("simulateMessagePanel", JSON.stringify(stateToSave));
    }, [simulateMessage, isPinned, windowPosition, windowSize, isAnimating]);

    // Handle click outside to close (only when not pinned)
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          isWindowOpen &&
          !isPinned &&
          windowRef.current &&
          !windowRef.current.contains(event.target) &&
          !event.target.closest(".floating-simulate-button")
        ) {
          setIsWindowOpen(false);
        }
      };

      if (isWindowOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isWindowOpen, isPinned]);

    // Handle simulate message with direction parameter
    const handleSimulateMessage = async (direction) => {
      if (!connection || !simulateMessage.trim() || isSending) {
        return;
      }

      setIsSending(true);

      try {
        await onSimulateMessage({
          connectionId: connection.id,
          message: simulateMessage,
          direction: direction,
        });
      } catch (error) {
        console.error("Failed to simulate message:", error);
      } finally {
        setTimeout(() => setIsSending(false), 200);
      }
    };

    const handleMessageChange = (value) => {
      console.log("📨 SimulateMessagePanel handleMessageChange:", {
        valueLength: value.length,
        currentMessageLength: simulateMessage.length,
        valuePreview:
          value.substring(0, 100) + (value.length > 100 ? "..." : ""),
        changed: value !== simulateMessage,
      });
      setSimulateMessage(value);
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Default to incoming on Ctrl+Enter
        handleSimulateMessage("incoming");
      }
    };

    const clearMessage = () => {
      setSimulateMessage("");
    };

    // 暴露openPanel函数给外部使用
    useImperativeHandle(ref, () => ({
      openPanel,
    }));

    const togglePin = () => {
      setIsPinned(!isPinned);
    };

    const handleDragStop = (e, data) => {
      setWindowPosition({ x: data.x, y: data.y });
    };

    const handleResizeStop = (e, direction, ref, delta, position) => {
      setWindowSize({
        width: ref.style.width,
        height: ref.style.height,
      });
      setWindowPosition(position);
    };

    return (
      <>
        {/* Floating toggle button */}
        {!isWindowOpen && (
          <div
            className={`floating-simulate-button ${isWindowOpen ? "open" : ""}`}
            onClick={toggleWindow}
          >
            <div className="simulate-icon">{isWindowOpen ? "─" : "🎭"}</div>
            <div className="simulate-tooltip">
              {isWindowOpen ? "Minimize Simulate" : "Open Simulate"}
            </div>
          </div>
        )}

        {/* Draggable and resizable window */}
        {isWindowOpen && (
          <Rnd
            size={windowSize}
            position={windowPosition}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            minWidth={300}
            minHeight={350}
            maxWidth={maxSize.width}
            maxHeight={maxSize.height}
            bounds="parent"
            dragHandleClassName="simulate-window-header"
            className="simulate-floating-window"
            style={{
              zIndex: 1000,
            }}
          >
            <div className="simulate-window-container" ref={windowRef}>
              {/* Window header - draggable area */}
              <div
                className={`simulate-window-header ${isPinned ? "pinned" : ""}`}
              >
                <div className="simulate-window-title">
                  <span className="simulate-icon-small">🎭</span>
                  <span>Simulate Message</span>
                  {connection && (
                    <span className="connection-indicator">
                      - {connection.url}
                    </span>
                  )}
                </div>
                <div className="simulate-window-controls">
                  <button
                    className={`window-control-btn pin ${
                      isPinned ? "active" : ""
                    }`}
                    onClick={togglePin}
                    title={
                      isPinned
                        ? "Unpin - Click outside to close"
                        : "Pin - Prevent close on outside click"
                    }
                  >
                    {isPinned ? "📌" : "📌"}
                  </button>
                  <button
                    className="window-control-btn minimize"
                    onClick={minimizeWindow}
                    title="Minimize"
                  >
                    ─
                  </button>
                </div>
              </div>

              {/* Window content */}
              <div className="simulate-window-content">
                {!connection ? (
                  <div className="simulate-panel-empty floating">
                    <p>🔌 Please select a WebSocket connection first</p>
                  </div>
                ) : (
                  <Tabs
                    variant="pills"
                    defaultValue="editor"
                    orientation="horizontal"
                  >
                    <Tabs.List>
                      <Tabs.Tab value="editor">📝 Editor</Tabs.Tab>
                      <Tabs.Tab value="favorites">⭐ Favorites</Tabs.Tab>
                      <Tabs.Tab value="system">🔧 System</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="editor">
                      <div className="simulate-content">
                        <div className="simulate-input-container">
                          <div
                            className="simulate-input-editor"
                            onKeyDown={handleKeyPress}
                          >
                            <JsonViewer
                              data={simulateMessage}
                              readOnly={false}
                              onChange={handleMessageChange}
                              showControls={true}
                              className="simulate-editor"
                            />
                          </div>
                        </div>

                        <div className="simulate-actions">
                          <div className="simulate-buttons">
                            <button
                              className="simulate-btn incoming"
                              onClick={() => handleSimulateMessage("incoming")}
                              disabled={!simulateMessage.trim() || isSending}
                            >
                              {isSending
                                ? "⏳ Sending..."
                                : "📥 Simulate Receive"}
                            </button>
                            <button
                              className="simulate-btn outgoing"
                              onClick={() => handleSimulateMessage("outgoing")}
                              disabled={!simulateMessage.trim() || isSending}
                            >
                              {isSending ? "⏳ Sending..." : "📤 Simulate Send"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Tabs.Panel>

                    <Tabs.Panel value="favorites">
                      <div className="tab-content-placeholder">
                        <div className="placeholder-icon">⭐</div>
                        <h4>Message Templates</h4>
                        <p>Save and reuse your WebSocket messages</p>
                        <div className="feature-list">
                          <div className="feature-item">
                            <span className="feature-dot"></span>
                            <span>Save frequently used messages</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-dot"></span>
                            <span>Quick access to message history</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-dot"></span>
                            <span>Organize message library</span>
                          </div>
                        </div>
                      </div>
                    </Tabs.Panel>

                    <Tabs.Panel value="system">
                      <div className="tab-content-placeholder">
                        <div className="placeholder-icon">🔧</div>
                        <h4>System Events</h4>
                        <p>Simulate WebSocket system events and states</p>
                        <div className="feature-list">
                          <div className="feature-item">
                            <span className="feature-dot"></span>
                            <span>Connection open/close events</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-dot"></span>
                            <span>Network error simulation</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-dot"></span>
                            <span>Timeout and retry events</span>
                          </div>
                        </div>
                      </div>
                    </Tabs.Panel>
                  </Tabs>
                )}
              </div>
            </div>
          </Rnd>
        )}
      </>
    );
  }
);

export default SimulateMessagePanel;
