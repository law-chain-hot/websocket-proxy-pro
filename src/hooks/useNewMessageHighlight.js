import { useState, useEffect, useRef } from "react";

/**
 * Custom hook to manage new message highlighting animation
 * @param {Object} connection - Connection object containing messages
 * @param {number} highlightDuration - Duration of highlight animation in ms (default: 500)
 * @returns {Object} Object containing isNewMessage function and cleanup
 */
export const useNewMessageHighlight = (connection, highlightDuration = 500) => {
  const [newMessageKeys, setNewMessageKeys] = useState(new Set());
  const previousMessageCountRef = useRef(0);
  const messageTimestampsRef = useRef(new Set());

  // Effect to detect new messages and trigger highlight animation
  useEffect(() => {
    if (!connection || !connection.messages) return;
    
    const currentMessages = connection.messages;
    const currentMessageCount = currentMessages.length;
    
    // Check if we have new messages (count increased)
    if (currentMessageCount > previousMessageCountRef.current) {
      // Find new messages by comparing timestamps
      const newMessages = currentMessages.filter(msg => 
        !messageTimestampsRef.current.has(msg.timestamp)
      );
      
      // Add new message keys to highlight set
      const newKeys = new Set(newMessageKeys);
      newMessages.forEach(msg => {
        const messageKey = `${msg.timestamp}-${msg.direction}`;
        newKeys.add(messageKey);
        messageTimestampsRef.current.add(msg.timestamp);
        
        // Remove highlight after specified duration
        setTimeout(() => {
          setNewMessageKeys(prev => {
            const updated = new Set(prev);
            updated.delete(messageKey);
            return updated;
          });
        }, highlightDuration);
      });
      
      if (newKeys.size > newMessageKeys.size) {
        setNewMessageKeys(newKeys);
      }
    }
    
    // Update refs
    previousMessageCountRef.current = currentMessageCount;
    
    // Update timestamp tracking set
    currentMessages.forEach(msg => {
      messageTimestampsRef.current.add(msg.timestamp);
    });
  }, [connection?.messages, newMessageKeys, highlightDuration]);

  // Function to check if a message is new
  const isNewMessage = (messageKey) => {
    return newMessageKeys.has(messageKey);
  };

  // Clear all highlights (useful for cleanup)
  const clearHighlights = () => {
    setNewMessageKeys(new Set());
  };

  return {
    isNewMessage,
    clearHighlights,
    newMessageCount: newMessageKeys.size
  };
};

export default useNewMessageHighlight; 