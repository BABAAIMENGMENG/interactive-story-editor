#!/bin/bash
# 阿里云 ECS 一键部署脚本
# 在服务器上运行此脚本

set -e

echo "=========================================="
echo "  互动故事编辑器 - 阿里云部署脚本"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 应用目录
APP_DIR="/var/www/interactive-story"
REPO_URL="https://github.com/BABAAIMENGMENG/interactive-story-editor.git"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    exit 1
fi

# 1. 更新系统
echo -e "${YELLOW}[1/6] 更新系统...${NC}"
apt update && apt upgrade -y

# 2. 安装 Node.js 20
echo -e "${YELLOW}[2/6] 安装 Node.js 20...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}Node.js 版本: $(node -v)${NC}"

# 3. 安装 pnpm 和 PM2
echo -e "${YELLOW}[3/6] 安装 pnpm 和 PM2...${NC}"
npm install -g pnpm pm2
echo -e "${GREEN}pnpm 版本: $(pnpm -v)${NC}"
echo -e "${GREEN}PM2 版本: $(pm2 -v)${NC}"

# 4. 安装 Nginx
echo -e "${YELLOW}[4/6] 安装 Nginx...${NC}"
apt install -y nginx

# 5. 部署应用
echo -e "${YELLOW}[5/6] 部署应用...${NC}"

# 创建目录
mkdir -p $APP_DIR
cd $APP_DIR

# 克隆或更新代码
if [ -d ".git" ]; then
    echo "更新代码..."
    git pull
else
    echo "克隆代码..."
    git clone $REPO_URL .
fi

# 安装依赖
echo "安装依赖..."
pnpm install --ignore-scripts

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}创建环境变量文件...${NC}"
    cat > .env.local << 'EOF'
# Supabase 配置
COZE_SUPABASE_URL=https://ghpsjkdevmojuqkoovzm.supabase.co
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocHNqa2Rldm1vanVxa29vdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTM5MTcsImV4cCI6MjA4ODg4OTkxN30.eNVvtzmSAbOKKPBDTblTTBGAdBbbf9GKlnnKK70UWDk

# 客户端配置
NEXT_PUBLIC_COZE_SUPABASE_URL=https://ghpsjkdevmojuqkoovzm.supabase.co
NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocHNqa2Rldm1vanVxa29vdnptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTM5MTcsImV4cCI6MjA4ODg4OTkxN30.eNVvtzmSAbOKKPBDTblTTBGAdBbbf9GKlnnKK70UWDk

# 站点配置（请修改为实际域名）
NEXT_PUBLIC_SITE_URL=http://localhost
EOF
    echo -e "${YELLOW}已创建 .env.local，请根据需要修改站点 URL${NC}"
fi

# 构建
echo "构建应用..."
pnpm build

# 6. 启动应用
echo -e "${YELLOW}[6/6] 启动应用...${NC}"

# 停止旧进程
pm2 delete interactive-story 2>/dev/null || true

# 启动新进程
pm2 start pnpm --name "interactive-story" -- start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup | tail -1 | bash || true

# 配置 Nginx
echo -e "${YELLOW}配置 Nginx...${NC}"
cat > /etc/nginx/sites-available/interactive-story << 'EOF'
server {
    listen 80;
    server_name _;

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
        
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        
        client_max_body_size 500M;
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/interactive-story /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重载
nginx -t && systemctl reload nginx

echo ""
echo -e "${GREEN}=========================================="
echo "  部署完成！"
echo "==========================================${NC}"
echo ""
echo "访问地址: http://$(curl -s ifconfig.me)"
echo ""
echo "常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs interactive-story"
echo "  重启应用: pm2 restart interactive-story"
echo ""
