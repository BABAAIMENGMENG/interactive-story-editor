# CS 互动短剧平台 - 部署指南

本指南将帮助你把 CS 互动短剧平台部署到公网，让所有人都能使用。

---

## 📋 部署前准备

你需要准备以下账号：

| 服务 | 用途 | 费用 | 链接 |
|------|------|------|------|
| **GitHub** | 代码托管 | 免费 | [github.com](https://github.com) |
| **Vercel** | 网站托管 | 免费 | [vercel.com](https://vercel.com) |
| **Supabase** | 数据库 | 免费 | [supabase.com](https://supabase.com) |

---

## 🚀 第一步：创建 Supabase 数据库

### 1.1 注册 Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 点击 "Start your project" 注册账号
3. 创建一个新组织（Organization）

### 1.2 创建项目

1. 点击 "New Project"
2. 填写项目信息：
   - **Name**: `ves-interactive`（或任意名称）
   - **Database Password**: 设置一个强密码（记住它！）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
3. 点击 "Create new project"，等待约 2 分钟

### 1.3 获取连接信息

1. 项目创建完成后，进入项目
2. 点击左侧 "Settings" → "API"
3. 记录以下信息（后面会用到）：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

### 1.4 初始化数据库

1. 点击左侧 "SQL Editor"
2. 点击 "New query"
3. 将 `supabase/init.sql` 文件的全部内容复制粘贴进去
4. 点击 "Run" 执行脚本
5. 看到 "Success. No rows returned" 表示成功

---

## 🔧 第二步：上传代码到 GitHub

### 2.1 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 填写信息：
   - **Repository name**: `ves-interactive`
   - **Public**（公开）
4. 点击 "Create repository"

### 2.2 上传代码

**方式一：使用 Git 命令行**

```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/ves-interactive.git
git push -u origin main
```

**方式二：使用 GitHub Desktop**

1. 下载安装 [GitHub Desktop](https://desktop.github.com/)
2. 登录 GitHub 账号
3. File → Add Local Repository → 选择项目目录
4. Publish repository

---

## 🌐 第三步：部署到 Vercel

### 3.1 导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 选择你刚创建的 `ves-interactive` 仓库
5. 点击 "Import"

### 3.2 配置项目

在配置页面：

- **Framework Preset**: Next.js（自动检测）
- **Root Directory**: `./`
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next`

### 3.3 配置环境变量

点击 "Environment Variables" 展开，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `COZE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase 项目 URL |
| `COZE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Supabase anon key |
| `NEXT_PUBLIC_COZE_SUPABASE_URL` | `https://xxxxx.supabase.co` | 同上（客户端用） |
| `NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | 同上（客户端用） |

### 3.4 开始部署

1. 点击 "Deploy"
2. 等待约 2-5 分钟
3. 看到 🎉 庆祝动画表示部署成功！

### 3.5 获取网站地址

部署完成后，Vercel 会提供一个免费域名：
- 格式：`https://ves-interactive-xxx.vercel.app`
- 你可以在项目设置中绑定自定义域名

---

## ✅ 第四步：验证部署

### 4.1 访问网站

打开 Vercel 提供的域名，检查：
- [ ] 首页正常显示
- [ ] 可以浏览公开作品
- [ ] 点击作品可以进入播放页

### 4.2 测试功能

1. **注册/登录**：点击右上角登录按钮
2. **创建项目**：进入 Dashboard 创建新项目
3. **保存项目**：编辑后保存，检查是否成功
4. **公开作品**：将项目设为公开，在首页查看

---

## 🔒 安全建议

### 修改管理员密码

1. 进入 Supabase 控制台
2. Table Editor → admin_users
3. 修改默认管理员密码
4. 或删除默认管理员，创建新的

### 配置自定义域名（可选）

1. Vercel 项目设置 → Domains
2. 添加你的域名
3. 按提示配置 DNS

---

## 📊 费用说明

### 免费额度

| 服务 | 免费额度 | 超出后 |
|------|----------|--------|
| **Vercel** | 100GB 流量/月 | $20/月 |
| **Supabase** | 500MB 数据库 + 5GB 存储 | $25/月 |

对于个人使用和初期项目，免费额度完全够用。

---

## 🆘 常见问题

### Q: 部署失败怎么办？

1. 查看 Vercel 的 Build Logs
2. 检查环境变量是否正确设置
3. 确保 Supabase SQL 脚本执行成功

### Q: 页面显示 500 错误？

1. 检查 Supabase 是否正常运行
2. 确认环境变量值正确（不要有空格或换行）
3. 查看 Vercel Functions 日志

### Q: 数据库连接失败？

1. 确认 Supabase 项目状态为 Active
2. 检查 URL 和 Key 是否正确
3. 确认 RLS 策略已配置

### Q: 如何查看日志？

1. Vercel 项目 → Deployments
2. 点击最新部署
3. 点击 "Functions" 查看服务端日志

---

## 📞 技术支持

如遇问题，可以：
1. 查看 Vercel 和 Supabase 官方文档
2. 在 GitHub 上提交 Issue
3. 检查浏览器控制台和网络请求

---

## 🎉 恭喜！

部署完成后，你的 CS 互动短剧平台就可以让所有人访问了！

分享你的网址给朋友，开始创作互动短剧吧！
