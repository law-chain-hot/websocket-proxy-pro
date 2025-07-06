import React, { useState, useEffect } from "react";

const FavoriteMessages = ({ connection, onSimulateMessage, onClose }) => {
  const [favoriteMessages, setFavoriteMessages] = useState([]);
  const [newFavoriteTitle, setNewFavoriteTitle] = useState("");
  const [newFavoriteMessage, setNewFavoriteMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingMessage, setEditingMessage] = useState("");

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

  const addFavoriteMessage = async () => {
    if (!newFavoriteTitle.trim() || !newFavoriteMessage.trim()) return;

    const newFavorite = {
      id: Date.now(),
      title: newFavoriteTitle.trim(),
      message: newFavoriteMessage.trim(),
      createdAt: Date.now(),
    };

    const updatedMessages = [...favoriteMessages, newFavorite];
    setFavoriteMessages(updatedMessages);
    await saveFavoriteMessages(updatedMessages);

    setNewFavoriteTitle("");
    setNewFavoriteMessage("");
  };

  const deleteFavoriteMessage = async (id) => {
    const updatedMessages = favoriteMessages.filter(msg => msg.id !== id);
    setFavoriteMessages(updatedMessages);
    await saveFavoriteMessages(updatedMessages);
  };

  const startEditing = (favorite) => {
    setEditingId(favorite.id);
    setEditingTitle(favorite.title);
    setEditingMessage(favorite.message);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingMessage("");
  };

  const saveEditing = async () => {
    if (!editingTitle.trim() || !editingMessage.trim()) return;

    const updatedMessages = favoriteMessages.map(msg =>
      msg.id === editingId
        ? { ...msg, title: editingTitle.trim(), message: editingMessage.trim() }
        : msg
    );

    setFavoriteMessages(updatedMessages);
    await saveFavoriteMessages(updatedMessages);
    cancelEditing();
  };

  const sendFavoriteMessage = async (message) => {
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="favorite-messages-panel">
      <div className="favorite-messages-header">
        <h3>⭐ Favorite Messages</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="favorite-messages-content">
        {/* Add new favorite message form */}
        <div className="add-favorite-form">
          <h4>➕ Add New Favorite</h4>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={newFavoriteTitle}
              onChange={(e) => setNewFavoriteTitle(e.target.value)}
              placeholder="Enter message title"
              maxLength={50}
            />
          </div>
          <div className="form-group">
            <label>Message:</label>
            <textarea
              value={newFavoriteMessage}
              onChange={(e) => setNewFavoriteMessage(e.target.value)}
              placeholder="Enter message content"
              rows={3}
            />
          </div>
          <button
            className="add-favorite-btn"
            onClick={addFavoriteMessage}
            disabled={!newFavoriteTitle.trim() || !newFavoriteMessage.trim()}
          >
            ➕ Add Favorite
          </button>
        </div>

        {/* Favorite messages list */}
        <div className="favorite-messages-list">
          <h4>📋 Saved Favorites ({favoriteMessages.length})</h4>
          {favoriteMessages.length === 0 ? (
            <div className="empty-state">
              <p>No favorite messages yet. Add one above!</p>
            </div>
          ) : (
            <div className="favorites-grid">
              {favoriteMessages.map((favorite) => (
                <div key={favorite.id} className="favorite-message-card">
                  {editingId === favorite.id ? (
                    // Edit mode
                    <div className="edit-mode">
                      <div className="form-group">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Title"
                          maxLength={50}
                        />
                      </div>
                      <div className="form-group">
                        <textarea
                          value={editingMessage}
                          onChange={(e) => setEditingMessage(e.target.value)}
                          placeholder="Message"
                          rows={3}
                        />
                      </div>
                      <div className="edit-actions">
                        <button
                          className="save-btn"
                          onClick={saveEditing}
                          disabled={!editingTitle.trim() || !editingMessage.trim()}
                        >
                          ✓ Save
                        </button>
                        <button className="cancel-btn" onClick={cancelEditing}>
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div className="display-mode">
                      <div className="favorite-header">
                        <h5 className="favorite-title">{favorite.title}</h5>
                        <div className="favorite-actions">
                          <button
                            className="action-btn edit"
                            onClick={() => startEditing(favorite)}
                            title="Edit message"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => deleteFavoriteMessage(favorite.id)}
                            title="Delete message"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="favorite-message">
                        <pre>{favorite.message}</pre>
                      </div>
                      <div className="favorite-footer">
                        <span className="favorite-date">
                          {formatTimestamp(favorite.createdAt)}
                        </span>
                        <button
                          className="send-btn"
                          onClick={() => sendFavoriteMessage(favorite.message)}
                          disabled={!connection}
                          title="Send this message"
                        >
                          🚀 Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoriteMessages;