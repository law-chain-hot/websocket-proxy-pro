import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import { Rnd } from "react-rnd";
import { Tabs } from "@mantine/core";
import { 
  FileText, 
  Star, 
  Settings, 
  MessageSquare,
  Wifi,
  Pin,
  Minus,
  Download,
  Upload,
  Clock,
  PinOff,
  CircleArrowDown,
  CircleArrowUp,
} from "lucide-react";
import JsonViewer from "./JsonViewer";
import useWindowConstraints from "../hooks/useWindowConstraints";
import useAutoResize from "../hooks/useAutoResize";
import useWindowAnimation from "../hooks/useWindowAnimation";
import usePanelManager from "../hooks/usePanelManager";
import FavoritesTab from "./FavoritesTab";
import globalFavorites, { addFromEditor } from "../utils/globalFavorites";

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
    const [activeTab, setActiveTab] = useState("editor");
    const [addFavoriteCallback, setAddFavoriteCallback] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const windowRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const listenersRef = useRef(null);

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

    // 防抖保存到 localStorage
    const debouncedSave = useCallback((stateToSave) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            "simulateMessagePanel",
            JSON.stringify(stateToSave)
          );
        } catch (error) {
          console.error("Failed to save state:", error);
        }
      }, 300); // 300ms 防抖
    }, []);

    // 优化：只在组件挂载时设置监听器，避免重复创建
    useEffect(() => {
      // 监听收藏夹服务事件和tab切换
      const unsubscribeFavorites = globalFavorites.addListener(
        (favorites, eventData) => {
          // 拖动期间忽略收藏夹变化，避免干扰
          if (isDragging) return;

          if (eventData?.type === "add" && eventData?.switchToFavoritesTab) {
            setActiveTab("favorites");
          }
        }
      );

      const unsubscribeTabSwitch = globalFavorites.addTabSwitchCallback(() => {
        // 拖动期间忽略tab切换请求
        if (isDragging) return;
        setActiveTab("favorites");
      });

      // 缓存监听器取消函数
      listenersRef.current = () => {
        unsubscribeFavorites();
        unsubscribeTabSwitch();
      };

      return () => {
        if (listenersRef.current) {
          listenersRef.current();
        }
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }, []); // 移除isDragging依赖，避免重复创建监听器

    // Load saved state from localStorage (只在组件挂载时执行一次)
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
        setWindowPosition({ x: window.innerWidth - 420, y: 100 });
      }
    }, []); // 空依赖数组，只在挂载时执行一次

    // 优化：拖动期间暂停localStorage保存
    useEffect(() => {
      // 在动画期间或拖动期间忽略位置变化，避免保存临时位置
      if (isAnimating || isDragging) return;

      const stateToSave = {
        message: simulateMessage,
        isPinned,
        position: windowPosition,
        size: windowSize,
      };
      debouncedSave(stateToSave);
    }, [
      simulateMessage,
      isPinned,
      windowPosition,
      windowSize,
      isAnimating,
      isDragging, // 添加isDragging依赖
      debouncedSave,
    ]);

    // Handle click outside to close (只有在窗口打开时才添加监听器)
    useEffect(() => {
      if (!isWindowOpen || isPinned) return;

      const handleClickOutside = (event) => {
        if (
          windowRef.current &&
          !windowRef.current.contains(event.target) &&
          !event.target.closest(".floating-simulate-button")
        ) {
          setIsWindowOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isWindowOpen, isPinned]);

    // 使用 useCallback 优化函数引用
    const handleSimulateMessage = useCallback(
      async (direction, data = null) => {
        const messageData = data || simulateMessage;

        if (!connection || !messageData.trim() || isSending) {
          return;
        }

        setIsSending(true);

        try {
          await onSimulateMessage({
            connectionId: connection.id,
            message: messageData,
            direction: direction,
          });
        } catch (error) {
          console.error("Failed to simulate message:", error);
        } finally {
          setTimeout(() => setIsSending(false), 200);
        }
      },
      [connection, simulateMessage, isSending, onSimulateMessage]
    );

    const handleMessageChange = useCallback(
      (value) => {
        console.log("📨 SimulateMessagePanel handleMessageChange:", {
          valueLength: value.length,
          currentMessageLength: simulateMessage.length,
          valuePreview:
            value.substring(0, 100) + (value.length > 100 ? "..." : ""),
          changed: value !== simulateMessage,
        });
        setSimulateMessage(value);
      },
      [simulateMessage]
    );

    const handleKeyPress = useCallback(
      (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleSimulateMessage("incoming");
        }
      },
      [handleSimulateMessage]
    );

    const handleAddToFavorites = useCallback(
      (data = null) => {
        const messageData = data || simulateMessage;
        if (!messageData.trim()) return;

        const newFavorite = addFromEditor(messageData.trim());

        if (newFavorite) {
          console.log("Added to favorites:", newFavorite.name);
        }
      },
      [simulateMessage]
    );

    const clearMessage = () => {
      setSimulateMessage("");
    };

    // 暴露openPanel函数给外部使用
    useImperativeHandle(ref, () => ({
      openPanel: (options = {}) => {
        console.log(
          "🎭 SimulateMessagePanel openPanel called with options:",
          options
        );
        openPanel();

        // 如果指定了tab，切换到对应tab
        if (options.tab) {
          setActiveTab(options.tab);

          // 如果指定了数据且要切换到favorites tab，延迟添加到收藏夹
          if (options.tab === "favorites" && options.data) {
            // 使用setTimeout确保tab切换完成后再添加收藏
            setTimeout(() => {
              console.log(
                "🎭 Adding data to favorites:",
                options.data.substring(0, 100) + "..."
              );
              const newFavorite = addFromEditor(options.data, {
                switchToFavoritesTab: false, // 不再次切换tab，因为我们已经切换了
                generateName: false, // 生成空名字供用户编辑
                autoEdit: true, // 自动进入编辑状态
                showNotification: false, // 不显示通知
              });
              console.log("🎭 New favorite created:", newFavorite);
            }, 100);
          }
        }
      },
    }));

    const togglePin = () => {
      setIsPinned(!isPinned);
    };

    // 优化：添加拖动开始和结束处理
    const handleDragStart = useCallback(() => {
      setIsDragging(true);
    }, []);

    const handleDragStop = useCallback((e, data) => {
      setWindowPosition({ x: data.x, y: data.y });
      // 延迟重置拖动状态，确保状态更新完成
      setTimeout(() => setIsDragging(false), 50);
    }, []);

    const handleResizeStop = useCallback(
      (e, direction, ref, delta, position) => {
        setWindowSize({
          width: ref.style.width,
          height: ref.style.height,
        });
        setWindowPosition(position);
      },
      []
    );

    // 优化按钮状态计算
    const isSimulateDisabled = useMemo(
      () => !simulateMessage.trim() || isSending,
      [simulateMessage, isSending]
    );

    // 可复用的模拟按钮组件
    const SimulateButton = ({ direction, icon: Icon, label, className }) => (
      <button
        className={`simulate-btn ${className}`}
        onClick={() => handleSimulateMessage(direction)}
        disabled={isSimulateDisabled}
      >
        <Icon size={16} />
        {label}
      </button>
    );

    // 优化：使用useMemo缓存FavoritesTab props，避免不必要的重渲染
    const favoritesTabProps = useMemo(
      () => ({
        onSendMessage: (data) => handleSimulateMessage("outgoing", data),
        onReceiveMessage: (data) => handleSimulateMessage("incoming", data),
        onAddFavorite: (callback) => setAddFavoriteCallback(() => callback),
      }),
      [handleSimulateMessage]
    );

    return (
      <>
        {/* Floating toggle button - 只在panel关闭时显示 */}
        {!isWindowOpen && (
          <div
            className={`floating-simulate-button ${isWindowOpen ? "open" : ""}`}
            onClick={toggleWindow}
          >
            <div className="simulate-icon">
              {isWindowOpen ? <Minus size={24} /> : <MessageSquare size={24} />}
            </div>
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
            onDragStart={handleDragStart}
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
                  <MessageSquare size={16} className="simulate-icon-small" />
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
                    {isPinned ? <Pin size={12} /> : <PinOff size={12} />}
                  </button>
                  <button
                    className="window-control-btn minimize"
                    onClick={minimizeWindow}
                    title="Minimize"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              </div>

              {/* Window content */}
              <div className="simulate-window-content">
                {!connection ? (
                  <div className="simulate-panel-empty floating">
                    <p><Wifi size={16} style={{display: 'inline', marginRight: '10px'}} />Please select a WebSocket connection first</p>
                  </div>
                ) : (
                  <Tabs
                    variant="pills"
                    value={activeTab}
                    onChange={setActiveTab}
                    orientation="horizontal"
                  >
                    <Tabs.List>
                      <Tabs.Tab value="editor" leftSection={<FileText size={14} />}>Editor</Tabs.Tab>
                      <Tabs.Tab value="favorites" leftSection={<Star size={14} />}>Favorites</Tabs.Tab>
                      <Tabs.Tab value="system" leftSection={<Settings size={14} />}>System</Tabs.Tab>
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
                              showFavoritesButton={true}
                              onAddToFavorites={handleAddToFavorites}
                            />
                          </div>
                        </div>

                        <div className="simulate-actions">
                          <div className="simulate-buttons">
                            <SimulateButton
                              direction="incoming"
                              icon={CircleArrowDown}
                              label="Simulate Receive"
                              className="incoming"
                            />
                            <SimulateButton
                              direction="outgoing"
                              icon={CircleArrowUp}
                              label="Simulate Send"
                              className="outgoing"
                            />
                          </div>
                        </div>
                      </div>
                    </Tabs.Panel>

                    <Tabs.Panel value="favorites">
                      <FavoritesTab {...favoritesTabProps} />
                    </Tabs.Panel>

                    <Tabs.Panel value="system">
                      <div className="tab-content-placeholder">
                        <div className="placeholder-icon">
                          <Settings size={48} />
                        </div>
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
