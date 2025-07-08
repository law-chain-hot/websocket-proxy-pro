import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Button,
  TextInput,
  ActionIcon,
  Group,
  Text,
  Badge,
} from "@mantine/core";
import {
  Star,
  Trash2,
  Edit,
  Copy,
  Search,
  X,
  Plus,
  Download,
  Send,
  Check,
} from "lucide-react";
import JsonViewer from "./JsonViewer";
import favoritesService from "../utils/favoritesService";
import "../styles/FavoritesTab.css";

// 优化的FavoritesItem组件，使用React.memo避免不必要的重新渲染
const FavoritesItem = React.memo(
  ({
    favorite,
    onSend,
    onReceive,
    onEdit,
    onDelete,
    onCopy,
    isSelected,
    onSelect,
    isEditing,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [editName, setEditName] = useState(favorite.name);
    const [editData, setEditData] = useState(favorite.data);
    const nameInputRef = useRef(null);

    // 缓存格式化的日期，避免每次渲染都计算
    const formattedDate = useMemo(() => {
      const dateString = favorite.updatedAt || favorite.createdAt;
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }, [favorite.updatedAt, favorite.createdAt]);

    // 缓存预览文本，避免每次渲染都解析JSON
    const preview = useMemo(() => {
      try {
        const parsed = JSON.parse(favorite.data);
        if (typeof parsed === "object" && parsed !== null) {
          const keys = Object.keys(parsed);
          if (keys.length > 0) {
            return `{ ${keys.slice(0, 3).join(", ")}${
              keys.length > 3 ? "..." : ""
            } }`;
          }
        }
        return (
          favorite.data.substring(0, 50) +
          (favorite.data.length > 50 ? "..." : "")
        );
      } catch {
        return (
          favorite.data.substring(0, 50) +
          (favorite.data.length > 50 ? "..." : "")
        );
      }
    }, [favorite.data]);

    // 优化：减少useCallback的依赖项，使用稳定的favorite.id
    const favoriteId = favorite.id;
    const favoriteData = favorite.data;

    const handleSaveEdit = useCallback(() => {
      onSaveEdit(favoriteId, {
        name: editName.trim(),
        data: editData.trim(),
      });
    }, [favoriteId, editName, editData, onSaveEdit]);

    const handleCancelEdit = useCallback(() => {
      setEditName(favorite.name);
      setEditData(favorite.data);
      onCancelEdit();
    }, [favorite.name, favorite.data, onCancelEdit]);

    const handleDataChange = useCallback((value) => {
      setEditData(value);
    }, []);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    const handleSelect = useCallback(
      () => onSelect(favorite),
      [favorite, onSelect]
    );

    const handleReceive = useCallback(
      (e) => {
        e.stopPropagation();
        onReceive(favorite);
      },
      [favorite, onReceive]
    );

    const handleSend = useCallback(
      (e) => {
        e.stopPropagation();
        onSend(favorite);
      },
      [favorite, onSend]
    );

    const handleCopy = useCallback(
      (e) => {
        e.stopPropagation();
        onCopy(favoriteData);
      },
      [favoriteData, onCopy]
    );

    const handleStartEdit = useCallback(
      (e) => {
        e.stopPropagation();
        onStartEdit(favoriteId);
      },
      [favoriteId, onStartEdit]
    );

    const handleDelete = useCallback(
      (e) => {
        e.stopPropagation();
        onDelete(favoriteId);
      },
      [favoriteId, onDelete]
    );

    // 当favorite发生变化时，更新编辑状态
    useEffect(() => {
      setEditName(favorite.name);
      setEditData(favorite.data);
    }, [favorite.name, favorite.data]);

    // 当进入编辑状态时，如果名字为空，自动focus到名字输入框
    useEffect(() => {
      if (isEditing && nameInputRef.current) {
        // 使用setTimeout确保DOM已经更新
        setTimeout(() => {
          nameInputRef.current?.focus();
          // 如果名字为空，选中全部文本
          if (!editName.trim()) {
            nameInputRef.current?.select();
          }
        }, 50);
      }
    }, [isEditing, editName]);

    return (
      <div
        className={`favorite-item ${isSelected ? "selected" : ""} ${
          isEditing ? "editing" : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="favorite-item-content">
          <div className="favorite-item-main">
            <div className="favorite-item-info">
              <div className="favorite-item-header">
                {isEditing ? (
                  <TextInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Message name..."
                    className="edit-title-input"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    ref={nameInputRef}
                  />
                ) : (
                  <h3
                    className="favorite-item-name clickable"
                    onClick={handleSelect}
                    title="Click to expand/collapse"
                  >
                    {favorite.name || "Unnamed Favorite"}
                  </h3>
                )}
                <span className="favorite-item-time">{formattedDate}</span>
                {favorite.tags && favorite.tags.length > 0 && (
                  <Badge
                    variant="light"
                    size="xs"
                    className="favorite-item-tag"
                  >
                    {favorite.tags[0]}
                  </Badge>
                )}
              </div>
              {!isEditing && (
                <div className="favorite-item-details">
                  <span className="favorite-item-preview">{preview}</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={`favorite-item-actions ${
              isHovered || isSelected || isEditing ? "visible" : ""
            }`}
          >
            {isEditing ? (
              <>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  className="action-btn cancel-btn"
                  onClick={handleCancelEdit}
                  title="Cancel"
                >
                  <X size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  className="action-btn save-btn"
                  onClick={handleSaveEdit}
                  disabled={!editName.trim() || !editData.trim()}
                  title="Save"
                >
                  <Check size={14} />
                </ActionIcon>
              </>
            ) : (
              <>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  className="action-btn receive-btn"
                  onClick={handleReceive}
                  title="Simulate Receive"
                >
                  <Download size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  className="action-btn send-btn"
                  onClick={handleSend}
                  title="Simulate Send"
                >
                  <Send size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  className="action-btn copy-btn"
                  onClick={handleCopy}
                  title="Copy Content"
                >
                  <Copy size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  className="action-btn edit-btn"
                  onClick={handleStartEdit}
                  title="Edit"
                >
                  <Edit size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  className="action-btn delete-btn"
                  onClick={handleDelete}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </ActionIcon>
              </>
            )}
          </div>
        </div>

        {/* 编辑模式下的数据编辑器 */}
        {isEditing && (
          <div className="favorite-item-editor">
            <JsonViewer
              data={editData}
              readOnly={false}
              onChange={handleDataChange}
              showControls={false}
              className="edit-data-editor"
            />
          </div>
        )}

        {/* 展开模式下的详细视图 */}
        {isSelected && !isEditing && (
          <div className="favorite-item-expanded">
            <JsonViewer
              data={favorite.data}
              readOnly={true}
              className="favorite-data-viewer"
              showControls={false}
            />
          </div>
        )}
      </div>
    );
  },
  // 优化：添加精确的比较函数，只有关键props变化时才重渲染
  (prevProps, nextProps) => {
    return (
      prevProps.favorite.id === nextProps.favorite.id &&
      prevProps.favorite.name === nextProps.favorite.name &&
      prevProps.favorite.data === nextProps.favorite.data &&
      prevProps.favorite.updatedAt === nextProps.favorite.updatedAt &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isEditing === nextProps.isEditing &&
      prevProps.onSend === nextProps.onSend &&
      prevProps.onReceive === nextProps.onReceive &&
      prevProps.onDelete === nextProps.onDelete &&
      prevProps.onCopy === nextProps.onCopy &&
      prevProps.onSelect === nextProps.onSelect &&
      prevProps.onStartEdit === nextProps.onStartEdit &&
      prevProps.onCancelEdit === nextProps.onCancelEdit &&
      prevProps.onSaveEdit === nextProps.onSaveEdit
    );
  }
);

const FavoritesTab = ({ onSendMessage, onReceiveMessage, onAddFavorite }) => {
  const [favorites, setFavorites] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedFavoriteId, setSelectedFavoriteId] = useState(null);
  const [editingFavoriteId, setEditingFavoriteId] = useState(null);

  // 优化：缓存稳定的事件处理函数，避免每次渲染都重新创建
  const stableHandlers = useMemo(() => {
    const handleDeleteFavorite = (id) => {
      const success = favoritesService.deleteFavorite(id);
      if (success) {
        if (selectedFavoriteId === id) {
          setSelectedFavoriteId(null);
        }
        if (editingFavoriteId === id) {
          setEditingFavoriteId(null);
        }
      }
    };

    const handleUseFavorite = (favorite, type) => {
      if (type === "send" && onSendMessage) {
        onSendMessage(favorite.data);
      } else if (type === "receive" && onReceiveMessage) {
        onReceiveMessage(favorite.data);
      }
    };

    const handleCopyFavorite = (data) => {
      navigator.clipboard.writeText(data);
    };

    const handleSelectFavorite = (favorite) => {
      if (editingFavoriteId) return; // 如果正在编辑，不允许切换选择
      setSelectedFavoriteId(
        selectedFavoriteId === favorite.id ? null : favorite.id
      );
    };

    const handleStartEdit = (id) => {
      setEditingFavoriteId(id);
      setSelectedFavoriteId(null);
    };

    const handleCancelEdit = () => {
      // 如果是新添加的项目且没有保存，则删除它
      const editingFavorite = favorites.find((f) => f.id === editingFavoriteId);
      if (
        editingFavorite &&
        editingFavorite.name === "New Favorite" &&
        editingFavorite.data === "{}"
      ) {
        handleDeleteFavorite(editingFavoriteId);
      }
      setEditingFavoriteId(null);
    };

    const handleSaveEdit = (id, updates) => {
      if (!updates.name.trim() || !updates.data.trim()) return;

      const success = favoritesService.updateFavorite(id, {
        name: updates.name,
        data: updates.data,
      });

      if (success) {
        setEditingFavoriteId(null);
      }
    };

    const sendHandler = (fav) => handleUseFavorite(fav, "send");
    const receiveHandler = (fav) => handleUseFavorite(fav, "receive");

    return {
      handleDeleteFavorite,
      handleUseFavorite,
      handleCopyFavorite,
      handleSelectFavorite,
      handleStartEdit,
      handleCancelEdit,
      handleSaveEdit,
      sendHandler,
      receiveHandler,
    };
  }, [
    onSendMessage,
    onReceiveMessage,
    selectedFavoriteId,
    editingFavoriteId,
    favorites,
  ]);

  // 从 favoritesService 加载收藏夹
  useEffect(() => {
    const loadedFavorites = favoritesService.getFavorites();
    setFavorites(loadedFavorites);

    // 监听收藏夹变化
    const unsubscribe = favoritesService.addListener(
      (newFavorites, eventData) => {
        console.log("⭐ FavoritesTab: Received favorites update:", {
          favoritesCount: newFavorites.length,
          eventType: eventData?.type,
          autoEdit: eventData?.autoEdit,
          favoriteId: eventData?.favorite?.id,
          favoriteName: eventData?.favorite?.name,
        });

        setFavorites(newFavorites);

        // 处理添加收藏事件
        if (eventData?.type === "add" && eventData?.autoEdit) {
          console.log(
            "⭐ FavoritesTab: Setting editing state for favorite:",
            eventData.favorite.id
          );
          setEditingFavoriteId(eventData.favorite.id);
          setSelectedFavoriteId(null);
        }
      }
    );

    return unsubscribe;
  }, []);

  // 监听外部添加收藏的事件
  useEffect(() => {
    if (onAddFavorite) {
      onAddFavorite((favoriteData) => {
        handleAddFavorite(favoriteData);
      });
    }
  }, [onAddFavorite]);

  // 使用useCallback优化事件处理函数
  const handleAddFavorite = useCallback((initialData = null) => {
    const newFavorite = favoritesService.addFavorite(initialData || {}, {
      autoEdit: true,
      switchToFavoritesTab: false, // 由外部控制切换
    });

    if (newFavorite) {
      setEditingFavoriteId(newFavorite.id);
      setSelectedFavoriteId(null);
    }
  }, []);

  const clearSearch = useCallback(() => setSearchText(""), []);

  // 优化：使用useMemo缓存过滤结果，并添加依赖项优化
  const filteredFavorites = useMemo(() => {
    if (!searchText.trim()) return favorites;
    const searchLower = searchText.toLowerCase();
    return favorites.filter(
      (favorite) =>
        favorite.name.toLowerCase().includes(searchLower) ||
        favorite.data.toLowerCase().includes(searchLower)
    );
  }, [favorites, searchText]);

  return (
    <div className="favorites-tab">
      {/* 搜索和添加控件 */}
      <div className="favorites-controls">
        <div className="search-container">
          <TextInput
            placeholder="Search favorites..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            leftSection={<Search size={16} />}
            rightSection={
              searchText && (
                <ActionIcon variant="subtle" size="sm" onClick={clearSearch}>
                  <X size={16} />
                </ActionIcon>
              )
            }
            className="search-input"
          />
        </div>
        <Button
          leftSection={<Plus size={16} />}
          onClick={() => handleAddFavorite()}
          className="add-favorite-btn"
        >
          Add Favorite
        </Button>
      </div>

      {/* 收藏列表 */}
      <div className="favorites-list">
        {filteredFavorites.length === 0 ? (
          <div className="empty-state">
            {searchText ? (
              <>
                <Search size={48} className="empty-icon" />
                <Text className="empty-text">
                  No favorites match your search
                </Text>
                <Text className="empty-description">
                  Try adjusting your search terms
                </Text>
              </>
            ) : (
              <>
                <Star size={48} className="empty-icon" />
                <Text className="empty-text">No favorites yet</Text>
                <Text className="empty-description">
                  Save your frequently used WebSocket messages for quick access
                </Text>
              </>
            )}
          </div>
        ) : (
          <div className="favorites-items">
            {filteredFavorites.map((favorite) => (
              <FavoritesItem
                key={favorite.id}
                favorite={favorite}
                onSend={stableHandlers.sendHandler}
                onReceive={stableHandlers.receiveHandler}
                onDelete={stableHandlers.handleDeleteFavorite}
                onCopy={stableHandlers.handleCopyFavorite}
                isSelected={selectedFavoriteId === favorite.id}
                onSelect={stableHandlers.handleSelectFavorite}
                isEditing={editingFavoriteId === favorite.id}
                onStartEdit={stableHandlers.handleStartEdit}
                onCancelEdit={stableHandlers.handleCancelEdit}
                onSaveEdit={stableHandlers.handleSaveEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesTab;
