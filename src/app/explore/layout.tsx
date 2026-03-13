import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '探索作品',
  description: '发现精彩互动短剧作品，支持言情、悬疑、科幻、奇幻等多种分类。免费观看或付费解锁精品内容。',
  openGraph: {
    title: '探索作品 | CS互动短剧',
    description: '发现精彩互动短剧作品，支持多种分类筛选。',
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
