/**
 * Electron Preload Script
 * 
 * 通过 contextBridge 暴露安全的 API 给渲染进程
 */

const { contextBridge, ipcRenderer } = require('electron');

// 暴露本地文件 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 检查是否在 Electron 环境中
  isElectron: () => ipcRenderer.invoke('local:is-electron'),

  // 选择本地文件
  selectFile: (options) => ipcRenderer.invoke('local:select-file', options),

  // 读取本地文件
  readFile: (filePath, options) => ipcRenderer.invoke('local:read-file', filePath, options),

  // 计算文件哈希
  hashFile: (filePath) => ipcRenderer.invoke('local:hash-file', filePath),

  // 获取缩略图
  getThumbnail: (filePath, timestamp) => ipcRenderer.invoke('local:get-thumbnail', filePath, timestamp),

  // 保存项目
  saveProject: (projectData, defaultPath) => ipcRenderer.invoke('local:save-project', projectData, defaultPath),

  // 打开项目
  openProject: () => ipcRenderer.invoke('local:open-project'),

  // 监听菜单事件
  onMenuNewProject: (callback) => {
    ipcRenderer.on('menu:new-project', callback);
    return () => ipcRenderer.removeListener('menu:new-project', callback);
  },

  onMenuOpenProject: (callback) => {
    ipcRenderer.on('menu:open-project', (event, filePath) => callback(filePath));
    return () => ipcRenderer.removeListener('menu:open-project', callback);
  },

  onMenuSaveProject: (callback) => {
    ipcRenderer.on('menu:save-project', callback);
    return () => ipcRenderer.removeListener('menu:save-project', callback);
  },

  onMenuExportProject: (callback) => {
    ipcRenderer.on('menu:export-project', callback);
    return () => ipcRenderer.removeListener('menu:export-project', callback);
  },
});

// 暴露平台信息
contextBridge.exposeInMainWorld('platform', {
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
  version: process.versions.electron,
});
