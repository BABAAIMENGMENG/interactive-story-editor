'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  Check,
  Gift,
  Shield,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Upload,
  Clock,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';

// 快乐豆充值套餐
const BEANS_PACKAGES = [
  {
    id: 'beans_100',
    beans: 100,
    price: 10,
    discount: null,
    popular: false,
    description: '新手体验',
  },
  {
    id: 'beans_500',
    beans: 500,
    price: 45,
    discount: '9折',
    popular: false,
    description: '常用套餐',
  },
  {
    id: 'beans_1000',
    beans: 1000,
    price: 80,
    discount: '8折',
    popular: true,
    description: '最受欢迎',
  },
  {
    id: 'beans_5000',
    beans: 5000,
    price: 350,
    discount: '7折',
    popular: false,
    description: '超值优惠',
  },
  {
    id: 'beans_10000',
    beans: 10000,
    price: 600,
    discount: '6折',
    popular: false,
    description: '创作者首选',
  },
];

// 支付方式
const PAYMENT_METHODS = [
  { id: 'wechat', name: '微信支付', icon: '💚', color: 'green' },
  { id: 'alipay', name: '支付宝', icon: '💙', color: 'blue' },
];

interface PaymentSettings {
  paymentWechatQrcode: string;
  paymentAlipayQrcode: string;
}

interface RechargeOrder {
  id: string;
  beans_amount: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: string;
  payment_proof: string;
  created_at: string;
}

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('wechat');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [beansBalance, setBeansBalance] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | 'submitted' | null>(null);
  
  // 收款设置
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    paymentWechatQrcode: '',
    paymentAlipayQrcode: '',
  });
  
  // 付款凭证
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // 我的充值订单
  const [myOrders, setMyOrders] = useState<RechargeOrder[]>([]);

  // 获取用户快乐豆余额和设置
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchBeansBalance();
      fetchPaymentSettings();
      fetchMyOrders();
    }
  }, [isAuthenticated, user]);

  const fetchBeansBalance = async () => {
    try {
      const response = await fetch('/api/user/beans');
      if (response.ok) {
        const data = await response.json();
        setBeansBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/settings/public');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setPaymentSettings({
            paymentWechatQrcode: data.settings.paymentWechatQrcode || '',
            paymentAlipayQrcode: data.settings.paymentAlipayQrcode || '',
          });
        }
      }
    } catch (error) {
      console.error('获取支付设置失败:', error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/recharge/orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMyOrders(data.orders || []);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    }
  };

  const handlePurchase = (packageId: string) => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    setSelectedPackage(packageId);
    setShowPaymentModal(true);
    setPaymentResult(null);
    setPaymentProof('');
  };

  // 上传付款凭证
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentProof(data.url);
      } else {
        alert('上传失败，请重试');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 提交充值订单（支持自动确认）
  const handleSubmitOrder = async (autoConfirm: boolean = false) => {
    if (!selectedPackage) {
      alert('请选择套餐');
      return;
    }

    // 自动确认模式不需要凭证
    if (!autoConfirm && !paymentProof) {
      alert('请先上传付款凭证');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/recharge/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: selectedPackage,
          paymentMethod: selectedPayment,
          paymentProof,
          autoConfirm,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        if (autoConfirm && data.autoConfirmed) {
          setPaymentResult('success');
          fetchBeansBalance();
        } else {
          setPaymentResult('submitted');
        }
        fetchMyOrders();
      } else {
        setPaymentResult('failed');
      }
    } catch (error) {
      console.error('提交失败:', error);
      setPaymentResult('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPackage(null);
    setPaymentResult(null);
    setPaymentProof('');
  };

  const selectedPackageInfo = BEANS_PACKAGES.find(p => p.id === selectedPackage);
  const currentQrcode = selectedPayment === 'wechat' 
    ? paymentSettings.paymentWechatQrcode 
    : paymentSettings.paymentAlipayQrcode;

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="bg-zinc-800/80 backdrop-blur border-b border-zinc-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1 text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs">返回</span>
              </Link>
              <div className="h-4 w-px bg-zinc-700" />
              <h1 className="font-medium">购买快乐豆</h1>
            </div>
            
            {isAuthenticated && (
              <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-full">
                <Coins className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">{beansBalance} 豆</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 rounded-full mb-4">
            <Coins className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-purple-300">虚拟货币 · 平台通用</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              快乐豆充值
            </span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto">
            快乐豆是平台通用货币，用于购买付费作品。创作者可设置作品价格，观众支付后观看，平台仅抽成10%。
          </p>
        </div>

        {/* 套餐卡片 */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {BEANS_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-zinc-800/50 border rounded-xl p-4 transition-all hover:border-purple-500/50 ${
                pkg.popular ? 'border-purple-500' : 'border-zinc-700'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px]">
                    最受欢迎
                  </Badge>
                </div>
              )}
              
              {pkg.discount && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive" className="text-[10px]">
                    {pkg.discount}
                  </Badge>
                </div>
              )}

              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                
                <div className="text-2xl font-bold text-white mb-1">
                  {pkg.beans.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-400 mb-3">快乐豆</div>
                
                <div className="text-lg font-bold text-purple-400 mb-1">
                  ¥{pkg.price}
                </div>
                <div className="text-[10px] text-zinc-500 mb-3">
                  约 ¥{(pkg.price / pkg.beans).toFixed(2)}/豆
                </div>
                
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  className={`w-full h-8 text-xs ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                >
                  立即购买
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 我的充值订单 */}
        {isAuthenticated && myOrders.length > 0 && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              我的充值订单
            </h3>
            <div className="space-y-3">
              {myOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg"
                >
                  <div>
                    <div className="text-sm">
                      {order.beans_amount.toLocaleString()} 快乐豆 - ¥{order.price}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    {order.status === 'pending' && (
                      <Badge className="bg-yellow-500/20 text-yellow-400">
                        <Clock className="w-3 h-3 mr-1" />
                        待审核
                      </Badge>
                    )}
                    {order.status === 'approved' && (
                      <Badge className="bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已到账
                      </Badge>
                    )}
                    {order.status === 'rejected' && (
                      <Badge className="bg-red-500/20 text-red-400">
                        <XCircle className="w-3 h-3 mr-1" />
                        已拒绝
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            使用说明
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-white mb-2">观众</h4>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5" />
                  购买快乐豆后可观看付费作品
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5" />
                  购买后永久拥有观看权限
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5" />
                  新用户注册赠送100快乐豆
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-2">创作者</h4>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5" />
                  发布作品时可设置观看价格
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5" />
                  观众购买后获得90%收入
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5" />
                  收入自动计入快乐豆余额
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5" />
                  快乐豆可按平台规定回收
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 平台规则 */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            平台规则
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-1">10%</div>
              <div className="text-xs text-zinc-400">平台抽成比例</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-1">90%</div>
              <div className="text-xs text-zinc-400">创作者收入比例</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400 mb-1">100</div>
              <div className="text-xs text-zinc-400">新用户赠送快乐豆</div>
            </div>
          </div>
        </div>
      </main>

      {/* 支付弹窗 */}
      {showPaymentModal && selectedPackageInfo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* 提交成功 */}
            {paymentResult === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-green-400 mb-2">支付成功！</h3>
                <p className="text-zinc-400 text-sm mb-2">
                  快乐豆已自动到账
                </p>
                <p className="text-purple-400 font-bold text-lg mb-6">
                  +{selectedPackageInfo?.beans.toLocaleString()} 豆
                </p>
                <Button onClick={handleCloseModal} className="bg-green-600 hover:bg-green-700">
                  完成
                </Button>
              </div>
            ) : paymentResult === 'submitted' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-blue-400 mb-2">已提交！</h3>
                <p className="text-zinc-400 text-sm mb-2">
                  订单已提交，等待管理员审核
                </p>
                <p className="text-zinc-500 text-xs mb-6">
                  审核通过后快乐豆将自动到账
                </p>
                <Button onClick={handleCloseModal} className="bg-blue-600 hover:bg-blue-700">
                  完成
                </Button>
              </div>
            ) : paymentResult === 'failed' ? (
              /* 提交失败 */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-400 mb-2">提交失败</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  请稍后重试或联系客服
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleCloseModal} variant="outline" className="flex-1">
                    取消
                  </Button>
                  <Button onClick={() => setPaymentResult(null)} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    重试
                  </Button>
                </div>
              </div>
            ) : (
              /* 支付流程 */
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">购买 {selectedPackageInfo.beans.toLocaleString()} 快乐豆</h3>
                  <p className="text-purple-400 font-bold">¥{selectedPackageInfo.price}</p>
                </div>

                {/* 步骤提示 */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <p className="text-blue-300 text-xs">
                    📋 支付流程：选择支付方式 → 扫码付款 → 点击"我已支付" → 立即到账
                  </p>
                </div>

                {/* 支付方式选择 */}
                <div className="flex gap-3 mb-4">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                        selectedPayment === method.id
                          ? `border-${method.color}-500 bg-${method.color}-500/20`
                          : 'border-zinc-700 hover:border-zinc-600'
                      }`}
                      style={{
                        borderColor: selectedPayment === method.id 
                          ? (method.color === 'green' ? '#22c55e' : '#3b82f6')
                          : undefined,
                        backgroundColor: selectedPayment === method.id 
                          ? (method.color === 'green' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)')
                          : undefined,
                      }}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-xs">{method.name}</div>
                    </button>
                  ))}
                </div>

                {/* 收款二维码 */}
                {currentQrcode ? (
                  <div className="mb-4">
                    <p className="text-sm text-zinc-400 mb-2 text-center">扫描下方二维码付款</p>
                    <div className="bg-white rounded-lg p-4 w-48 h-48 mx-auto flex items-center justify-center">
                      <img 
                        src={currentQrcode} 
                        alt={`${selectedPayment === 'wechat' ? '微信' : '支付宝'}收款码`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 text-center mt-2">
                      请使用{selectedPayment === 'wechat' ? '微信' : '支付宝'}扫码支付 ¥{selectedPackageInfo.price}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                    <AlertCircle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-yellow-300 text-xs">
                      管理员尚未配置收款二维码
                    </p>
                    <p className="text-yellow-400 text-xs mt-1">
                      请联系客服获取付款方式
                    </p>
                  </div>
                )}

                {/* 上传付款凭证 */}
                <div className="mb-4">
                  <label className="text-sm text-zinc-400 block mb-2">
                    上传付款凭证截图
                  </label>
                  {paymentProof ? (
                    <div className="relative">
                      <div className="bg-white rounded-lg p-2 w-32 h-32 mx-auto">
                        <img 
                          src={paymentProof} 
                          alt="付款凭证"
                          className="max-w-full max-h-full object-contain mx-auto"
                        />
                      </div>
                      <button
                        onClick={() => setPaymentProof('')}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadProof}
                        disabled={isUploading}
                      />
                      <div className="border-2 border-dashed border-zinc-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors">
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 text-purple-400 mx-auto animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                            <p className="text-xs text-zinc-400">点击上传付款截图</p>
                            <p className="text-[10px] text-zinc-500 mt-1">支持 JPG、PNG 格式</p>
                          </>
                        )}
                      </div>
                    </label>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="space-y-3">
                  {/* 一键支付按钮 */}
                  <Button
                    onClick={() => handleSubmitOrder(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-11"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        我已支付，立即到账
                      </>
                    )}
                  </Button>
                  
                  {/* 分隔线 */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-zinc-700" />
                    <span className="text-xs text-zinc-500">或</span>
                    <div className="flex-1 h-px bg-zinc-700" />
                  </div>
                  
                  {/* 上传凭证方式 */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={() => handleSubmitOrder(false)}
                      variant="outline"
                      className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500/20"
                      disabled={isProcessing || !paymentProof}
                    >
                      上传凭证审核
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-zinc-500 text-center">
                    点击"我已支付"确认后自动到账 · 上传凭证需等待审核
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-zinc-500">
            CS 互动短剧 © {new Date().getFullYear()} - 快乐豆为虚拟货币，一经购买不支持退款
          </p>
        </div>
      </footer>
    </div>
  );
}
