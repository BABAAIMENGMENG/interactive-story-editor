# 互动故事编辑器

一款支持**在线版**和**桌面版**双模式的互动故事创作工具。

## 🚀 快速开始

### 在线版（浏览器直接访问）

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:5000
```

**特点**：
- 🌐 打开浏览器即可使用
- ☁️ 文件上传到云端
- 📱 支持移动端访问
- 🔄 自动更新

### 桌面版（本地应用）

```bash
# 开发模式
pnpm electron:dev

# 构建桌面应用
pnpm electron:build
```

**特点**：
- ⚡ 本地文件秒级导入
- 💾 无需上传，直接读取磁盘
- 🔒 数据更安全
- 📦 支持离线使用

---

## 📊 版本对比

| 特性 | 在线版 | 桌面版 |
|------|--------|--------|
| 使用方式 | 浏览器打开 | 下载安装 |
| 文件导入 | 上传到服务器 | **秒级读取本地** |
| 大文件处理 | 需要上传时间 | **无延迟** |
| 离线使用 | ❌ | ✅ |
| 数据存储 | 云端 | 本地 |
| 跨平台 | 所有浏览器 | Win/Mac/Linux |

---

## 🛠️ 开发指南

### 项目结构

```
├── src/                    # 前端源码
│   ├── app/               # Next.js 页面
│   ├── components/        # React 组件
│   ├── hooks/             # 自定义 Hooks
│   └── lib/               # 工具函数
│       └── localFileService.ts  # 本地文件服务
├── electron/              # Electron 主进程
│   ├── main.js           # 主进程入口
│   └── preload.js        # 预加载脚本
└── public/               # 静态资源
```

### 自动环境检测

代码会自动检测运行环境：

```typescript
import { isElectron } from '@/lib/localFileService';

if (isElectron()) {
  // 桌面版：直接读取本地文件
} else {
  // 在线版：上传到服务器
}
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动在线版开发服务器 |
| `pnpm build` | 构建在线版 |
| `pnpm electron:dev` | 启动桌面版开发模式 |
| `pnpm electron:build` | 构建桌面版安装包 |
| `pnpm ts-check` | TypeScript 类型检查 |

---

## 🎯 文件导入流程

### 桌面版（Electron）

```
用户选择文件 → 读取本地磁盘 → 返回 file:// URL → 秒级完成
```

### 在线版（浏览器）

```
用户选择文件 → 分片上传 → 云端存储 → 返回 HTTP URL
              ↓
         支持断点续传
         支持秒传检测
```

---

## 📦 打包发布

### 在线版

```bash
pnpm build
# 部署到服务器
```

### 桌面版

```bash
# macOS
pnpm electron:build
# 输出: dist-electron/互动故事编辑器.dmg

# Windows
pnpm electron:build
# 输出: dist-electron/互动故事编辑器 Setup.exe

# Linux
pnpm electron:build
# 输出: dist-electron/互动故事编辑器.AppImage
```

---

## 🔧 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **桌面**: Electron
- **存储**: 对象存储（S3 兼容）
- **数据库**: Supabase / PostgreSQL

---

## 📝 License

MIT
