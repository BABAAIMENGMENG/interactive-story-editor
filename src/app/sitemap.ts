import { MetadataRoute } from 'next';

// 📝 部署后请将 YOUR_DOMAIN 替换为你的实际域名
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString().split('T')[0];

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/explore`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/create`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/tutorial`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/auth`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // 管理后台不需要收录
  ];

  // 动态作品页面 - 实际部署后可从数据库获取
  // const dynamicPages: MetadataRoute.Sitemap = projects.map(project => ({
  //   url: `${SITE_URL}/play/${project.share_code}`,
  //   lastModified: project.updated_at,
  //   changeFrequency: 'weekly',
  //   priority: 0.8,
  // }));

  return staticPages;
}
