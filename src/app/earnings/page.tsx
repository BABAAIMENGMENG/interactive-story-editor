'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Coins,
  TrendingUp,
  Eye,
  Heart,
  FileVideo,
  DollarSign,
  Calendar,
  Loader2,
  Crown,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  cover_image?: string;
  beans_price: number;
  total_beans_earned: number;
  view_count: number;
  like_count: number;
  created_at: string;
  review_status: string;
}

interface Earning {
  id: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  project_id?: string;
}

export default function EarningsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalWorksEarnings, setTotalWorksEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [totalWorks, setTotalWorks] = useState(0);
  const [paidWorks, setPaidWorks] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentEarnings, setRecentEarnings] = useState<Earning[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchEarnings();
    }
  }, [isAuthenticated, user]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supabase_token');
      const response = await fetch('/api/user/earnings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || 0);
        setTotalEarnings(data.totalEarnings || 0);
        setTotalWorksEarnings(data.totalWorksEarnings || 0);
        setMonthEarnings(data.monthEarnings || 0);
        setTodayEarnings(data.todayEarnings || 0);
        setTotalWorks(data.totalWorks || 0);
        setPaidWorks(data.paidWorks || 0);
        setTotalViews(data.totalViews || 0);
        setTotalLikes(data.totalLikes || 0);
        setProjects(data.projects || []);
        setRecentEarnings(data.recentEarnings || []);
      }
    } catch (error) {
      console.error('获取收入统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">请先登录</p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="bg-zinc-800/80 backdrop-blur border-b border-zinc-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-1 text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs">返回</span>
              </Link>
              <div className="h-4 w-px bg-zinc-700" />
              <h1 className="font-medium">收入统计</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/transactions" className="text-xs text-zinc-400 hover:text-white">
                交易记录
              </Link>
              <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-full">
                <Coins className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">{balance.toLocaleString()} 豆</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* 收入概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-white/80" />
                  <span className="text-xs text-white/80">累计收入</span>
                </div>
                <div className="text-2xl font-bold">{totalEarnings.toLocaleString()} 豆</div>
                <div className="text-xs text-white/60 mt-1">
                  作品收入：{totalWorksEarnings.toLocaleString()} 豆
                </div>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-zinc-400">本月收入</span>
                </div>
                <div className="text-2xl font-bold text-green-400">+{monthEarnings.toLocaleString()}</div>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs text-zinc-400">今日收入</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400">+{todayEarnings.toLocaleString()}</div>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-zinc-400">付费作品</span>
                </div>
                <div className="text-2xl font-bold">{paidWorks} / {totalWorks}</div>
              </div>
            </div>

            {/* 数据统计 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-center">
                <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold">{totalViews.toLocaleString()}</div>
                <div className="text-xs text-zinc-400">总浏览量</div>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-center">
                <Heart className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <div className="text-xl font-bold">{totalLikes.toLocaleString()}</div>
                <div className="text-xs text-zinc-400">总点赞数</div>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-center">
                <FileVideo className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-xl font-bold">{totalWorks}</div>
                <div className="text-xs text-zinc-400">发布作品</div>
              </div>
            </div>

            {/* 收入说明 */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="font-medium">收入规则</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-xs text-zinc-300">
                <div>
                  <p>• 作品被购买后，您获得90%的收入</p>
                  <p>• 作品审核通过后，获得发布奖励快乐豆</p>
                </div>
                <div>
                  <p>• 收入自动计入快乐豆余额</p>
                  <p>• 快乐豆可用于购买其他作品</p>
                </div>
              </div>
            </div>

            {/* 作品收入排行 */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
                <h2 className="font-medium text-sm">作品收入排行</h2>
                <Link href="/dashboard" className="text-xs text-purple-400 hover:text-purple-300">
                  管理作品
                </Link>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <FileVideo className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无作品</p>
                  <Link href="/editor">
                    <Button size="sm" className="mt-3 bg-purple-600 hover:bg-purple-700">
                      创作作品
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-zinc-700">
                  {projects
                    .sort((a, b) => (b.total_beans_earned || 0) - (a.total_beans_earned || 0))
                    .slice(0, 10)
                    .map((project, index) => (
                      <div key={project.id} className="px-4 py-3 hover:bg-zinc-700/30 transition-colors">
                        <div className="flex items-center gap-3">
                          {/* 排名 */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-600 text-white' :
                            'bg-zinc-700 text-zinc-400'
                          }`}>
                            {index + 1}
                          </div>

                          {/* 封面 */}
                          <div className="w-12 h-8 bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                            {project.cover_image ? (
                              <img src={project.cover_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileVideo className="w-4 h-4 text-zinc-500" />
                              </div>
                            )}
                          </div>

                          {/* 信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{project.name}</div>
                            <div className="flex items-center gap-3 text-xs text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {project.view_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {project.like_count || 0}
                              </span>
                              <span className={project.beans_price > 0 ? 'text-green-400' : 'text-zinc-500'}>
                                {project.beans_price > 0 ? `💎${project.beans_price}豆` : '免费'}
                              </span>
                            </div>
                          </div>

                          {/* 收入 */}
                          <div className="text-right">
                            <div className="font-medium text-green-400">
                              +{project.total_beans_earned || 0}
                            </div>
                            <div className="text-xs text-zinc-500">豆</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* 最近收入 */}
            {recentEarnings.length > 0 && (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-700">
                  <h2 className="font-medium text-sm">最近收入</h2>
                </div>
                <div className="divide-y divide-zinc-700">
                  {recentEarnings.slice(0, 10).map((earning) => (
                    <div key={earning.id} className="px-4 py-3 hover:bg-zinc-700/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm">{earning.description || '作品收入'}</div>
                          <div className="text-xs text-zinc-500">{formatDate(earning.created_at)}</div>
                        </div>
                        <div className="text-green-400 font-medium">+{earning.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
