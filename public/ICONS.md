# 图标说明

## 图标文件要求

构建桌面版需要以下图标文件：

| 文件 | 用途 | 尺寸 |
|------|------|------|
| `public/icon.icns` | macOS 图标 | 512x512 |
| `public/icon.ico` | Windows 图标 | 256x256 |
| `public/icon.png` | Linux 图标 | 512x512 |

## 快速生成图标

### 方法1：使用在线工具

1. 访问 https://cloudconvert.com/png-to-icns
2. 上传一张 512x512 的 PNG 图片
3. 分别转换为 icns 和 ico 格式

### 方法2：使用本地工具

```bash
# 安装工具
npm install -g electron-icon-builder

# 从一张大图生成所有格式
electron-icon-builder --input=./logo.png --output=./public
```

### 方法3：临时占位（用于测试）

如果暂时没有图标，可以注释掉 package.json 中的 icon 配置：

```json
"mac": {
  "category": "public.app-category.video",
  // "icon": "public/icon.icns",
  "target": ["dmg", "zip"]
}
```

系统会使用默认图标。

## 图标设计建议

- 使用简洁的图形
- 避免过多细节
- 确保在小尺寸下清晰可辨
- 建议使用透明背景的 PNG
