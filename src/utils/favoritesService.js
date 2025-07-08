// Favorites service for managing WebSocket message favorites
class FavoritesService {
  constructor() {
    this.storageKey = "websocket-favorites";
    this.listeners = new Set();
    this.notificationTimeoutId = null;
    // 新增：批量更新防抖，减少频繁触发
    this.batchUpdateTimeoutId = null;
    this.pendingUpdates = [];
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
      name = "",
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
      // 优化：使用更长的防抖延迟，减少频繁通知
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

  // 优化：增加防抖延迟，减少频繁通知
  debouncedNotify(favorites, eventData = {}) {
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
    }

    this.notificationTimeoutId = setTimeout(() => {
      this.notifyListeners(favorites, eventData);
    }, 100); // 增加到100ms防抖，减少频繁通知
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

    // 生成收藏名称
    let favoriteName = "";
    if (generateName) {
      favoriteName = this.generateFavoriteName(messageData);
    }

    return this.addFavorite(
      {
        name: favoriteName,
        data: messageData,
      },
      {
        switchToFavoritesTab,
        ...otherOptions,
      }
    );
  }

  // 生成收藏名称
  generateFavoriteName(messageData) {
    try {
      const parsed = JSON.parse(messageData);

      // 尝试从常见字段生成名称
      if (parsed.type) {
        return `${parsed.type} Message`;
      }
      if (parsed.action) {
        return `${parsed.action} Action`;
      }
      if (parsed.event) {
        return `${parsed.event} Event`;
      }
      if (parsed.command) {
        return `${parsed.command} Command`;
      }
      if (parsed.message) {
        const msg = String(parsed.message).substring(0, 20);
        return `Message: ${msg}${msg.length >= 20 ? "..." : ""}`;
      }

      // 使用第一个属性名
      const keys = Object.keys(parsed);
      if (keys.length > 0) {
        return `${keys[0]} Data`;
      }
    } catch (error) {
      // 如果不是JSON，使用文本内容的前20个字符
      const text = String(messageData).substring(0, 20).trim();
      if (text) {
        return `Message: ${text}${messageData.length > 20 ? "..." : ""}`;
      }
    }

    return "WebSocket Message";
  }

  // 清理资源
  cleanup() {
    if (this.notificationTimeoutId) {
      clearTimeout(this.notificationTimeoutId);
    }
    if (this.batchUpdateTimeoutId) {
      clearTimeout(this.batchUpdateTimeoutId);
    }
    this.listeners.clear();
  }
}

// 创建单例
const favoritesService = new FavoritesService();

export default favoritesService;
