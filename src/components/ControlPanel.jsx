import React, { useState, useEffect } from "react";

const ControlPanel = ({
  isMonitoring,
  onStartMonitoring,
  onStopMonitoring,
}) => {
  const [blockOutgoing, setBlockOutgoing] = useState(false);
  const [blockIncoming, setBlockIncoming] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(true);

  // Load settings from chrome.storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get({
          autoStartEnabled: true,
          blockOutgoing: false,
          blockIncoming: false,
        });
        
        setAutoStartEnabled(result.autoStartEnabled);
        setBlockOutgoing(result.blockOutgoing);
        setBlockIncoming(result.blockIncoming);
        
        console.log("✅ Settings loaded:", result);
      } catch (error) {
        console.error("❌ Failed to load settings:", error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to chrome.storage whenever they change
  const saveSettings = async (newSettings) => {
    try {
      await chrome.storage.local.set(newSettings);
      console.log("✅ Settings saved:", newSettings);
    } catch (error) {
      console.error("❌ Failed to save settings:", error);
    }
  };

  const handleAutoStartToggle = async () => {
    const newState = !autoStartEnabled;
    setAutoStartEnabled(newState);
    
    // Save to persistent storage
    await saveSettings({ autoStartEnabled: newState });

    // Send message to background script to update auto-start behavior
    try {
      await chrome.runtime.sendMessage({
        type: "set-auto-start",
        enabled: newState,
      });
      console.log("✅ Auto-start setting updated:", newState);
    } catch (error) {
      console.error("❌ Failed to update auto-start setting:", error);
    }
  };

  const handleBlockOutgoingToggle = async () => {
    const newState = !blockOutgoing;
    setBlockOutgoing(newState);
    
    // Save to persistent storage
    await saveSettings({ blockOutgoing: newState });

    // Send message to background script
    chrome.runtime
      .sendMessage({
        type: "block-outgoing",
        enabled: newState,
      })
      .catch((error) => {
        console.error("❌ Failed to toggle outgoing block:", error);
      });
  };

  const handleBlockIncomingToggle = async () => {
    const newState = !blockIncoming;
    setBlockIncoming(newState);
    
    // Save to persistent storage
    await saveSettings({ blockIncoming: newState });

    // Send message to background script
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
        {/* Left column: Monitor control */}
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
              
              <div className="switch-item">
                <span className="switch-label">Auto-start on new pages</span>
                <button 
                  className={`switch-btn ${autoStartEnabled ? 'on' : 'off'}`}
                  onClick={handleAutoStartToggle}
                  title={
                    autoStartEnabled
                      ? "Automatically start monitoring on new pages"
                      : "Manually start monitoring on new pages"
                  }
                >
                  <span className="switch-indicator">
                    {autoStartEnabled ? '●○' : '○●'}
                  </span>
                  <span className="switch-text">
                    {autoStartEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Message control */}
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
