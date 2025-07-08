import { useCallback } from "react";

export const usePanelManager = ({
  isWindowOpen,
  isAnimating,
  windowSize,
  setIsWindowOpen,
  setWindowSize,
  validateAndFixPositionAndSize,
  animateWindowOpen,
}) => {
  // 可被外部调用的打开函数
  const openPanel = useCallback(() => {
    if (isWindowOpen || isAnimating) return;

    // 获取保存的状态
    const savedState = localStorage.getItem("simulateMessagePanel");
    let targetPos = { x: window.innerWidth - 420, y: 100 };
    let savedSize = windowSize;

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        targetPos = parsed.position || targetPos;
        savedSize = parsed.size || savedSize;
      } catch (error) {
        // 使用默认位置
      }
    }

    // 验证并修正位置和尺寸，防止超出视口
    const result = validateAndFixPositionAndSize(targetPos, savedSize);

    // 如果位置或尺寸被修正了，更新到状态中
    if (result.positionChanged || result.sizeChanged) {
      console.log("📍 Opening with corrections:", {
        position: result.positionChanged
          ? `${targetPos.x},${targetPos.y} → ${result.position.x},${result.position.y}`
          : "unchanged",
        size: result.sizeChanged
          ? `${savedSize.width}x${savedSize.height} → ${result.size.width}x${result.size.height}`
          : "unchanged",
      });

      // 更新尺寸（如果需要的话）
      if (result.sizeChanged) {
        setWindowSize(result.size);
      }
    }

    setIsWindowOpen(true);
    animateWindowOpen(result.position);
  }, [
    isWindowOpen,
    isAnimating,
    windowSize,
    setIsWindowOpen,
    setWindowSize,
    validateAndFixPositionAndSize,
    animateWindowOpen,
  ]);

  const toggleWindow = useCallback(() => {
    if (isAnimating) return;

    if (isWindowOpen) {
      setIsWindowOpen(false);
    } else {
      openPanel();
    }
  }, [isAnimating, isWindowOpen, setIsWindowOpen, openPanel]);

  const minimizeWindow = useCallback(() => {
    setIsWindowOpen(false);
  }, [setIsWindowOpen]);

  return {
    openPanel,
    toggleWindow,
    minimizeWindow,
  };
};

export default usePanelManager;
