# 🐳 阿里云容器镜像部署指南

## 📋 前置准备

### 第一步：开通容器镜像服务 ACR

1. 访问：https://cr.console.aliyun.com/
2. 点击「开通服务」（个人版免费）
3. 设置访问凭证密码

---

### 第二步：创建镜像仓库

1. 在容器镜像服务控制台，点击「创建镜像仓库」
2. 填写信息：
   - **命名空间**：选择或创建（如 `ves-interactive`）
   - **仓库名称**：`web`
   - **仓库类型**：公开或私有
   - **摘要**：VES互动短剧 Web 应用
3. 点击「确定」创建
4. **记录仓库地址**，格式如：`registry.cn-hangzhou.aliyuncs.com/ves-interactive/web`

---

### 第三步：获取访问凭证

1. 在容器镜像服务控制台，点击左侧「访问凭证」
2. 设置固定密码（用于 docker login）
3. 记录：
   - **用户名**：你的阿里云账号（或子账号）
   - **密码**：刚才设置的密码
   - **仓库地址**：`registry.cn-hangzhou.aliyuncs.com`

---

## 🏗️ 构建并推送镜像

### 在本地或服务器执行：

```bash
# 1. 登录阿里云容器镜像服务
docker login --username=你的账号 registry.cn-hangzhou.aliyuncs.com
# 输入密码

# 2. 构建镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/ves-interactive/web:latest .

# 3. 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/ves-interactive/web:latest
```

---

## 🚀 部署到函数计算

### 方法一：使用 s.yaml 部署

1. 修改 `s-container.yaml` 中的镜像地址
2. 执行部署：
```bash
s deploy -t s-container.yaml
```

### 方法二：在控制台配置

1. 进入函数计算控制台
2. 找到 `ves-interactive` 服务 → `web` 函数
3. 修改「函数配置」→「运行环境」为「自定义容器镜像」
4. 填入镜像地址
5. 保存并部署

---

## 📊 费用说明

| 服务 | 费用 |
|------|------|
| 容器镜像 ACR 个人版 | 免费 |
| 函数计算 FC | 按量付费（有免费额度） |
| 镜像存储 | 约 0.3元/GB/月 |

---

## ⚠️ 注意事项

1. 镜像大小建议控制在 1GB 以内
2. 首次部署会较慢（需要拉取镜像）
3. 确保函数计算有权限访问容器镜像

---

## 🔧 下一步

告诉我你的：
1. 镜像仓库地址（格式：`registry.cn-hangzhou.aliyuncs.com/xxx/xxx`）
2. 是否已创建镜像仓库

我来帮你继续配置！
