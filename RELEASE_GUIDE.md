# 发布指南

## 自动构建配置完成！

### 🚀 快速开始

#### 方法1：手动触发构建（推荐）

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Build Desktop App** 工作流
4. 点击 **Run workflow**
5. 输入版本号（如 1.0.0）
6. 等待构建完成（约 10-15 分钟）
7. 在 Artifacts 中下载对应平台的安装包

#### 方法2：通过 Tag 自动发布

```bash
# 创建并推送 tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub 会自动：
- 构建 macOS/Windows/Linux 三个版本
- 创建 Release 页面
- 上传所有安装包

### 📦 构建产物

| 平台 | 文件格式 | 说明 |
|------|----------|------|
| **Windows** | `.exe` | 安装版 |
| **Windows** | `.portable.exe` | 便携版，无需安装 |
| **macOS** | `.dmg` | 安装镜像 |
| **macOS** | `.zip` | 解压即用 |
| **Linux** | `.AppImage` | 通用格式，无需安装 |
| **Linux** | `.deb` | Debian/Ubuntu 安装包 |

### 📝 发布流程

#### 开发版本（测试）
```
手动触发 → Actions → Build Desktop App → Run workflow
```
适合测试，构建产物保存在 Artifacts（7天后过期）

#### 正式版本（发布）
```
创建 tag → git tag v1.0.0 && git push origin v1.0.0
```
自动创建 GitHub Release，永久保存

### 🔧 配置要求

已自动配置：
- ✅ 多平台构建（macOS/Windows/Linux）
- ✅ 自动发布到 GitHub Releases
- ✅ 使用内置 GITHUB_TOKEN（无需额外配置）

### 💡 使用建议

1. **首次发布**：使用手动触发测试
2. **正式发布**：使用 tag 触发
3. **版本命名**：遵循语义化版本（如 v1.0.0、v1.1.0）

### 📥 用户下载流程

发布后，用户可以：

1. 访问仓库的 **Releases** 页面
2. 选择对应版本
3. 下载对应平台的安装包
4. 安装并使用

---

## 常见问题

### Q: 构建失败怎么办？

查看 Actions 日志，常见问题：
- 依赖安装失败：检查 package.json
- 构建超时：检查代码是否有死循环
- 签名失败：macOS 需要 notarization（可选配置）

### Q: 如何配置代码签名？

编辑 `.github/workflows/build-release.yml`，添加：

```yaml
env:
  CSC_LINK: ${{ secrets.MAC_CERTIFICATE }}
  CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
```

### Q: 如何更新版本号？

修改 `package.json` 中的 `version` 字段

### Q: 构建时间太长？

- macOS 构建约 10-15 分钟
- Windows 构建约 8-12 分钟
- Linux 构建约 5-8 分钟

这是正常现象，因为需要安装依赖并打包整个应用。
