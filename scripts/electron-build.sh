#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
cd "${COZE_WORKSPACE_PATH}"

echo "=== Building for Electron ==="

# 1. 构建静态文件
echo "Building Next.js static export..."
npx next build

# 2. 创建 out 目录（如果没有）
mkdir -p out

# 3. 复制 .next/static 到 out/static
if [ -d ".next/static" ]; then
  cp -r .next/static out/
fi

# 4. 复制 public 目录内容到 out
if [ -d "public" ]; then
  cp -r public/* out/ 2>/dev/null || true
fi

echo "=== Electron build preparation complete ==="
