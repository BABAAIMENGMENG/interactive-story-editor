# 🚀 阿里云函数计算 FC 部署指南

## 📋 前置准备

### 1. 阿里云账号
- 已注册阿里云账号
- 已完成实名认证

### 2. 获取 AccessKey
1. 登录 [阿里云控制台](https://.console.aliyun.com/)
2. 点击右上角头像 → **AccessKey 管理**
3. 选择 **继续使用 AccessKey**
4. 点击 **创建 AccessKey**
5. **⚠️ 重要**：保存好 AccessKey ID 和 AccessKey Secret

### 3. 开通服务
在阿里云控制台开通以下服务（都有免费额度）：
- [函数计算 FC](https://fc.console.aliyun.com/)
- [日志服务 SLS](https://sls.console.aliyun.com/)（可选，用于查看日志）

---

## 🔧 部署步骤

### 第一步：安装 Serverless Devs 工具

```bash
npm install -g @serverless-devs/s
```

### 第二步：配置阿里云密钥

```bash
s config add
```

按提示输入：
- **AccessKeyID**：你的 AccessKey ID
- **AccessKeySecret**：你的 AccessKey Secret
- **AccountID**：在阿里云控制台「安全设置」中查看

### 第三步：构建项目

```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm build
```

### 第四步：部署到函数计算

```bash
s deploy
```

首次部署会提示确认，输入 `y` 继续。

### 第五步：获取访问地址

部署成功后，会输出类似信息：
```
CustomDomain:
  Domain: https://xxxxxx.cn-hangzhou.fc.aliyuncs.com
```

这就是你的网站访问地址！

---

## ⚙️ 配置环境变量

部署后需要在阿里云控制台配置环境变量：

1. 进入 [函数计算控制台](https://fc.console.aliyun.com/)
2. 选择对应区域（如华东1-杭州）
3. 点击「服务及函数」→ 找到 `ves-interactive` 服务
4. 点击 `web` 函数 → 「函数配置」→ 「环境变量」
5. 添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `COZE_SUPABASE_URL` | 你的 Supabase URL |
| `COZE_SUPABASE_ANON_KEY` | 你的 Supabase Key |
| `NEXT_PUBLIC_COZE_SUPABASE_URL` | 你的 Supabase URL |
| `NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY` | 你的 Supabase Key |
| `NEXT_PUBLIC_SITE_URL` | 你的阿里云域名 |

6. 点击「保存」→「发布版本」

---

## 🌐 绑定自定义域名（可选）

如果你有自己的域名：

### 1. 域名备案
- 国内服务器必须先完成 ICP 备案
- 在 [阿里云备案系统](https://beian.aliyun.com/) 完成备案

### 2. 添加域名解析
1. 进入 [云解析 DNS](https://dns.console.aliyun.com/)
2. 添加记录：
   - **记录类型**：CNAME
   - **主机记录**：www 或 @
   - **记录值**：函数计算提供的域名

### 3. 配置 HTTPS 证书
1. 在 [SSL 证书服务](https://yundun.console.aliyun.com/?p=cas) 申请免费证书
2. 在函数计算域名配置中上传证书

---

## 🔄 更新部署

代码修改后，重新部署：

```bash
# 重新构建
pnpm build

# 部署更新
s deploy
```

---

## 💰 费用说明

函数计算 FC 免费额度（每月）：
| 资源 | 免费额度 |
|------|----------|
| 调用次数 | 100 万次 |
| 执行时间 | 40 万 GB-秒 |
| 公网流出流量 | 1 GB |

预估费用：
- 日访问量 < 1000：**免费**
- 日访问量 10000：约 **5-10 元/月**

---

## 📊 查看日志

1. 进入函数计算控制台
2. 点击函数 → 「日志查询」
3. 可查看实时日志和历史日志

---

## ❓ 常见问题

### Q: 部署失败提示权限不足？
A: 确保 AccessKey 有以下权限：
- AliyunFCFullAccess
- AliyunLogFullAccess（可选）

### Q: 页面访问报错 500？
A: 检查环境变量是否正确配置，查看日志排查错误

### Q: 图片上传失败？
A: 检查 S3/OSS 配置是否正确

### Q: 如何查看访问统计？
A: 
- 函数计算控制台 → 函数 → 监控指标
- 或接入阿里云 ARMS 应用监控

---

## 📞 技术支持

如有问题：
1. 查看函数计算 [官方文档](https://help.aliyun.com/product/50980.html)
2. 提交工单咨询阿里云技术支持
