/**
 * Electron 主进程
 * 
 * 职责：
 * 1. 创建浏览器窗口
 * 2. 提供本地文件访问 API
 * 3. 管理应用生命周期
 * 4. 连接在线 API 服务
 */

const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 判断是否是开发模式
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 读取桌面版配置
function loadDesktopConfig() {
  try {
    // 生产模式：从应用目录读取配置
    const configPath = isDev 
      ? path.join(__dirname, 'desktop-config.json')
      : path.join(process.resourcesPath, 'desktop-config.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log('[Electron] 加载配置:', config);
      return config;
    }
  } catch (error) {
    console.error('[Electron] 加载配置失败:', error);
  }
  
  // 默认配置（需要用户修改）
  return {
    apiUrl: process.env.ELECTRON_API_URL || '',
    webUrl: process.env.ELECTRON_WEB_URL || '',
  };
}

const desktopConfig = loadDesktopConfig();

// 主窗口引用
let mainWindow = null;

/**
 * 创建主窗口
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: '互动故事编辑器',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: true,
    show: false, // 先隐藏，等 ready-to-show
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 加载应用
  if (isDev) {
    // 开发模式：加载 Next.js 开发服务器
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：直接加载在线版（保持功能完整）
    // 桌面版通过 electronAPI 访问本地文件，其他功能与在线版相同
    const onlineUrl = desktopConfig.webUrl || 'https://your-app.com';
    console.log('[Electron] 加载在线版:', onlineUrl);
    mainWindow.loadURL(onlineUrl);
  }

  // 创建菜单
  createMenu();
}

/**
 * 创建应用菜单
 */
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建项目',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu:new-project');
          },
        },
        {
          label: '打开项目',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [{ name: '互动故事', extensions: ['story.json'] }],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('menu:open-project', result.filePaths[0]);
            }
          },
        },
        {
          label: '保存项目',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu:save-project');
          },
        },
        { type: 'separator' },
        {
          label: '导出项目',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu:export-project');
          },
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'forceReload', label: '强制刷新' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: '互动故事编辑器',
              detail: '版本: 1.0.0\n一款用于创建互动故事的编辑器',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================
// IPC 处理程序 - 本地文件访问
// ============================================

/**
 * 选择本地文件
 */
ipcMain.handle('local:select-file', async (event, options) => {
  const { filters, multiple } = options || {};
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: filters || [
      { name: '视频', extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'] },
      { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
      { name: '音频', extensions: ['mp3', 'wav', 'ogg', 'aac'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });

  if (result.canceled) {
    return { canceled: true, files: [] };
  }

  // 返回文件信息
  const files = result.filePaths.map(filePath => {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      path: filePath,
      name: fileName,
      size: stats.size,
      ext,
      type: getMediaType(ext),
    };
  });

  return { canceled: false, files };
});

/**
 * 读取本地文件（返回 base64 或文件 URL）
 */
ipcMain.handle('local:read-file', async (event, filePath, options) => {
  const { asUrl, maxSize } = options || {};
  
  try {
    const stats = fs.statSync(filePath);
    
    // 检查文件大小
    const maxFileSize = maxSize || 500 * 1024 * 1024; // 默认 500MB
    if (stats.size > maxFileSize) {
      return {
        success: false,
        error: `文件过大，超过 ${(maxFileSize / 1024 / 1024).toFixed(0)}MB 限制`,
      };
    }

    if (asUrl) {
      // 返回本地文件 URL（file:// 协议）
      return {
        success: true,
        url: `file://${filePath}`,
        name: path.basename(filePath),
        size: stats.size,
      };
    } else {
      // 返回 base64（小文件用）
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = getMimeType(ext);
      
      return {
        success: true,
        data: `data:${mimeType};base64,${base64}`,
        name: path.basename(filePath),
        size: stats.size,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 计算文件哈希（用于秒传检测）
 */
ipcMain.handle('local:hash-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    
    return {
      success: true,
      hash,
      size: buffer.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 获取文件缩略图（视频/图片）
 */
ipcMain.handle('local:get-thumbnail', async (event, filePath, timestamp) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    // 对于图片，直接返回
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const mimeType = getMimeType(ext);
      
      return {
        success: true,
        thumbnail: `data:${mimeType};base64,${base64}`,
      };
    }
    
    // 对于视频，需要使用 ffmpeg 提取帧
    // 这里简化处理，返回 null
    return {
      success: false,
      error: '暂不支持视频缩略图',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * 保存项目到本地
 */
ipcMain.handle('local:save-project', async (event, projectData, defaultPath) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存项目',
      defaultPath: defaultPath || 'untitled.story.json',
      filters: [{ name: '互动故事', extensions: ['story.json'] }],
    });

    if (result.canceled) {
      return { canceled: true };
    }

    fs.writeFileSync(result.filePath, JSON.stringify(projectData, null, 2), 'utf-8');

    return { canceled: false, path: result.filePath };
  } catch (error) {
    return {
      canceled: true,
      error: error.message,
    };
  }
});

/**
 * 打开本地项目
 */
ipcMain.handle('local:open-project', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '打开项目',
      properties: ['openFile'],
      filters: [{ name: '互动故事', extensions: ['story.json'] }],
    });

    if (result.canceled) {
      return { canceled: true };
    }

    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    const projectData = JSON.parse(content);

    return {
      canceled: false,
      path: result.filePaths[0],
      data: projectData,
    };
  } catch (error) {
    return {
      canceled: true,
      error: error.message,
    };
  }
});

/**
 * 检查是否是 Electron 环境
 */
ipcMain.handle('local:is-electron', () => {
  return true;
});

// ============================================
// 辅助函数
// ============================================

function getMediaType(ext) {
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac'];
  
  if (videoExts.includes(ext)) return 'video';
  if (imageExts.includes(ext)) return 'image';
  if (audioExts.includes(ext)) return 'audio';
  return 'file';
}

function getMimeType(ext) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// ============================================
// 应用生命周期
// ============================================

// 应用准备就绪
app.whenReady().then(() => {
  createWindow();

  // macOS 特殊处理：点击 dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出（Windows/Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 安全性：禁止导航到外部 URL
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5000' && parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
});
