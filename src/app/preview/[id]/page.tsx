import { Suspense } from 'react';

// 动态导入内容组件
const PreviewContent = dynamic(() => import('./PreviewContent'), {
  loading: () => (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-400">加载项目中...</p>
      </div>
    </div>
  ),
});

import dynamic from 'next/dynamic';

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-400">加载项目中...</p>
          </div>
        </div>
      }
    >
      <PreviewContent params={params} />
    </Suspense>
  );
}
