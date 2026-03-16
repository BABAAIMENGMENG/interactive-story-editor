# 桌面版下载指南

## 🎉 自动构建已配置完成！

GitHub Actions 已配置好自动构建流程，你可以轻松获取桌面版安装包。

---

## 📥 下载方式

### 方式1：手动触发构建（最快）

1. 将代码推送到 GitHub
2. 进入仓库页面 → **Actions** 标签
3. 点击左侧 **Build Desktop App**
4. 点击右侧 **Run workflow** → **Run workflow**
5. 等待约 10-15 分钟
6. 构建完成后，滚动到页面底部 **Artifacts** 区域
7. 下载对应平台的压缩包：
   - `mac-app` - macOS 版本
   - `windows-app` - Windows 版本
   - `linux-app` - Linux 版本

### 方式2：通过 Tag 自动发布（推荐正式版）

```bash
# 在本地执行
git tag v1.0.0
git push origin v1.0.0
```

GitHub 会自动：
- ✅ 构建三个平台版本
- ✅ 创建 Release 页面
- ✅ 上传所有安装包

用户访问 **Releases** 页面即可下载。

---

## 🖥️ 安装包说明

### Windows

| 文件 | 说明 |
|------|------|
| `互动故事编辑器 Setup.exe` | 安装版，双击安装 |
| `互动故事编辑器 Portable.exe` | 便携版，无需安装 |

### macOS

| 文件 | 说明 |
|------|------|
| `互动故事编辑器.dmg` | 安装镜像，拖拽到 Applications |
| `互动故事编辑器.zip` | 解压后直接运行 |

> ⚠️ macOS 首次打开可能提示"无法验证"，右键 → 打开 → 仍要打开

### Linux

| 文件 | 说明 |
|------|------|
| `互动故事编辑器.AppImage` | 通用格式，chmod +x 后直接运行 |
| `互动故事编辑器.deb` | Debian/Ubuntu，dpkg -i 安装 |

---

## ⚡ 桌面版优势

| 功能 | 在线版 | 桌面版 |
|------|--------|--------|
| 导入本地视频 | 分片上传（大文件较慢） | ⚡ **秒级导入** |
| 导入本地图片 | 支持 | ⚡ **秒级导入** |
| 数据存储 | 云端 | 本地 |
| 离线使用 | ❌ | ✅ |
| 文件大小限制 | 有 | **无限制** |

---

## 🔧 开发者选项

### 本地构建

```bash
# 安装依赖
pnpm install

# 构建 Next.js
pnpm build

# 打包桌面版
pnpm electron:build
```

### 本地调试

```bash
# 开发模式（同时启动 Web 和 Electron）
pnpm electron:dev
```

---

## ❓ 常见问题

### Q: 构建失败怎么办？

查看 Actions 日志，常见问题：
- 依赖安装失败 → 检查 `package.json`
- 找不到图标 → 先注释掉 icon 配置或添加图标文件

### Q: Artifacts 在哪？

Actions 页面 → 点击具体的 workflow run → 滚动到页面底部

### Q: Artifacts 过期了？

Artifacts 保存 7 天，过期后重新触发构建即可

### Q: 如何发布正式版本？

使用 Tag 触发，Release 会永久保存：
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 📚 相关文档

- [发布指南](./RELEASE_GUIDE.md) - 详细的发布流程
- [双版本说明](./README_DUAL_VERSION.md) - 在线版和桌面版的技术说明
- [图标配置](./public/ICONS.md) - 如何生成应用图标

---

**现在就试试吧！** 🚀

将代码推送到 GitHub，然后在 Actions 页面触发构建即可。
