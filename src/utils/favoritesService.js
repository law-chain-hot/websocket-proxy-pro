// Favorites service for managing WebSocket message favorites
class FavoritesService {
  constructor() {
    this.storageKey = "websocket-favorites";
    this.listeners = new Set();
    this.notificationTimeoutId = null;
  }

  // 获取所有收藏
  getFavorites() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to load favorites:", error);
      return [];
    }
  }

  // 保存收藏到 localStorage
  saveFavorites(favorites) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
      this.notifyListeners(favorites);
      return true;
    } catch (error) {
      console.error("Failed to save favorites:", error);
      return false;
    }
  }

  // 添加新收藏
  addFavorite(favoriteData, options = {}) {
    const {
      name = "New Favorite",
      data = "{}",
      tags = [],
      autoEdit = true,
      switchToFavoritesTab = true,
    } = { ...favoriteData, ...options };

    console.log("⭐ FavoritesService: Adding favorite with options:", {
      name,
      dataLength: data.length,
      autoEdit,
      switchToFavoritesTab,
    });

    // 验证数据
    if (!data || !data.trim()) {
      console.warn("Cannot add favorite: data is empty");
      return null;
    }

    const newFavorite = {
      id: Date.now().toString(),
      name: name.trim(),
      data: data.trim(),
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("⭐ FavoritesService: Created favorite object:", {
      id: newFavorite.id,
      name: newFavorite.name,
      nameLength: newFavorite.name.length,
    });

    const currentFavorites = this.getFavorites();
    const newFavorites = [newFavorite, ...currentFavorites];

    if (this.saveFavorites(newFavorites)) {
      // 防抖通知，避免频繁触发
      console.log(
        "⭐ FavoritesService: Notifying listeners with autoEdit:",
        autoEdit
      );
      this.debouncedNotify(newFavorites, {
        type: "add",
        favorite: newFavorite,
        autoEdit,
        switchToFavoritesTab,
      });

      return newFavorite;
    }

    return null;
  }

  // 更新收藏
  updateFavorite(id, updates) {
    const favorites = this.getFavorites();
    const favoriteIndex = favorites.findIndex((fav) => fav.id === id);

    if (favoriteIndex === -1) {
      console.warn("Favorite not found:", id);
      return null;
    }

    const updatedFavorites = [...favorites];
    updatedFavorites[favoriteIndex] = {
      ...updatedFavorites[favoriteIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (this.saveFavorites(updatedFavorites)) {
      const updatedFavorite = updatedFavorites[favoriteIndex];
      this.debouncedNotify(updatedFavorites, {
        type: "update",
        favorite: updatedFavorite,
      });
      return updatedFavorite;
    }

    return null;
  }

  // 删除收藏
  deleteFavorite(id) {
    const favorites = this.getFavorites();
    const favoriteToDelete = favorites.find((f) => f.id === id);

    if (!favoriteToDelete) {
      console.warn("Favorite not found:", id);
      return false;
    }

    const newFavorites = favorites.filter((fav) => fav.id !== id);

    if (this.saveFavorites(newFavorites)) {
      this.debouncedNotify(newFavorites, {
        type: "delete",
        favorite: favoriteToDelete,
      });
      return true;
    }

    return false;
  }

  // 根据内容查找是否已存在相似收藏
  findSimilarFavorite(data) {
    const favorites = this.getFavorites();
    const normalizedData = data.trim();
    return favorites.find((fav) => fav.data.trim() === normalizedData);
  }

  // 添加监听器
  addListener(listener) {
    if (typeof listener !== "function") {
      console.warn("Listener must be a function");
      return () => {};
    }

    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 防抖通知所有监听器
  debouncedNotify(favorites, eventData = {}) {
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
    }

    this.notificationTimeoutId = setTimeout(() => {
      this.notifyListeners(favorites, eventData);
    }, 50); // 50ms 防抖
  }

  // 通知所有监听器
  notifyListeners(favorites, eventData = {}) {
    if (this.listeners.size === 0) return;

    this.listeners.forEach((listener) => {
      try {
        listener(favorites, eventData);
      } catch (error) {
        console.error("Error in favorites listener:", error);
      }
    });
  }

  // 快速添加收藏的便捷方法
  quickAddFavorite(messageData, options = {}) {
    const {
      switchToFavoritesTab = true,
      generateName = true,
      ...otherOptions
    } = options;

    // 检查是否已存在相似收藏
    const existingFavorite = this.findSimilarFavorite(messageData);
    if (existingFavorite) {
      console.log("Similar favorite already exists:", existingFavorite.name);
      return existingFavorite;
    }

    // 自动生成名称
    let name = "New Favorite";
    if (generateName) {
      name = this.generateFavoriteName(messageData);
    }

    return this.addFavorite(
      {
        name,
        data: messageData,
      },
      {
        switchToFavoritesTab,
        ...otherOptions,
      }
    );
  }

  // 生成收藏名称的辅助方法
  generateFavoriteName(messageData) {
    try {
      const parsed = JSON.parse(messageData);
      if (typeof parsed === "object" && parsed !== null) {
        // 尝试从对象中提取有意义的名称
        const keys = Object.keys(parsed);
        if (keys.includes("type") && parsed.type) {
          return `${parsed.type} Message`;
        } else if (keys.includes("action") && parsed.action) {
          return `${parsed.action} Action`;
        } else if (keys.includes("event") && parsed.event) {
          return `${parsed.event} Event`;
        } else if (keys.includes("method") && parsed.method) {
          return `${parsed.method} Method`;
        } else if (keys.includes("command") && parsed.command) {
          return `${parsed.command} Command`;
        } else if (keys.length > 0) {
          return `${keys[0]} Message`;
        }
      }
    } catch {
      // 如果不是JSON，使用前几个字符作为名称
      const preview = messageData.substring(0, 30);
      return preview.length < messageData.length ? `${preview}...` : preview;
    }
    return "New Favorite";
  }

  // 清理方法，用于组件卸载时调用
  cleanup() {
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
      this.notificationTimeoutId = null;
    }
    this.listeners.clear();
  }
}

// 创建单例实例
const favoritesService = new FavoritesService();

export default favoritesService;
