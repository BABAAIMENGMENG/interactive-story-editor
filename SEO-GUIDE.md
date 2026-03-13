# 🚀 搜索引擎优化 (SEO) 完整指南

## ✅ 已完成的SEO配置

### 1. 网站元数据 (`src/app/layout.tsx`)
- ✅ 网站标题和描述
- ✅ 关键词配置
- ✅ Open Graph 标签（微信/朋友圈分享）
- ✅ Twitter Card 标签
- ✅ 搜索引擎爬虫指令

### 2. 站点地图 (`src/app/sitemap.ts`)
- ✅ 自动生成 sitemap.xml
- ✅ 包含所有主要页面
- 📝 动态作品页面需部署后添加数据库查询

### 3. 爬虫规则 (`src/app/robots.txt`)
- ✅ 允许所有搜索引擎爬取公开页面
- ✅ 禁止爬取管理后台、API、用户私密页面
- ✅ 指向 sitemap 地址

### 4. 页面级SEO
- ✅ `/explore` - 探索作品页
- ✅ `/create` - 创作中心页
- ✅ `/pricing` - 订阅会员页
- ✅ `/tutorial` - 使用教程页
- ✅ `/play/[shareCode]` - 作品播放页（动态metadata）

---

## 📝 部署后必做事项

### 第一步：配置域名
1. 在 `.env.local` 中修改：
   ```
   NEXT_PUBLIC_SITE_URL=https://你的实际域名.com
   ```

### 第二步：创建OG分享图片
1. 设计一张 1200x630 像素的图片
2. 保存为 `public/og-image.png`
3. 参考 `public/og-image-README.md` 中的设计建议

### 第三步：Google收录
1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 点击"添加资源"，输入你的域名
3. 验证方式选择"HTML标签"或"DNS验证"
   
   **HTML标签验证**：
   - 将 Google 提供的 meta 标签添加到 `src/app/layout.tsx`：
   ```tsx
   export const metadata: Metadata = {
     // ...其他配置
     verification: {
       google: '你的Google验证码',
     },
   };
   ```

4. 验证成功后，提交 sitemap：
   - 在 Search Console 左侧菜单点击"Sitemaps"
   - 输入 `sitemap.xml` 并提交

### 第四步：百度收录
1. 访问 [百度搜索资源平台](https://ziyuan.baidu.com)
2. 添加网站并验证
3. 提交 sitemap

### 第五步：其他搜索引擎
| 搜索引擎 | 提交地址 |
|---------|---------|
| 必应 | [Bing Webmaster Tools](https://www.bing.com/webmasters) |
| 搜狗 | [搜狗站长平台](https://zhanzhang.sogou.com) |
| 360搜索 | [360站长平台](https://zhanzhang.so.com) |

---

## 🔧 进阶优化建议

### 1. 结构化数据 (JSON-LD)
在 `src/app/layout.tsx` 中添加：
```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "VES互动短剧",
              "description": "360度全景互动体验平台",
              "applicationCategory": "EntertainmentApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "CNY"
              }
            })
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 2. 提升加载速度
- ✅ 已使用 Next.js 自动图片优化
- ✅ 已使用动态导入减少首屏加载
- 建议配置 CDN 加速

### 3. 移动端优化
- ✅ 已使用响应式设计
- 建议测试移动端体验

### 4. 内容优化
- 为每个作品添加详细描述
- 添加作品标签功能
- 鼓励用户生成优质内容

---

## 📊 监控与分析

### Google Analytics
1. 创建 GA4 账号获取测量ID
2. 安装依赖：
   ```bash
   pnpm add @next/third-parties
   ```
3. 在 `layout.tsx` 中添加：
   ```tsx
   import { GoogleAnalytics } from '@next/third-parties/google';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <GoogleAnalytics gaId="G-XXXXXXXXXX" />
         </body>
       </html>
     );
   }
   ```

### 百度统计
1. 在百度统计获取代码
2. 添加到 `layout.tsx` 的 `<head>` 中

---

## ✅ 检查清单

部署后逐项检查：

- [ ] 修改 `.env.local` 中的 `NEXT_PUBLIC_SITE_URL`
- [ ] 创建 `public/og-image.png` 分享图片
- [ ] 在 Google Search Console 添加网站
- [ ] 在百度搜索资源平台添加网站
- [ ] 提交 sitemap 到各搜索引擎
- [ ] 测试分享链接是否显示正确的标题和图片
- [ ] 搜索 `site:你的域名.com` 检查收录情况

---

## 🆘 常见问题

**Q: 为什么搜索不到我的网站？**
A: 新网站需要1-4周才能被搜索引擎收录，请耐心等待。

**Q: 分享链接不显示图片？**
A: 检查 `public/og-image.png` 是否存在，确保图片尺寸正确。

**Q: 如何查看收录情况？**
A: 在搜索引擎中搜索 `site:你的域名.com`

**Q: sitemap 是什么？**
A: 是一个 XML 文件，告诉搜索引擎你网站有哪些页面，方便爬虫抓取。
