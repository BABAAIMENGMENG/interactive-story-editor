'use client';

import { useEffect, useState } from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Gift,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  rechargeStats: Record<string, { count: number; amount: number }>;
  recentTransactions: Transaction[];
}

interface Transaction {
  id: string;
  user_id: string;
  project_id: string;
  transaction_type: string;
  amount: number;
  platform_fee: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export default function AdminBeansPage() {
  const [stats, setStats] = useState<BeansStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/beans');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('获取统计失败:', error);
    }
    setIsLoading(false);
  };

  const getTransactionTypeLabel = (type: string) => {
    const types: Record<string, { label: string; color: string; bgColor: string }> = {
      recharge: { label: '充值', color: 'text-green-400', bgColor: 'bg-green-500/20' },
      purchase: { label: '购买', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
      reward: { label: '奖励', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
      refund: { label: '退款', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    };
    return types[type] || { label: type, color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
  };

  const filteredTransactions = stats?.recentTransactions?.filter((tx) => {
    if (filterType !== 'all' && tx.transaction_type !== filterType) return false;
    if (searchQuery && !tx.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            快乐豆管理
          </h1>
          <p className="text-gray-400 text-sm mt-1">查看平台快乐豆流转统计</p>
        </div>
        <Button
          onClick={fetchStats}
          variant="outline"
          className="bg-gray-800 border-gray-700 text-gray-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 rounded-xl p-5 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">用户总余额</span>
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.overview.totalUserBalance.toLocaleString() || 0}
            <span className="text-sm text-gray-400 ml-1">豆</span>
          </p>
          <p className="text-gray-500 text-xs mt-2">所有用户持有的快乐豆</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-xl p-5 border border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">平台累计抽成</span>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.overview.totalPlatformFee.toLocaleString() || 0}
            <span className="text-sm text-gray-400 ml-1">豆</span>
          </p>
          <p className="text-gray-500 text-xs mt-2">每笔交易抽成 10%</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl p-5 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">总充值</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.overview.totalRecharge.toLocaleString() || 0}
            <span className="text-sm text-gray-400 ml-1">豆</span>
          </p>
          <p className="text-gray-500 text-xs mt-2">今日 +{stats?.today.recharge || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-xl p-5 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">总消费</span>
            <ShoppingCart className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.overview.totalPurchase.toLocaleString() || 0}
            <span className="text-sm text-gray-400 ml-1">豆</span>
          </p>
          <p className="text-gray-500 text-xs mt-2">今日 {stats?.today.purchase || 0}</p>
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 本月数据 */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            本月数据
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">本月充值</span>
              <span className="text-green-400 font-medium">
                +{stats?.month.recharge.toLocaleString() || 0} 豆
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">本月消费</span>
              <span className="text-blue-400 font-medium">
                {stats?.month.purchase.toLocaleString() || 0} 豆
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">奖励发放</span>
              <span className="text-yellow-400 font-medium">
                {stats?.overview.totalReward.toLocaleString() || 0} 豆
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">付费作品数</span>
              <span className="text-purple-400 font-medium">
                {stats?.overview.paidWorks || 0} 个
              </span>
            </div>
          </div>
        </div>

        {/* 充值套餐统计 */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            充值套餐统计
          </h3>
          <div className="space-y-3">
            {stats?.rechargeStats && Object.entries(stats.rechargeStats).map(([key, data]) => {
              const pkgInfo: Record<string, { label: string; price: string }> = {
                beans_100: { label: '100豆', price: '¥10' },
                beans_500: { label: '500豆', price: '¥45' },
                beans_1000: { label: '1000豆', price: '¥80' },
                beans_5000: { label: '5000豆', price: '¥350' },
              };
              const info = pkgInfo[key] || { label: key, price: '' };
              return (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <p className="text-white text-sm">{info.label}</p>
                    <p className="text-gray-500 text-xs">{info.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm">{data.count} 次</p>
                    <p className="text-gray-500 text-xs">{data.amount} 豆</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 今日数据 */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            今日数据
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">今日充值</span>
              <span className="text-green-400 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {stats?.today.recharge || 0} 豆
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">今日消费</span>
              <span className="text-blue-400 font-medium flex items-center gap-1">
                <ShoppingCart className="w-3 h-3" />
                {stats?.today.purchase || 0} 豆
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">平台今日收入</span>
              <span className="text-yellow-400 font-medium flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                +{stats?.today.platformFee || 0} 豆
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">今日新用户</span>
              <span className="text-purple-400 font-medium flex items-center gap-1">
                <Users className="w-3 h-3" />
                +{stats?.today.newUsers || 0} 人
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 交易记录列表 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-400" />
            交易记录
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索交易..."
                className="pl-9 w-48 bg-gray-700 border-gray-600 text-white text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="all">全部类型</option>
              <option value="recharge">充值</option>
              <option value="purchase">购买</option>
              <option value="reward">奖励</option>
            </select>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-left py-3 px-4">类型</th>
                <th className="text-left py-3 px-4">描述</th>
                <th className="text-right py-3 px-4">金额</th>
                <th className="text-right py-3 px-4">平台抽成</th>
                <th className="text-right py-3 px-4">余额</th>
                <th className="text-right py-3 px-4">时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const typeInfo = getTransactionTypeLabel(tx.transaction_type);
                  return (
                    <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${typeInfo.bgColor} ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white text-sm">
                        {tx.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={tx.transaction_type === 'purchase' ? 'text-red-400' : 'text-green-400'}>
                          {tx.transaction_type === 'purchase' ? '-' : '+'}{tx.amount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-yellow-400">
                        {tx.platform_fee > 0 ? `+${tx.platform_fee}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400 text-sm">
                        {tx.balance_after?.toLocaleString() || '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 text-xs">
                        {new Date(tx.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    暂无交易记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            共 {filteredTransactions.length} 条记录
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="bg-gray-700 border-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-400 text-sm px-3">第 {currentPage} 页</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              className="bg-gray-700 border-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 说明信息 */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h4 className="text-white font-medium mb-2">📊 数据说明</h4>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• <span className="text-yellow-400">用户总余额</span>：所有用户当前持有的快乐豆总数</li>
          <li>• <span className="text-green-400">平台抽成</span>：每笔购买交易平台收取 10% 服务费</li>
          <li>• <span className="text-blue-400">创作者收入</span>：购买金额的 90% 归创作者所有</li>
          <li>• <span className="text-purple-400">奖励发放</span>：作品审核通过后自动发放奖励豆</li>
        </ul>
      </div>
    </div>
  );
}
