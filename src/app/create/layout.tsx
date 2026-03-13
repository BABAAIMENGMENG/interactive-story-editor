import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '创作中心',
  description: '创建你的互动短剧作品，支持360度全景场景、分支剧情、角色互动。简单易用的可视化编辑器。',
  openGraph: {
    title: '创作中心 | CS互动短剧',
    description: '创建你的互动短剧作品，像剪映一样简单。',
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
