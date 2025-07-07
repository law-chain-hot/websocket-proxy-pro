import React, { useState } from "react";
import { Switch, Group, Stack, Text, Card, Box } from "@mantine/core";
import { Activity, Shield } from "lucide-react";

const ControlPanel = ({
  isMonitoring,
  onStartMonitoring,
  onStopMonitoring,
}) => {
  const [blockOutgoing, setBlockOutgoing] = useState(false);
  const [blockIncoming, setBlockIncoming] = useState(false);

  const handleMonitoringToggle = () => {
    if (isMonitoring) {
      onStopMonitoring();
    } else {
      onStartMonitoring();
    }
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "16px" }}>
      <Stack gap="md">
        {/* Monitor Card */}
        <Card
          radius="xl"
          withBorder
          style={{
            background:
              "linear-gradient(135deg, rgba(55, 58, 64, 0.4) 0%, rgba(55, 58, 64, 0.2) 100%)",
            borderColor: "rgba(55, 58, 64, 0.5)",
            padding: "12px",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
          }}
        >
          <Stack gap="6px">
            {/* Header */}
            <Group justify="space-between" align="center">
              <Group align="center" gap="8px">
                <Box
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    background: "rgba(59, 130, 246, 0.2)",
                    border: "1px solid rgba(96, 165, 250, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Activity size={12} color="rgb(96, 165, 250)" />
                </Box>
                <Text size="sm" fw={600} c="rgb(229, 231, 235)">
                  Monitor
                </Text>
              </Group>
              <Switch
                checked={isMonitoring}
                onChange={handleMonitoringToggle}
                size="sm"
                color="green"
                styles={{
                  track: { cursor: "pointer" },
                  thumb: { cursor: "pointer" },
                }}
              />
            </Group>

            {/* Status */}
            <Group align="center" gap="8px">
              <Box
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isMonitoring
                    ? "rgb(74, 222, 128)"
                    : "rgb(107, 114, 128)",
                  animation: isMonitoring ? "pulse 2s infinite" : "none",
                }}
              />
              <Text size="xs" c="rgb(156, 163, 175)">
                {isMonitoring ? "Active" : "Inactive"}
              </Text>
            </Group>
          </Stack>
        </Card>
        {/* Message Control Card */}
        <Card
          radius="xl"
          withBorder
          style={{
            background:
              "linear-gradient(135deg, rgba(55, 58, 64, 0.4) 0%, rgba(55, 58, 64, 0.2) 100%)",
            borderColor: "rgba(55, 58, 64, 0.5)",
            padding: "12px",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
          }}
        >
          <Stack gap="12px">
            {/* Header */}
            <Group align="center" gap="8px">
              <Box
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  background: "rgba(249, 115, 22, 0.2)",
                  border: "1px solid rgba(251, 146, 60, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={12} color="rgb(251, 146, 60)" />
              </Box>
              <Text size="sm" fw={600} c="rgb(229, 231, 235)">
                Message Control
              </Text>
            </Group>

            {/* Block Options */}
            <Stack gap="8px">
              {/* Block Outgoing */}
              <Group
                justify="space-between"
                align="center"
                style={{ padding: "4px 0" }}
              >
                <Group align="center" gap="8px">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: blockOutgoing
                        ? "rgb(248, 113, 113)"
                        : "rgb(107, 114, 128)",
                    }}
                  />
                  <Text size="xs" c="rgb(209, 213, 219)">
                    Block Outgoing
                  </Text>
                </Group>
                <Switch
                  checked={blockOutgoing}
                  onChange={(event) => {
                    const newState = event.currentTarget.checked;
                    setBlockOutgoing(newState);

                    chrome.runtime
                      .sendMessage({
                        type: "block-outgoing",
                        enabled: newState,
                      })
                      .catch((error) => {
                        console.error(
                          "❌ Failed to toggle outgoing block:",
                          error
                        );
                      });
                  }}
                  size="xs"
                  color="red"
                  styles={{
                    track: { cursor: "pointer" },
                    thumb: { cursor: "pointer" },
                  }}
                  withThumbIndicator={false}
                />
              </Group>

              {/* Block Incoming */}
              <Group
                justify="space-between"
                align="center"
                style={{ padding: "4px 0" }}
              >
                <Group align="center" gap="8px">
                  <Box
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: blockIncoming
                        ? "rgb(248, 113, 113)"
                        : "rgb(107, 114, 128)",
                    }}
                  />
                  <Text size="xs" c="rgb(209, 213, 219)">
                    Block Incoming
                  </Text>
                </Group>
                <Switch
                  checked={blockIncoming}
                  onChange={(event) => {
                    const newState = event.currentTarget.checked;
                    setBlockIncoming(newState);

                    chrome.runtime
                      .sendMessage({
                        type: "block-incoming",
                        enabled: newState,
                      })
                      .catch((error) => {
                        console.error(
                          "❌ Failed to toggle incoming block:",
                          error
                        );
                      });
                  }}
                  size="xs"
                  color="red"
                  styles={{
                    track: { cursor: "pointer" },
                    thumb: { cursor: "pointer" },
                  }}
                  withThumbIndicator={false}
                />
              </Group>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
};

export default ControlPanel;
