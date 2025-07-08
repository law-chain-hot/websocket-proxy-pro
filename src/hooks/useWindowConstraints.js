import { useState, useEffect, useCallback } from "react";

export const useWindowConstraints = () => {
  const [maxSize, setMaxSize] = useState({ width: 1500, height: 1200 });

  // Calculate max size based on viewport
  useEffect(() => {
    const updateMaxSize = () => {
      const margin = 40; // 预留更多边距给maxSize
      setMaxSize({
        width: Math.max(300, window.innerWidth - margin),
        height: Math.max(350, window.innerHeight - margin),
      });
    };

    // 初始计算
    updateMaxSize();

    // 监听窗口resize
    window.addEventListener("resize", updateMaxSize);
    return () => window.removeEventListener("resize", updateMaxSize);
  }, []);

  // 位置和尺寸边界检查和修正函数
  const validateAndFixPositionAndSize = useCallback((position, size) => {
    // 获取当前视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 解析窗口尺寸
    let windowWidth = 400;
    let windowHeight = 500;

    if (size) {
      windowWidth =
        typeof size.width === "string"
          ? parseInt(size.width.replace("px", ""))
          : size.width || 400;
      windowHeight =
        typeof size.height === "string"
          ? parseInt(size.height.replace("px", ""))
          : size.height || 500;
    }

    // 预留边距
    const margin = 20;
    const maxWidth = viewportWidth - margin * 2;
    const maxHeight = viewportHeight - margin * 2;

    // 检查和修正尺寸
    let adjustedWidth = windowWidth;
    let adjustedHeight = windowHeight;
    let sizeChanged = false;

    if (windowWidth > maxWidth) {
      adjustedWidth = maxWidth;
      sizeChanged = true;
    }

    if (windowHeight > maxHeight) {
      adjustedHeight = maxHeight;
      sizeChanged = true;
    }

    // 检查和修正位置（基于调整后的尺寸）
    let { x, y } = position;
    let positionChanged = false;

    // 确保窗口右边不超出视口
    if (x + adjustedWidth > viewportWidth) {
      x = Math.max(margin, viewportWidth - adjustedWidth - margin);
      positionChanged = true;
    }

    // 确保窗口左边不超出视口
    if (x < margin) {
      x = margin;
      positionChanged = true;
    }

    // 确保窗口底部不超出视口
    if (y + adjustedHeight > viewportHeight) {
      y = Math.max(margin, viewportHeight - adjustedHeight - margin);
      positionChanged = true;
    }

    // 确保窗口顶部不超出视口
    if (y < margin) {
      y = margin;
      positionChanged = true;
    }

    return {
      position: { x, y },
      size: { width: adjustedWidth, height: adjustedHeight },
      positionChanged,
      sizeChanged,
    };
  }, []);

  return {
    maxSize,
    validateAndFixPositionAndSize,
  };
};

export default useWindowConstraints;
