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
} from 'lucide-react';

interface Stats {
  totalWorks: number;
  pendingWorks: number;
  totalViews: number;
  totalLikes: number;
  totalUsers: number;
  todayViews: number;
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
  const [recentWorks, setRecentWorks] = useState<RecentWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟数据
    setStats({
      totalWorks: 128,
      pendingWorks: 5,
      totalViews: 45623,
      totalLikes: 3421,
      totalUsers: 892,
      todayViews: 1234,
    });
    setRecentWorks([
      {
        id: '1',
        name: '迷失的时空',
        author: '创作者A',
        status: 'pending',
        viewCount: 0,
        likeCount: 0,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        name: '星河恋曲',
        author: '创作者B',
        status: 'approved',
        viewCount: 2156,
        likeCount: 256,
        createdAt: '2024-01-14T08:00:00Z',
      },
      {
        id: '3',
        name: '深海迷踪',
        author: '创作者A',
        status: 'pending',
        viewCount: 0,
        likeCount: 0,
        createdAt: '2024-01-13T12:00:00Z',
      },
      {
        id: '4',
        name: '魔法学院',
        author: '创作者C',
        status: 'approved',
        viewCount: 3421,
        likeCount: 412,
        createdAt: '2024-01-12T15:00:00Z',
      },
    ]);
    setIsLoading(false);
  }, []);

  const statCards = [
    { label: '作品总数', value: stats.totalWorks, icon: FileVideo, color: 'text-blue-400' },
    { label: '待审核', value: stats.pendingWorks, icon: Clock, color: 'text-yellow-400' },
    { label: '总播放量', value: stats.totalViews, icon: Eye, color: 'text-green-400' },
    { label: '总点赞数', value: stats.totalLikes, icon: Heart, color: 'text-pink-400' },
    { label: '用户总数', value: stats.totalUsers, icon: Users, color: 'text-purple-400' },
    { label: '今日播放', value: stats.todayViews, icon: TrendingUp, color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
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

      {/* 快捷操作 */}
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h2 className="text-white font-medium mb-4">快捷操作</h2>
        <div className="flex gap-3">
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
            href="/admin/categories"
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            <span className="text-sm">分类管理</span>
          </Link>
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
  );
}
