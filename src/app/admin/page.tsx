'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileVideo,
  Users,
  Eye,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Coins,
  DollarSign,
  ShoppingCart,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface Stats {
  totalWorks: number;
  pendingWorks: number;
  totalViews: number;
  totalLikes: number;
  totalUsers: number;
  todayViews: number;
}

interface BeansStats {
  overview: {
    totalUserBalance: number;
    totalPlatformFee: number;
    totalRecharge: number;
    totalPurchase: number;
    totalReward: number;
    totalUsers: number;
    paidWorks: number;
  };
  today: {
    recharge: number;
    purchase: number;
    platformFee: number;
    newUsers: number;
  };
  month: {
    recharge: number;
    purchase: number;
  };
  recentTransactions: Array<{
    id: string;
    user_id: string;
    transaction_type: string;
    amount: number;
    platform_fee: number;
    description: string;
    created_at: string;
  }>;
}

interface RecentWork {
  id: string;
  name: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  viewCount: number;
  likeCount: number;
  createdAt: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalWorks: 0,
    pendingWorks: 0,
    totalViews: 0,
    totalLikes: 0,
    totalUsers: 0,
    todayViews: 0,
  });
  const [beansStats, setBeansStats] = useState<BeansStats | null>(null);
  const [recentWorks, setRecentWorks] = useState<RecentWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 获取基础统计
    setStats({
      totalWorks: 128,
      pendingWorks: 5,
      totalViews: 45623,
      totalLikes: 3421,
      totalUsers: 892,
      todayViews: 1234,
    });

    // 获取欢乐豆统计
    fetchBeansStats();

    setRecentWorks([
      { id: '1', name: '迷失的时空', author: '创作者A', status: 'pending', viewCount: 0, likeCount: 0, createdAt: '2024-01-15T10:00:00Z' },
      { id: '2', name: '星河恋曲', author: '创作者B', status: 'approved', viewCount: 2156, likeCount: 256, createdAt: '2024-01-14T08:00:00Z' },
      { id: '3', name: '深海迷踪', author: '创作者A', status: 'pending', viewCount: 0, likeCount: 0, createdAt: '2024-01-13T12:00:00Z' },
      { id: '4', name: '魔法学院', author: '创作者C', status: 'approved', viewCount: 3421, likeCount: 412, createdAt: '2024-01-12T15:00:00Z' },
    ]);
    setIsLoading(false);
  }, []);

  const fetchBeansStats = async () => {
    try {
      const res = await fetch('/api/admin/beans');
      const data = await res.json();
      if (data.success) {
        setBeansStats(data.stats);
      }
    } catch (error) {
      console.error('获取欢乐豆统计失败:', error);
    }
  };

  const statCards = [
    { label: '作品总数', value: stats.totalWorks, icon: FileVideo, color: 'text-blue-400' },
    { label: '待审核', value: stats.pendingWorks, icon: Clock, color: 'text-yellow-400' },
    { label: '总播放量', value: stats.totalViews, icon: Eye, color: 'text-green-400' },
    { label: '总点赞数', value: stats.totalLikes, icon: Heart, color: 'text-pink-400' },
    { label: '用户总数', value: stats.totalUsers, icon: Users, color: 'text-purple-400' },
    { label: '今日播放', value: stats.todayViews, icon: TrendingUp, color: 'text-orange-400' },
  ];

  const beansCards = beansStats ? [
    { 
      label: '用户总余额', 
      value: beansStats.overview.totalUserBalance, 
      icon: Coins, 
      color: 'text-yellow-400',
      suffix: '豆',
      desc: '所有用户持有'
    },
    { 
      label: '平台累计抽成', 
      value: beansStats.overview.totalPlatformFee, 
      icon: DollarSign, 
      color: 'text-green-400',
      suffix: '豆',
      desc: '10%服务费'
    },
    { 
      label: '总充值', 
      value: beansStats.overview.totalRecharge, 
      icon: TrendingUp, 
      color: 'text-blue-400',
      suffix: '豆',
      desc: `今日 +${beansStats.today.recharge}`
    },
    { 
      label: '总消费', 
      value: beansStats.overview.totalPurchase, 
      icon: ShoppingCart, 
      color: 'text-purple-400',
      suffix: '豆',
      desc: `今日 +${beansStats.today.purchase}`
    },
    { 
      label: '奖励发放', 
      value: beansStats.overview.totalReward, 
      icon: Gift, 
      color: 'text-pink-400',
      suffix: '豆',
      desc: '审核通过奖励'
    },
    { 
      label: '付费作品', 
      value: beansStats.overview.paidWorks, 
      icon: FileVideo, 
      color: 'text-orange-400',
      suffix: '个',
      desc: '设置价格的'
    },
  ] : [];

  const getTransactionTypeLabel = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      recharge: { label: '充值', color: 'text-green-400' },
      purchase: { label: '购买', color: 'text-blue-400' },
      reward: { label: '奖励', color: 'text-yellow-400' },
      refund: { label: '退款', color: 'text-orange-400' },
    };
    return types[type] || { label: type, color: 'text-gray-400' };
  };

  return (
    <div className="space-y-6">
      {/* 基础统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-gray-400 text-xs">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* 欢乐豆统计卡片 */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-yellow-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-medium">快乐豆统计</h2>
          </div>
          <Link
            href="/admin/beans"
            className="text-yellow-400 text-sm hover:text-yellow-300 flex items-center gap-1"
          >
            详细报表 <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        
        {isLoading || !beansStats ? (
          <div className="text-gray-400 text-sm">加载中...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {beansCards.map((card) => (
              <div
                key={card.label}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                  <span className="text-gray-400 text-xs">{card.label}</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {card.value.toLocaleString()}
                  <span className="text-sm text-gray-400 ml-1">{card.suffix}</span>
                </p>
                <p className="text-gray-500 text-xs mt-1">{card.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 快捷操作 */}
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h2 className="text-white font-medium mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/works?status=pending"
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm">待审核作品 ({stats.pendingWorks})</span>
          </Link>
          <Link
            href="/admin/works"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <FileVideo className="w-4 h-4" />
            <span className="text-sm">作品列表</span>
          </Link>
          <Link
            href="/admin/beans"
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
          >
            <Coins className="w-4 h-4" />
            <span className="text-sm">欢乐豆管理</span>
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            <span className="text-sm">分类管理</span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <span className="text-sm">系统设置</span>
          </Link>
        </div>
      </div>

      {/* 下方两栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近交易记录 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-white font-medium flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              最近交易
            </h2>
            <Link
              href="/admin/beans"
              className="text-purple-400 text-sm hover:text-purple-300"
            >
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-gray-700">
            {beansStats?.recentTransactions?.length ? (
              beansStats.recentTransactions.slice(0, 5).map((tx) => {
                const typeInfo = getTransactionTypeLabel(tx.transaction_type);
                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center`}>
                        {tx.transaction_type === 'recharge' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-400" />
                        ) : tx.transaction_type === 'purchase' ? (
                          <ShoppingCart className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Gift className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm">{tx.description || typeInfo.label}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(tx.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${tx.transaction_type === 'purchase' ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.transaction_type === 'purchase' ? '-' : '+'}{tx.amount}豆
                      </p>
                      {tx.platform_fee > 0 && (
                        <p className="text-gray-500 text-xs">平台 +{tx.platform_fee}豆</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">暂无交易记录</div>
            )}
          </div>
        </div>

        {/* 最近作品 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-white font-medium">最近作品</h2>
            <Link
              href="/admin/works"
              className="text-purple-400 text-sm hover:text-purple-300"
            >
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-gray-700">
            {recentWorks.map((work) => (
              <div
                key={work.id}
                className="p-4 flex items-center justify-between hover:bg-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      work.status === 'pending'
                        ? 'bg-yellow-400'
                        : work.status === 'approved'
                        ? 'bg-green-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <div>
                    <p className="text-white text-sm">{work.name}</p>
                    <p className="text-gray-400 text-xs">{work.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">
                      {work.status === 'pending' ? '待审核' : work.status === 'approved' ? '已通过' : '已拒绝'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {work.viewCount > 0 ? `${work.viewCount} 播放` : '新作品'}
                    </p>
                  </div>
                  {work.status === 'pending' && (
                    <Link
                      href="/admin/works"
                      className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded hover:bg-yellow-500/30"
                    >
                      去审核
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 今日数据摘要 */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-5 border border-yellow-500/20">
        <h2 className="text-white font-medium mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-yellow-400" />
          今日数据摘要
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-400 text-xs">今日充值</p>
            <p className="text-xl font-bold text-green-400">
              +{beansStats?.today.recharge || 0} <span className="text-sm text-gray-400">豆</span>
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">今日消费</p>
            <p className="text-xl font-bold text-blue-400">
              {beansStats?.today.purchase || 0} <span className="text-sm text-gray-400">豆</span>
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">平台今日收入</p>
            <p className="text-xl font-bold text-yellow-400">
              +{beansStats?.today.platformFee || 0} <span className="text-sm text-gray-400">豆</span>
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">今日新用户</p>
            <p className="text-xl font-bold text-purple-400">
              +{beansStats?.today.newUsers || 0} <span className="text-sm text-gray-400">人</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
