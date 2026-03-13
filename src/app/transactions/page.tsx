'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Gift,
  ShoppingCart,
  Wallet,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  transaction_type: 'recharge' | 'spend' | 'earn' | 'reward' | 'admin_add' | 'admin_deduct';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  project_id?: string;
}

const transactionTypeConfig = {
  recharge: { label: '充值', icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/20' },
  spend: { label: '购买作品', icon: ShoppingCart, color: 'text-red-400', bg: 'bg-red-500/20' },
  earn: { label: '作品收入', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20' },
  reward: { label: '发布奖励', icon: Gift, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  admin_add: { label: '管理员充值', icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  admin_deduct: { label: '管理员扣除', icon: TrendingDown, color: 'text-orange-400', bg: 'bg-orange-500/20' },
};

export default function TransactionsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions();
    }
  }, [isAuthenticated, user, page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supabase_token');
      const response = await fetch(`/api/user/beans?transactions=true&page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || 0);
        setTotalEarned(data.totalEarned || 0);
        setTotalSpent(data.totalSpent || 0);
        setTransactions(data.transactions || []);
        setTotalPages(Math.ceil((data.totalTransactions || 0) / limit));
      }
    } catch (error) {
      console.error('获取交易记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isIncome = (type: string) => ['recharge', 'earn', 'reward', 'admin_add'].includes(type);

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
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-1 text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs">返回</span>
              </Link>
              <div className="h-4 w-px bg-zinc-700" />
              <h1 className="font-medium">交易记录</h1>
            </div>
            
            <Link href="/pricing" className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-full hover:bg-purple-500/30 transition-colors">
              <Coins className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">{balance.toLocaleString()} 豆</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Coins className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs text-zinc-400">当前余额</span>
            </div>
            <div className="text-2xl font-bold">{balance.toLocaleString()}</div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs text-zinc-400">累计收入</span>
            </div>
            <div className="text-2xl font-bold text-green-400">+{totalEarned.toLocaleString()}</div>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-xs text-zinc-400">累计支出</span>
            </div>
            <div className="text-2xl font-bold text-red-400">-{totalSpent.toLocaleString()}</div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="flex gap-3 mb-6">
          <Link href="/pricing" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Coins className="w-4 h-4 mr-2" />
              充值快乐豆
            </Button>
          </Link>
          <Link href="/earnings" className="flex-1">
            <Button variant="outline" className="w-full border-zinc-700">
              <TrendingUp className="w-4 h-4 mr-2" />
              收入统计
            </Button>
          </Link>
        </div>

        {/* 交易列表 */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-700">
            <h2 className="font-medium text-sm">交易明细</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无交易记录</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-700">
              {transactions.map((tx) => {
                const config = transactionTypeConfig[tx.transaction_type];
                const Icon = config.icon;
                const income = isIncome(tx.transaction_type);

                return (
                  <div key={tx.id} className="px-4 py-3 hover:bg-zinc-700/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{config.label}</div>
                          <div className="text-xs text-zinc-400">{tx.description || '-'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${income ? 'text-green-400' : 'text-red-400'}`}>
                          {income ? '+' : '-'}{tx.amount}
                        </div>
                        <div className="text-xs text-zinc-500">{formatDate(tx.created_at)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-4 border-t border-zinc-700">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-zinc-700 text-zinc-300 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-zinc-400 text-sm">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-zinc-700 text-zinc-300 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
