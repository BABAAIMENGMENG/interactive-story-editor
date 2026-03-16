# 桌面版与在线版互通配置指南

## 功能概述

桌面版和在线版可以完全互通，共享：
- ✅ 同一个账号登录
- ✅ 发布作品到热门广场
- ✅ 查看热门作品
- ✅ 点赞、收藏等互动功能
- ✅ 购买付费作品

## 架构说明

```
┌─────────────────────────────────────────────────────┐
│                用户设备                              │
├─────────────────────┬───────────────────────────────┤
│   在线版 (浏览器)    │      桌面版 (Electron)        │
│                     │                               │
│  https://your-app   │   本地安装的桌面应用           │
│                     │   ↓ 连接在线 API              │
│  • 直接访问 API     │   • 秒级导入本地文件          │
│  • 无需安装         │   • 离线编辑                   │
└─────────────────────┴───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              在线服务器 (Supabase)                   │
│                                                     │
│  • 用户认证 (登录/注册)                              │
│  • 作品存储 (热门广场)                               │
│  • 数据同步                                         │
└─────────────────────────────────────────────────────┘
```

## 配置步骤

### 步骤1：获取在线版地址

首先，你的在线版需要部署到一个公网地址，例如：
- Vercel: `https://your-app.vercel.app`
- 自建服务器: `https://your-domain.com`

### 步骤2：配置桌面版

修改 `electron/desktop-config.json` 文件：

```json
{
  "apiUrl": "https://your-app.vercel.app",
  "webUrl": "https://your-app.vercel.app"
}
```

将 `your-app.vercel.app` 替换为你的实际在线版地址。

### 步骤3：重新构建桌面版

配置完成后，重新构建桌面版：

```bash
# 本地构建
pnpm electron:build

# 或通过 GitHub Actions 自动构建
git add .
git commit -m "chore: 更新桌面版配置"
git push
```

## 使用说明

### 登录账号

在桌面版中：
1. 点击右上角 **登录/注册**
2. 使用与在线版相同的账号登录
3. 登录成功后，可以访问所有在线功能

### 发布作品

1. 在编辑器中完成作品创作
2. 点击 **发布到热门作品**
3. 填写作品信息（标题、描述、分类等）
4. 发布成功后，在线版和桌面版用户都能看到

### 查看热门作品

1. 点击导航栏的 **热门作品**
2. 浏览所有用户发布的作品
3. 可以点赞、收藏、购买

## 功能对比

| 功能 | 在线版 | 桌面版 | 备注 |
|------|--------|--------|------|
| 账号登录 | ✅ | ✅ | 同一账号 |
| 发布作品 | ✅ | ✅ | 数据互通 |
| 热门作品 | ✅ | ✅ | 实时同步 |
| 点赞收藏 | ✅ | ✅ | 实时同步 |
| 导入本地视频 | 分片上传 | ⚡ 秒级 | 桌面版更快 |
| 导入本地图片 | 支持 | ⚡ 秒级 | 桌面版更快 |
| 离线编辑 | ❌ | ✅ | 桌面版专属 |
| 文件大小限制 | 有 | 无限制 | 桌面版无限制 |

## 常见问题

### Q: 桌面版无法登录？

**检查步骤：**
1. 确认 `desktop-config.json` 配置正确
2. 确认在线版可以正常访问
3. 检查网络连接
4. 查看控制台是否有 CORS 错误

**解决方案：**
如果出现 CORS 错误，需要在在线版的 `next.config.js` 中配置：

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### Q: 桌面版和在线版数据不同步？

**原因：** 可能是登录了不同的账号

**解决方案：**
1. 在桌面版点击头像 → 查看账号信息
2. 确认与在线版是同一个邮箱

### Q: 如何切换账号？

1. 点击头像 → **退出登录**
2. 使用新账号重新登录

### Q: 桌面版支持离线使用吗？

**部分支持：**
- ✅ 本地文件导入：完全离线
- ✅ 项目编辑：完全离线
- ❌ 登录/注册：需要网络
- ❌ 热门作品：需要网络
- ❌ 发布作品：需要网络

## 技术实现

### API 配置

桌面版通过 `electron/preload.js` 注入配置：

```javascript
contextBridge.exposeInMainWorld('electronConfig', {
  apiUrl: 'https://your-app.vercel.app',
  webUrl: 'https://your-app.vercel.app',
  isDesktop: true,
});
```

前端代码通过 `src/lib/api-config.ts` 读取配置：

```typescript
export function getApiBaseUrl(): string {
  // 桌面版：使用 Electron 注入的配置
  if (window.electronConfig) {
    return window.electronConfig.apiUrl;
  }
  // 在线版：使用相对路径
  return '';
}
```

### 认证流程

```
桌面版                         在线服务器
  │                               │
  │  1. 用户输入账号密码           │
  │  2. POST /api/auth/login ────→│
  │                               │ 验证账号密码
  │←──────── 返回 token ──────────│
  │  3. 保存 token 到 localStorage│
  │                               │
  │  4. GET /api/auth/me ────────→│
  │     Header: Authorization     │
  │                               │ 验证 token
  │←────── 返回用户信息 ───────────│
```

---

## 总结

配置完成后，桌面版和在线版可以：
- 使用同一个账号登录
- 同步作品和收藏
- 共享热门作品广场

桌面版额外优势：
- ⚡ 本地文件秒级导入
- 💾 支持离线编辑
- 📦 无文件大小限制
