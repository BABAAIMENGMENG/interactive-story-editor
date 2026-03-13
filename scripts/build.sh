#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the project..."
npx next build

# 修复 standalone 的 node_modules（pnpm 符号链接在 FC 中不工作）
echo "Fixing standalone node_modules for Aliyun FC..."
STANDALONE_DIR=".next/standalone/workspace/projects"

if [ -d "$STANDALONE_DIR" ]; then
  cd "$STANDALONE_DIR"
  
  # 移除 pnpm 的符号链接结构
  rm -rf node_modules/.pnpm node_modules/*
  
  # 复制 package.json 并移除 pnpm 特定字段
  cp ../../package.json ./package.json.tmp
  sed -i '/"preinstall"/d' ./package.json.tmp
  sed -i '/"packageManager"/d' ./package.json.tmp
  sed -i '/"pnpm":/d' ./package.json.tmp
  
  # 使用 npm 安装扁平依赖（仅生产依赖）
  npm install --omit=dev --no-package-lock --ignore-scripts
  npm install next --no-package-lock --ignore-scripts
  
  # 清理
  rm -f ./package.json.tmp
  
  cd "${COZE_WORKSPACE_PATH}"
fi

echo "Build completed successfully!"
