import { useEffect } from "react";

export const useAutoResize = ({
  isWindowOpen,
  isAnimating,
  windowPosition,
  windowSize,
  validateAndFixPositionAndSize,
  setWindowPosition,
  setWindowSize,
}) => {
  // Handle window resize - auto-correct position and size if panel is open
  useEffect(() => {
    const handleWindowResize = () => {
      if (isWindowOpen && !isAnimating) {
        // 检查当前位置和尺寸是否仍然有效
        const result = validateAndFixPositionAndSize(
          windowPosition,
          windowSize
        );

        // 如果位置或尺寸需要修正，更新状态
        if (result.positionChanged || result.sizeChanged) {
          console.log("📍 Auto-correcting after resize:", {
            position: result.positionChanged
              ? `${windowPosition.x},${windowPosition.y} → ${result.position.x},${result.position.y}`
              : "unchanged",
            size: result.sizeChanged
              ? `${windowSize.width}x${windowSize.height} → ${result.size.width}x${result.size.height}`
              : "unchanged",
          });

          if (result.positionChanged) {
            setWindowPosition(result.position);
          }

          if (result.sizeChanged) {
            setWindowSize(result.size);
          }
        }
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [
    isWindowOpen,
    isAnimating,
    windowPosition,
    windowSize,
    validateAndFixPositionAndSize,
    setWindowPosition,
    setWindowSize,
  ]);
};

export default useAutoResize;
