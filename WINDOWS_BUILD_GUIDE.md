# Windows 桌面版构建指南

## 方案一：在你的 Windows 电脑上本地构建（推荐）

### 步骤1：下载源码

在可以访问 GitHub 的电脑上执行：

```bash
# 克隆代码（或直接下载 ZIP）
git clone [你的仓库地址]
cd interactive-story-editor
```

### 步骤2：安装依赖

```bash
# 安装 pnpm（如果没有）
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 步骤3：配置在线版地址

编辑 `electron/desktop-config.json`：

```json
{
  "apiUrl": "https://你的在线版地址",
  "webUrl": "https://你的在线版地址"
}
```

### 步骤4：构建 Windows 版本

```bash
pnpm electron:build
```

### 步骤5：获取安装包

构建完成后，安装包在 `dist-electron/` 目录：
- `互动故事编辑器 Setup.exe` - 安装版
- `互动故事编辑器 Portable.exe` - 便携版

---

## 方案二：使用 GitHub Actions 自动构建

### 步骤1：推送代码到 GitHub

```bash
git add .
git commit -m "feat: 准备构建桌面版"
git push
```

### 步骤2：触发构建

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Build Desktop App**
4. 点击 **Run workflow**
5. 等待构建完成（约 10-15 分钟）

### 步骤3：下载安装包

在 Actions 页面底部的 **Artifacts** 区域下载 `windows-app`

---

## 桌面版特点

| 功能 | 说明 |
|------|------|
| 本地文件导入 | ⚡ 秒级导入视频/图片 |
| 账号登录 | ✅ 与在线版同一账号 |
| 发布作品 | ✅ 同步到热门广场 |
| 邀请好友 | ✅ 分享链接赚奖励 |
| 离线编辑 | ✅ 无网络也能编辑 |

---

## 注意事项

1. **首次构建**需要下载 Electron 二进制文件（约 80MB），请确保网络通畅
2. **Windows 10/11** 已测试兼容
3. 如遇到杀毒软件拦截，请添加信任
