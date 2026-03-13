'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Coins,
  RefreshCw,
} from 'lucide-react';

interface RechargeOrder {
  id: string;
  user_id: string;
  package_id: string;
  beans_amount: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: 'wechat' | 'alipay';
  payment_proof: string;
  remark: string;
  created_at: string;
  reviewed_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

export default function AdminRechargePage() {
  const [orders, setOrders] = useState<RechargeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  // 查看凭证弹窗
  const [viewProof, setViewProof] = useState<string | null>(null);
  
  // 拒绝原因弹窗
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '20',
      });
      
      const response = await fetch(`/api/admin/recharge?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 审核通过
  const handleApprove = async (orderId: string) => {
    if (!confirm('确定通过该订单？通过后快乐豆将自动到账。')) return;
    
    try {
      const response = await fetch('/api/admin/recharge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'approve' }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchOrders();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      alert('操作失败');
    }
  };

  // 拒绝订单
  const handleReject = async () => {
    if (!rejectOrderId) return;
    
    try {
      const response = await fetch('/api/admin/recharge', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: rejectOrderId, 
          action: 'reject',
          reason: rejectReason,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setRejectOrderId(null);
        setRejectReason('');
        fetchOrders();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('拒绝失败:', error);
      alert('操作失败');
    }
  };

  // 过滤订单
  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.profiles?.name?.toLowerCase().includes(searchLower) ||
      order.profiles?.email?.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
            <Clock className="w-3 h-3" />
            待审核
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
            <CheckCircle className="w-3 h-3" />
            已通过
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
            <XCircle className="w-3 h-3" />
            已拒绝
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentMethod = (method: string) => {
    return method === 'wechat' ? '💚 微信' : '💙 支付宝';
  };

  return (
    <div className="space-y-6">
      {/* 标题和统计 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">充值审核</h1>
          <p className="text-gray-400 text-sm mt-1">审核用户的充值订单，通过后自动到账</p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          className="border-gray-600 text-gray-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名、邮箱..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="text-gray-400 text-sm">
          共 {total} 条记录
        </div>
      </div>

      {/* 订单列表 */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {statusFilter === 'pending' ? '暂无待审核订单' : '暂无订单记录'}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50 border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">套餐</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">金额</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">支付方式</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">付款凭证</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{order.profiles?.name || '未知'}</div>
                      <div className="text-xs text-gray-500">{order.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-white">{order.beans_amount.toLocaleString()} 豆</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-purple-400 font-medium">¥{order.price}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{getPaymentMethod(order.payment_method)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {order.payment_proof ? (
                        <button
                          onClick={() => setViewProof(order.payment_proof)}
                          className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          查看
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">无</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {order.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(order.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30"
                          >
                            <Check className="w-3 h-3" />
                            通过
                          </button>
                          <button
                            onClick={() => setRejectOrderId(order.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30"
                          >
                            <X className="w-3 h-3" />
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">已处理</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 分页 */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            className="border-gray-600 text-gray-300"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="text-gray-400 py-2">
            第 {page} 页
          </span>
          <Button
            variant="outline"
            className="border-gray-600 text-gray-300"
            onClick={() => setPage((p) => p + 1)}
            disabled={orders.length < 20}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 查看凭证弹窗 */}
      {viewProof && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewProof(null)}>
          <div className="bg-gray-800 rounded-lg p-4 max-w-lg max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-white font-medium">付款凭证</h3>
            </div>
            <img
              src={viewProof}
              alt="付款凭证"
              className="max-w-full mx-auto rounded"
            />
            <div className="mt-4 text-center">
              <Button onClick={() => setViewProof(null)} variant="outline" className="border-gray-600 text-gray-300">
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 拒绝原因弹窗 */}
      {rejectOrderId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => {
          setRejectOrderId(null);
          setRejectReason('');
        }}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-medium mb-4">拒绝原因</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因（可选）"
              className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => {
                  setRejectOrderId(null);
                  setRejectReason('');
                }}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300"
              >
                取消
              </Button>
              <Button
                onClick={handleReject}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                确认拒绝
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
