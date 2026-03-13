import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '使用教程',
  description: '学习如何使用CS互动短剧创作平台，从入门到精通的完整教程指南。',
  openGraph: {
    title: '使用教程 | CS互动短剧',
    description: '学习如何创作互动短剧。',
  },
};

export default function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
