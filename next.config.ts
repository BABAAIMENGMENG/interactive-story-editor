import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // 阿里云函数计算部署 - standalone 模式
  output: 'standalone',
  
  allowedDevOrigins: ['*.dev.coze.site'],
  
  images: {
    // 禁止图片下载行为
    contentDispositionType: 'inline',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // 阿里云 OSS 图片
      {
        protocol: 'https',
        hostname: '*.aliyuncs.com',
        pathname: '/**',
      },
    ],
  },
  
  // 配置 API 路由和 Server Actions 的请求体大小限制
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // 上传大文件需要（视频等）
    },
  },
};

export default nextConfig;
