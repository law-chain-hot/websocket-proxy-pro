import React, { forwardRef, useImperativeHandle, useRef } from "react";
import SimulateMessagePanel from "./SimulateMessagePanel";

const FloatingSimulate = forwardRef(
  ({ connection, onSimulateMessage }, ref) => {
    const simulatePanelRef = useRef(null);

    // 暴露openPanel函数给外部使用
    useImperativeHandle(ref, () => ({
      openPanel: (options = {}) => {
        if (simulatePanelRef.current) {
          simulatePanelRef.current.openPanel(options);
        }
      },
    }));

    return (
      <SimulateMessagePanel
        ref={simulatePanelRef}
        connection={connection}
        onSimulateMessage={onSimulateMessage}
      />
    );
  }
);

export default FloatingSimulate;
