import React, { useState, useEffect } from "react";

const FavoriteMessages = ({ connection, onSimulateMessage, onClose }) => {
  const [favoriteMessages, setFavoriteMessages] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");

  // Load favorite messages from storage on mount
  useEffect(() => {
    const loadFavoriteMessages = async () => {
      try {
        const result = await chrome.storage.local.get({
          favoriteMessages: [],
        });
        setFavoriteMessages(result.favoriteMessages || []);
      } catch (error) {
        console.error("❌ Failed to load favorite messages:", error);
      }
    };

    loadFavoriteMessages();
  }, []);

  // Save favorite messages to storage
  const saveFavoriteMessages = async (messages) => {
    try {
      await chrome.storage.local.set({ favoriteMessages: messages });
    } catch (error) {
      console.error("❌ Failed to save favorite messages:", error);
    }
  };

  const addFavorite = async () => {
    if (!newMessage.trim()) return;

    const title = newTitle.trim() || `Message ${favoriteMessages.length + 1}`;
    const newFavorite = {
      id: Date.now(),
      title,
      message: newMessage.trim(),
      createdAt: Date.now(),
    };

    const updatedMessages = [...favoriteMessages, newFavorite];
    setFavoriteMessages(updatedMessages);
    await saveFavoriteMessages(updatedMessages);

    // Reset form
    setNewMessage("");
    setNewTitle("");
    setIsAddingNew(false);
  };

  const deleteFavorite = async (id) => {
    const updatedMessages = favoriteMessages.filter(msg => msg.id !== id);
    setFavoriteMessages(updatedMessages);
    await saveFavoriteMessages(updatedMessages);
  };

  const sendFavorite = async (message) => {
    if (!connection || !onSimulateMessage) return;

    try {
      await onSimulateMessage({
        connectionId: connection.id,
        message: message,
        direction: "outgoing",
      });
      console.log("✅ Favorite message sent:", message);
    } catch (error) {
      console.error("❌ Failed to send favorite message:", error);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="favorite-messages-overlay">
      <div className="favorite-messages-panel">
        <div className="favorite-header">
          <h3>⭐ Favorite Messages</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="favorite-content">
          {/* Add new button */}
          {!isAddingNew && (
            <div className="add-section">
              <button 
                className="add-new-btn"
                onClick={() => setIsAddingNew(true)}
              >
                ➕ Add New Favorite
              </button>
            </div>
          )}

          {/* Add new form */}
          {isAddingNew && (
            <div className="add-form">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title (optional)"
                className="title-input"
              />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="message-input"
                rows={3}
                autoFocus
              />
              <div className="form-actions">
                <button 
                  className="save-btn"
                  onClick={addFavorite}
                  disabled={!newMessage.trim()}
                >
                  💾 Save
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewMessage("");
                    setNewTitle("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Favorites list */}
          <div className="favorites-list">
            {favoriteMessages.length === 0 ? (
              <div className="empty-message">
                <p>No favorite messages yet.</p>
                <p>Add one to get started!</p>
              </div>
            ) : (
              favoriteMessages.map((favorite) => (
                <div key={favorite.id} className="favorite-item">
                  <div className="favorite-info">
                    <div className="favorite-title">{favorite.title}</div>
                    <div className="favorite-preview">
                      {favorite.message.length > 100 
                        ? favorite.message.substring(0, 100) + "..." 
                        : favorite.message
                      }
                    </div>
                    <div className="favorite-date">{formatDate(favorite.createdAt)}</div>
                  </div>
                  
                  <div className="favorite-actions">
                    <button
                      className="send-btn"
                      onClick={() => sendFavorite(favorite.message)}
                      disabled={!connection}
                      title="Send this message"
                    >
                      🚀
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteFavorite(favorite.id)}
                      title="Delete this message"
                    >
                      �️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoriteMessages;