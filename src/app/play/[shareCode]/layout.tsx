import type { Metadata } from 'next';

// 📝 部署后请将 YOUR_DOMAIN 替换为你的实际域名
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

// 动态生成元数据
export async function generateMetadata({
  params,
}: {
  params: { shareCode: string };
}): Promise<Metadata> {
  try {
    // 从 API 获取作品信息
    const res = await fetch(`${SITE_URL}/api/projects/share/${params.shareCode}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      return {
        title: '作品不存在',
        description: '该作品不存在或已被删除。',
      };
    }

    const data = await res.json();
    const project = data.project;

    return {
      title: project.name,
      description: project.description || `${project.name} - 在VES互动短剧平台上观看精彩互动内容`,
      openGraph: {
        title: `${project.name} | VES互动短剧`,
        description: project.description || `观看 ${project.name}`,
        images: project.coverImage ? [project.coverImage] : ['/og-image.png'],
        type: 'video.other',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${project.name} | VES互动短剧`,
        description: project.description || `观看 ${project.name}`,
        images: project.coverImage ? [project.coverImage] : ['/og-image.png'],
      },
    };
  } catch (error) {
    return {
      title: '互动短剧',
      description: '在VES互动短剧平台上观看精彩互动内容。',
    };
  }
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
