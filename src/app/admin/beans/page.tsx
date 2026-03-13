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
  Search,
  ChevronLeft,
  ChevronRight,
  MinusCircle,
  X,
  AlertTriangle,
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

interface UserWithBeans {
  id: string;
  email: string;
  display_name: string;
  beans_balance: number;
  created_at: string;
}

export default function AdminBeansPage() {
  const [stats, setStats] = useState<BeansStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 用户列表相关
  const [users, setUsers] = useState<UserWithBeans[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // 核销弹窗相关
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBeans | null>(null);
  const [writeOffAmount, setWriteOffAmount] = useState('');
  const [writeOffReason, setWriteOffReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [writeOffError, setWriteOffError] = useState('');

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [userPage, userSearch]);

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

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: userPage.toString(),
        limit: '10',
        search: userSearch,
      });
      const res = await fetch(`/api/admin/beans/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setTotalUsers(data.total);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
    setIsLoadingUsers(false);
  };

  const openWriteOffModal = (user: UserWithBeans) => {
    setSelectedUser(user);
    setWriteOffAmount('');
    setWriteOffReason('');
    setWriteOffError('');
    setShowWriteOffModal(true);
  };

  const handleWriteOff = async () => {
    if (!selectedUser) return;
    
    const amount = parseInt(writeOffAmount);
    if (!amount || amount <= 0) {
      setWriteOffError('请输入有效的核销金额');
      return;
    }
    
    if (amount > selectedUser.beans_balance) {
      setWriteOffError(`核销金额不能超过用户余额 (${selectedUser.beans_balance} 豆)`);
      return;
    }
    
    if (!writeOffReason.trim()) {
      setWriteOffError('请填写核销原因');
      return;
    }
    
    setIsSubmitting(true);
    setWriteOffError('');
    
    try {
      const res = await fetch('/api/admin/beans/write-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: amount,
          reason: writeOffReason,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // 更新本地用户列表
        setUsers(users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, beans_balance: data.data.newBalance }
            : u
        ));
        // 刷新统计数据
        fetchStats();
        setShowWriteOffModal(false);
      } else {
        setWriteOffError(data.error || '核销失败');
      }
    } catch (error) {
      setWriteOffError('网络错误，请重试');
    }
    
    setIsSubmitting(false);
  };

  const getTransactionTypeLabel = (type: string) => {
    const types: Record<string, { label: string; color: string; bgColor: string }> = {
      recharge: { label: '充值', color: 'text-green-400', bgColor: 'bg-green-500/20' },
      purchase: { label: '购买', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
      reward: { label: '奖励', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
      refund: { label: '退款', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
      write_off: { label: '核销', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    };
    return types[type] || { label: type, color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
  };

  const filteredTransactions = stats?.recentTransactions?.filter((tx) => {
    if (filterType !== 'all' && tx.transaction_type !== filterType) return false;
    if (searchQuery && !tx.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) || [];

  const totalPages = Math.ceil(totalUsers / 10);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            快乐豆管理
          </h1>
          <p className="text-gray-400 text-sm mt-1">管理用户快乐豆余额与核销</p>
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

      {/* 用户余额列表 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            用户余额列表
            <span className="text-gray-500 text-sm font-normal">(共 {totalUsers} 人)</span>
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
              placeholder="搜索用户邮箱/昵称..."
              className="pl-9 w-64 bg-gray-700 border-gray-600 text-white text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-left py-3 px-4">用户</th>
                <th className="text-left py-3 px-4">邮箱</th>
                <th className="text-right py-3 px-4">余额</th>
                <th className="text-left py-3 px-4">注册时间</th>
                <th className="text-center py-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    加载中...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-400 text-sm font-medium">
                            {(user.display_name || user.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white text-sm">
                          {user.display_name || '未设置昵称'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {user.email}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-medium ${user.beans_balance > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {user.beans_balance.toLocaleString()} 豆
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        onClick={() => openWriteOffModal(user)}
                        disabled={user.beans_balance <= 0}
                        variant="outline"
                        size="sm"
                        className={`${
                          user.beans_balance > 0 
                            ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                            : 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <MinusCircle className="w-4 h-4 mr-1" />
                        核销
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    {userSearch ? '未找到匹配的用户' : '暂无用户数据'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 用户列表分页 */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-700 flex items-center justify-between">
            <p className="text-gray-500 text-sm">
              显示 {(userPage - 1) * 10 + 1}-{Math.min(userPage * 10, totalUsers)} / 共 {totalUsers} 用户
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={userPage === 1}
                onClick={() => setUserPage(p => p - 1)}
                className="bg-gray-700 border-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-gray-400 text-sm px-3">{userPage} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={userPage >= totalPages}
                onClick={() => setUserPage(p => p + 1)}
                className="bg-gray-700 border-gray-600"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
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
              <option value="write_off">核销</option>
            </select>
          </div>
        </div>

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
                        <span className={tx.transaction_type === 'purchase' || tx.transaction_type === 'write_off' ? 'text-red-400' : 'text-green-400'}>
                          {tx.transaction_type === 'purchase' || tx.transaction_type === 'write_off' ? '-' : '+'}{Math.abs(tx.amount)}
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

        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            共 {filteredTransactions.length} 条记录
          </p>
        </div>
      </div>

      {/* 核销弹窗 */}
      {showWriteOffModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-medium flex items-center gap-2">
                <MinusCircle className="w-5 h-5 text-red-400" />
                核销欢乐豆
              </h3>
              <button
                onClick={() => setShowWriteOffModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 用户信息 */}
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">目标用户</p>
                <p className="text-white font-medium">
                  {selectedUser.display_name || '未设置昵称'}
                </p>
                <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                <p className="text-yellow-400 text-sm mt-2">
                  当前余额: {selectedUser.beans_balance.toLocaleString()} 豆
                </p>
              </div>

              {/* 核销金额 */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">核销金额 *</label>
                <Input
                  type="number"
                  value={writeOffAmount}
                  onChange={(e) => setWriteOffAmount(e.target.value)}
                  placeholder="输入核销数量"
                  max={selectedUser.beans_balance}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* 核销原因 */}
              <div>
                <label className="text-gray-400 text-sm mb-1 block">核销原因 *</label>
                <textarea
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value)}
                  placeholder="请填写核销原因..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm resize-none focus:outline-none focus:border-purple-500"
                  rows={3}
                />
              </div>

              {/* 错误提示 */}
              {writeOffError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {writeOffError}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowWriteOffModal(false)}
                  variant="outline"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300"
                >
                  取消
                </Button>
                <Button
                  onClick={handleWriteOff}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? '处理中...' : '确认核销'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 说明信息 */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h4 className="text-white font-medium mb-2">📊 数据说明</h4>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• <span className="text-yellow-400">用户总余额</span>：所有用户当前持有的快乐豆总数</li>
          <li>• <span className="text-green-400">平台抽成</span>：每笔购买交易平台收取 10% 服务费</li>
          <li>• <span className="text-blue-400">创作者收入</span>：购买金额的 90% 归创作者所有</li>
          <li>• <span className="text-purple-400">奖励发放</span>：作品审核通过后自动发放奖励豆</li>
          <li>• <span className="text-red-400">核销功能</span>：管理员可扣除指定用户的欢乐豆余额</li>
        </ul>
      </div>
    </div>
  );
}
