import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { Providers } from './providers';

// 📝 部署后请将 YOUR_DOMAIN 替换为你的实际域名
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
const SITE_NAME = 'CS互动短剧';
const SITE_DESCRIPTION = '全景交互平台，创建沉浸式360度全景互动短剧，支持分支剧情、角色互动、热点交互。免费使用，无需编程基础。';
const SITE_KEYWORDS = [
  '互动短剧',
  '全景视频',
  '互动体验',
  '剧情游戏',
  '沉浸式体验',
  '360度视频',
  '分支剧情',
  '互动电影',
  '互动小说',
  '视觉小说',
  '互动故事',
  '全景交互',
  'CS互动短剧',
  '短剧制作',
  '互动内容创作',
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - 全景交互平台`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'CS Team' }],
  creator: 'CS',
  publisher: 'CS互动短剧',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - 全景交互平台`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CS互动短剧 - 全景交互平台',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - 全景交互平台`,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: 'Entertainment',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`} suppressHydrationWarning>
        <Providers>
          {isDev && <Inspector />}
          {children}
        </Providers>
      </body>
    </html>
  );
}
