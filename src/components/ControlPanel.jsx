import React, { useState } from "react";

const ControlPanel = ({
  isMonitoring,
  onStartMonitoring,
  onStopMonitoring,
}) => {
  const [blockOutgoing, setBlockOutgoing] = useState(false);
  const [blockIncoming, setBlockIncoming] = useState(false);

  const handleBlockOutgoingToggle = () => {
    const newState = !blockOutgoing;
    setBlockOutgoing(newState);

    // 发送阻止出站消息的命令
    chrome.runtime
      .sendMessage({
        type: "block-outgoing",
        enabled: newState,
      })
      .catch((error) => {
        console.error("❌ Failed to toggle outgoing block:", error);
      });
  };

  const handleBlockIncomingToggle = () => {
    const newState = !blockIncoming;
    setBlockIncoming(newState);

    // 发送阻止入站消息的命令
    chrome.runtime
      .sendMessage({
        type: "block-incoming",
        enabled: newState,
      })
      .catch((error) => {
        console.error("❌ Failed to toggle incoming block:", error);
      });
  };

  return (
    <div className="control-panel">
      <div className="control-grid">
        {/* 左列：监控控制 */}
        <div className="control-column">
          <div className="control-section compact">
            <h3>🎛️ Monitor</h3>
            <div className="control-switches">
              <div className="switch-item">
                <span className="switch-label">Monitoring</span>
                <button 
                  className={`switch-btn ${isMonitoring ? 'on' : 'off'}`}
                  onClick={isMonitoring ? onStopMonitoring : onStartMonitoring}
                >
                  <span className="switch-indicator">
                    {isMonitoring ? '●○' : '○●'}
                  </span>
                  <span className="switch-text">
                    {isMonitoring ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 右列：消息控制 */}
        <div className="control-column">
          {isMonitoring && (
            <div className="control-section compact">
              <h3>🚫 Message Control</h3>
              <div className="control-switches">
                <div className="switch-item">
                  <span className="switch-label">Block Outgoing</span>
                  <button 
                    className={`switch-btn ${blockOutgoing ? 'on' : 'off'}`}
                    onClick={handleBlockOutgoingToggle}
                    title={
                      blockOutgoing
                        ? "Currently blocking outgoing messages"
                        : "Currently allowing outgoing messages"
                    }
                  >
                    <span className="switch-indicator">
                      {blockOutgoing ? '●○' : '○●'}
                    </span>
                    <span className="switch-text">
                      {blockOutgoing ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
                
                <div className="switch-item">
                  <span className="switch-label">Block Incoming</span>
                  <button 
                    className={`switch-btn ${blockIncoming ? 'on' : 'off'}`}
                    onClick={handleBlockIncomingToggle}
                    title={
                      blockIncoming
                        ? "Currently blocking incoming messages"
                        : "Currently allowing incoming messages"
                    }
                  >
                    <span className="switch-indicator">
                      {blockIncoming ? '●○' : '○●'}
                    </span>
                    <span className="switch-text">
                      {blockIncoming ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
