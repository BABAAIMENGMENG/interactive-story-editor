import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '订阅会员',
  description: '订阅CS互动短剧会员，解锁更多创作功能和存储空间。支持扫码支付，包月优惠。',
  openGraph: {
    title: '订阅会员 | CS互动短剧',
    description: '订阅会员解锁更多创作功能。',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
