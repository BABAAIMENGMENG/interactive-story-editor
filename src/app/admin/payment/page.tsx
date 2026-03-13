'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  QrCode,
  Upload,
  Check,
  X,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';

interface PaymentConfig {
  wechat: {
    enabled: boolean;
    qrCodeUrl: string;
    name: string;
  };
  alipay: {
    enabled: boolean;
    qrCodeUrl: string;
    name: string;
  };
}

export default function AdminPaymentPage() {
  const [config, setConfig] = useState<PaymentConfig>({
    wechat: {
      enabled: true,
      qrCodeUrl: '/payment/wechat-qr.png',
      name: '微信支付',
    },
    alipay: {
      enabled: true,
      qrCodeUrl: '/payment/alipay-qr.png',
      name: '支付宝',
    },
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const wechatInputRef = useRef<HTMLInputElement>(null);
  const alipayInputRef = useRef<HTMLInputElement>(null);

  // 切换支付方式启用状态
  const handleToggle = (method: 'wechat' | 'alipay') => {
    setConfig({
      ...config,
      [method]: {
        ...config[method],
        enabled: !config[method].enabled,
      },
    });
    setSaved(false);
  };

  // 上传收款码
  const handleUpload = async (method: 'wechat' | 'alipay', file: File) => {
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    setUploading(method);

    try {
      // 创建表单数据
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'payment');

      // 上传到服务器
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        setConfig({
          ...config,
          [method]: {
            ...config[method],
            qrCodeUrl: data.url,
          },
        });
        setSaved(false);
      } else {
        throw new Error(data.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(null);
    }
  };

  // 保存配置
  const handleSave = async () => {
    try {
      // 保存到数据库或配置文件
      const response = await fetch('/api/admin/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  return (
    <div className="space-y-6">
      {/* 说明 */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-medium mb-2">收款码配置</h3>
        <p className="text-gray-400 text-sm">
          上传微信和支付宝收款码，用户订阅时会显示对应二维码进行扫码支付。
        </p>
      </div>

      {/* 支付方式配置 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 微信支付 */}
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h4 className="text-white font-medium">微信支付</h4>
                <p className="text-gray-400 text-xs">微信扫码收款</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('wechat')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                config.wechat.enabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  config.wechat.enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 二维码预览 */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="w-40 h-40 mx-auto flex items-center justify-center">
              {config.wechat.qrCodeUrl ? (
                <img
                  src={config.wechat.qrCodeUrl}
                  alt="微信收款码"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full flex-col items-center justify-center text-gray-400 ${config.wechat.qrCodeUrl ? 'hidden' : 'flex'}`}
              >
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-xs">暂无收款码</span>
              </div>
            </div>
          </div>

          {/* 上传按钮 */}
          <div className="flex gap-2">
            <input
              ref={wechatInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload('wechat', file);
              }}
            />
            <Button
              onClick={() => wechatInputRef.current?.click()}
              disabled={uploading === 'wechat'}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {uploading === 'wechat' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading === 'wechat' ? '上传中...' : '上传收款码'}
            </Button>
          </div>
        </div>

        {/* 支付宝 */}
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h4 className="text-white font-medium">支付宝</h4>
                <p className="text-gray-400 text-xs">支付宝扫码收款</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('alipay')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                config.alipay.enabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  config.alipay.enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 二维码预览 */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="w-40 h-40 mx-auto flex items-center justify-center">
              {config.alipay.qrCodeUrl ? (
                <img
                  src={config.alipay.qrCodeUrl}
                  alt="支付宝收款码"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full flex-col items-center justify-center text-gray-400 ${config.alipay.qrCodeUrl ? 'hidden' : 'flex'}`}
              >
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-xs">暂无收款码</span>
              </div>
            </div>
          </div>

          {/* 上传按钮 */}
          <div className="flex gap-2">
            <input
              ref={alipayInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload('alipay', file);
              }}
            />
            <Button
              onClick={() => alipayInputRef.current?.click()}
              disabled={uploading === 'alipay'}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {uploading === 'alipay' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading === 'alipay' ? '上传中...' : '上传收款码'}
            </Button>
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              已保存
            </>
          ) : (
            '保存配置'
          )}
        </Button>
      </div>

      {/* 说明 */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h4 className="text-gray-300 font-medium mb-2">获取收款码</h4>
        <div className="space-y-2 text-gray-400 text-sm">
          <p><strong>微信：</strong>微信 → 我 → 服务 → 收付款 → 二维码收款 → 保存图片</p>
          <p><strong>支付宝：</strong>支付宝 → 首页 → 收付款 → 保存收款码图片</p>
          <p className="text-yellow-400/80">⚠️ 注意：收款码图片会保存到服务器，请确保图片清晰可扫描</p>
        </div>
      </div>
    </div>
  );
}
