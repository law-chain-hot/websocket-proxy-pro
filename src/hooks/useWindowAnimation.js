import { useState, useCallback } from "react";

export const useWindowAnimation = (setWindowPosition) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // 启动动画函数
  const animateWindowOpen = useCallback(
    (targetPos) => {
      const startPos = { x: targetPos.x, y: targetPos.y + 100 };
      setWindowPosition(startPos);
      setIsAnimating(true);

      // 立即开始动画，不延迟
      requestAnimationFrame(() => {
        const startTime = performance.now();
        const deltaY = -100;

        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / 350, 1); // 稍微缩短动画时间

          // 使用更平滑的缓动函数 (ease-out-quart)
          const eased = 1 - Math.pow(1 - progress, 4);

          const currentY = startPos.y + deltaY * eased;
          setWindowPosition({ x: targetPos.x, y: currentY });

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // 确保精确到达目标位置
            setWindowPosition(targetPos);
            setIsAnimating(false);
          }
        };

        requestAnimationFrame(animate);
      });
    },
    [setWindowPosition]
  );

  return {
    isAnimating,
    animateWindowOpen,
  };
};

export default useWindowAnimation;
