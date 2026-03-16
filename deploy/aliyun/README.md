# 阿里云部署指南

## 方案：ECS 云服务器 + PM2

### 前置要求

1. 一台 ECS 云服务器（推荐配置：2核4G，CentOS 7.9 或 Ubuntu 20.04）
2. 安全组开放端口：80、443、5000

---

## 第一步：购买 ECS（如已有可跳过）

### 方式1：控制台购买
1. 登录 [阿里云 ECS 控制台](https://ecs.console.aliyun.com/)
2. 点击「创建实例」
3. 选择配置：
   - 地域：华东（杭州）或 华北（北京）
   - 实例规格：2核4G（ecs.c6.large）
   - 镜像：Ubuntu 20.04 64位
   - 存储：40GB 高效云盘
   - 带宽：按使用流量，5Mbps
   - 安全组：开放 22、80、443、5000 端口

### 方式2：使用 CLI 创建
```bash
# 安装阿里云 CLI
# macOS: brew install aliyun-cli
# Linux: 下载 https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tar.gz

# 配置凭证
aliyun configure

# 创建实例
aliyun ecs CreateInstance \
  --RegionId cn-hangzhou \
  --InstanceType ecs.c6.large \
  --ImageId ubuntu_20_04_x64_20G_alibase_20210420.vhd \
  --SecurityGroupId sg-xxxxx \
  --InstanceName interactive-story
```

---

## 第二步：连接服务器

```bash
# SSH 连接（替换为你的公网 IP）
ssh root@<你的ECS公网IP>

# 或使用密钥
ssh -i ~/.ssh/your-key.pem root@<你的ECS公网IP>
```

---

## 第三步：服务器环境配置

在服务器上执行：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2

# 安装 Nginx
apt install -y nginx

# 验证安装
node -v
pnpm -v
pm2 -v
```

---

## 第四步：部署应用

### 方式1：Git 拉取（推荐）

```bash
# 创建应用目录
mkdir -p /var/www/interactive-story
cd /var/www/interactive-story

# 克隆代码
git clone https://github.com/BABAAIMENGMENG/interactive-story-editor.git .

# 安装依赖
pnpm install --ignore-scripts

# 复制环境变量（需要填写实际的 Supabase 配置）
cp .env.example .env.local
nano .env.local  # 编辑环境变量

# 构建
pnpm build

# 启动
pm2 start pnpm --name "interactive-story" -- start
pm2 save
pm2 startup
```

### 方式2：上传构建产物

在本地执行：
```bash
# 构建
pnpm build

# 打包
tar -czvf dist.tar.gz .next package.json pnpm-lock.yaml public src .env.local

# 上传到服务器
scp dist.tar.gz root@<ECS公网IP>:/var/www/interactive-story/
```

在服务器执行：
```bash
cd /var/www/interactive-story
tar -xzvf dist.tar.gz
pnpm install --prod
pm2 start pnpm --name "interactive-story" -- start
```

---

## 第五步：配置 Nginx 反向代理

```bash
# 创建 Nginx 配置
nano /etc/nginx/sites-available/interactive-story
```

粘贴以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 增加超时时间（用于大文件上传）
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        
        # 增加请求体大小限制（用于大文件上传）
        client_max_body_size 500M;
    }
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/interactive-story /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

---

## 第六步：配置 HTTPS（可选）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 申请证书（需要已备案的域名）
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

---

## 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs interactive-story

# 重启应用
pm2 restart interactive-story

# 更新代码
cd /var/www/interactive-story
git pull
pnpm install
pnpm build
pm2 restart interactive-story
```

---

## 安全组配置

在阿里云控制台，确保安全组入方向规则包含：

| 端口 | 协议 | 来源 | 说明 |
|------|------|------|------|
| 22 | TCP | 你的 IP | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 5000 | TCP | 127.0.0.1 | 应用端口（仅本地） |

---

## 成本估算

| 资源 | 配置 | 月费用（约） |
|------|------|-------------|
| ECS | 2核4G | ¥100-150 |
| 带宽 | 5Mbps 按流量 | ¥20-50 |
| 云盘 | 40GB | ¥10 |
| **合计** | - | **¥130-210/月** |

---

## 环境变量配置

`.env.local` 文件内容：

```bash
# Supabase 配置
COZE_SUPABASE_URL=https://ghpsjkdevmojuqkoovzm.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocHNqa2Rldm1vanVxa29vdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTM5MTcsImV4cCI6MjA4ODg4OTkxN30.eNVvtzmSAbOKKPBDTblTTBGAdBbbf9GKlnnKK70UWDk

# 客户端配置
NEXT_PUBLIC_COZE_SUPABASE_URL=https://ghpsjkdevmojuqkoovzm.supabase.co
NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocHNqa2Rldm1vanVxa29vdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTM5MTcsImV4cCI6MjA4ODg4OTkxN30.eNVvtzmSAbOKKPBDTblTTBGAdBbbf9GKlnnKK70UWDk

# 站点配置
NEXT_PUBLIC_SITE_URL=http://你的域名或IP
```
