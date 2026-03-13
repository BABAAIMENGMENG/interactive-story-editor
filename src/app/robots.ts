import { MetadataRoute } from 'next';

// 📝 部署后请将 YOUR_DOMAIN 替换为你的实际域名
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',           // 管理后台
          '/api/',             // API 接口
          '/create/editor/',   // 编辑器页面（需要登录）
          '/preview/',         // 预览页面（需要登录）
          '/dashboard/',       // 用户仪表盘
          '/earnings/',        // 收入页面
          '/transactions/',    // 交易记录
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/create/editor/', '/preview/', '/dashboard/', '/earnings/', '/transactions/'],
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: ['/admin/', '/api/', '/create/editor/', '/preview/', '/dashboard/', '/earnings/', '/transactions/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
