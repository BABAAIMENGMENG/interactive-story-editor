# VES互动短剧 - 阿里云容器镜像部署
# 多阶段构建，优化镜像大小

# 阶段1: 构建依赖
FROM node:20-alpine AS deps
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 阶段2: 构建
FROM node:20-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建
RUN pnpm build

# 阶段3: 生产镜像
FROM node:20-alpine AS runner
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=9000
ENV HOSTNAME="0.0.0.0"

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/.next/standalone/workspace/projects ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 移除 pnpm 软链接，安装真实依赖
RUN rm -rf node_modules/.pnpm node_modules/* && \
    sed -i '/"preinstall"/d' package.json && \
    sed -i '/"packageManager"/d' package.json && \
    npm install --omit=dev --no-package-lock

# 设置权限
RUN chown -R nextjs:nodejs /app

USER nextjs

# 暴露端口
EXPOSE 9000

# 启动命令
CMD ["node", "server.js"]
