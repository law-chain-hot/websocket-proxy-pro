import React from "react";
import SimulateMessagePanel from "./SimulateMessagePanel";

const FloatingSimulate = ({ connection, onSimulateMessage }) => {
  return (
    <SimulateMessagePanel 
      connection={connection} 
      onSimulateMessage={onSimulateMessage}
    />
  );
};

export default FloatingSimulate; 