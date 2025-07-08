import favoritesService from "./favoritesService";

// 全局收藏功能
class GlobalFavorites {
  constructor() {
    this.tabSwitchCallbacks = new Set();
  }

  // 添加tab切换回调
  addTabSwitchCallback(callback) {
    this.tabSwitchCallbacks.add(callback);
    return () => this.tabSwitchCallbacks.delete(callback);
  }

  // 通知所有tab切换回调
  notifyTabSwitch() {
    this.tabSwitchCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error in tab switch callback:", error);
      }
    });
  }

  // 快速添加收藏 (用于从编辑器添加)
  quickAdd(messageData, options = {}) {
    console.log("🌟 GlobalFavorites: quickAdd called with options:", options);

    const defaultOptions = {
      switchToFavoritesTab: true,
      generateName: true,
      autoEdit: true,
      showNotification: true,
    };

    const finalOptions = { ...defaultOptions, ...options };
    console.log("🌟 GlobalFavorites: final options:", finalOptions);

    // 决定名称
    let name = "";
    if (finalOptions.generateName) {
      // 改为默认不生成名字，让用户自己填写
      name = "";
      console.log("🌟 GlobalFavorites: using empty name for user to fill");
    } else {
      name = ""; // 空名字，用户需要填写
      console.log("🌟 GlobalFavorites: using empty name");
    }

    console.log(
      "🌟 GlobalFavorites: calling favoritesService.addFavorite with name:",
      name
    );
    const newFavorite = favoritesService.addFavorite(
      {
        name,
        data: messageData,
      },
      finalOptions
    );

    if (newFavorite) {
      if (finalOptions.switchToFavoritesTab) {
        this.notifyTabSwitch();
      }

      if (finalOptions.showNotification) {
        console.log(`✅ Added to favorites: ${newFavorite.name || "Unnamed"}`);
      }
    }

    return newFavorite;
  }

  // 从消息列表添加收藏 (不自动切换tab，不自动编辑)
  addFromMessageList(messageData, options = {}) {
    const defaultOptions = {
      switchToFavoritesTab: false,
      generateName: true,
      autoEdit: false,
      showNotification: true,
    };

    return this.quickAdd(messageData, { ...defaultOptions, ...options });
  }

  // 从编辑器添加收藏 (自动切换tab，自动编辑)
  addFromEditor(messageData, options = {}) {
    console.log(
      "🌟 GlobalFavorites: addFromEditor called with options:",
      options
    );

    const defaultOptions = {
      switchToFavoritesTab: true,
      generateName: true,
      autoEdit: true,
      showNotification: true,
    };

    const mergedOptions = { ...defaultOptions, ...options };
    console.log("🌟 GlobalFavorites: merged options:", mergedOptions);

    return this.quickAdd(messageData, mergedOptions);
  }

  // 静默添加收藏 (不切换tab，不编辑，不显示通知)
  addSilently(messageData, options = {}) {
    const defaultOptions = {
      switchToFavoritesTab: false,
      generateName: true,
      autoEdit: false,
      showNotification: false,
    };

    return this.quickAdd(messageData, { ...defaultOptions, ...options });
  }

  // 获取所有收藏
  getAll() {
    return favoritesService.getFavorites();
  }

  // 删除收藏
  delete(id) {
    return favoritesService.deleteFavorite(id);
  }

  // 更新收藏
  update(id, updates) {
    return favoritesService.updateFavorite(id, updates);
  }

  // 添加监听器
  addListener(listener) {
    return favoritesService.addListener(listener);
  }
}

// 创建全局实例
const globalFavorites = new GlobalFavorites();

// 导出单例和类
export default globalFavorites;
export { GlobalFavorites };

// 为了向后兼容，也导出一些快捷方法
export const quickAddFavorite = (messageData, options) =>
  globalFavorites.quickAdd(messageData, options);
export const addFromMessageList = (messageData, options) =>
  globalFavorites.addFromMessageList(messageData, options);
export const addFromEditor = (messageData, options) =>
  globalFavorites.addFromEditor(messageData, options);
export const addSilently = (messageData, options) =>
  globalFavorites.addSilently(messageData, options);
