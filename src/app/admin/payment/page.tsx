'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Check,
  Image as ImageIcon,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
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
      qrCodeUrl: '',
      name: '微信支付',
    },
    alipay: {
      enabled: true,
      qrCodeUrl: '',
      name: '支付宝',
    },
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const wechatInputRef = useRef<HTMLInputElement>(null);
  const alipayInputRef = useRef<HTMLInputElement>(null);

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/admin/payment');
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
        }
      } catch (error) {
        console.error('加载配置失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

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
      showMessage('error', '请上传图片文件');
      return;
    }

    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', '图片大小不能超过10MB');
      return;
    }

    setUploading(method);

    try {
      // 创建表单数据
      const formData = new FormData();
      formData.append('file', file);

      console.log('开始上传收款码...');

      // 上传到服务器
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('上传响应:', data);

      if (data.success && data.url) {
        // 更新配置
        const newConfig = {
          ...config,
          [method]: {
            ...config[method],
            qrCodeUrl: data.url,
          },
        };
        setConfig(newConfig);
        
        // 自动保存到数据库
        const saveResponse = await fetch('/api/admin/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConfig),
        });
        
        const saveData = await saveResponse.json();
        
        if (saveResponse.ok && saveData.success) {
          showMessage('success', '收款码上传成功');
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } else {
          showMessage('error', saveData.error || '保存失败，请重试');
        }
      } else {
        showMessage('error', data.error || '上传失败，请重试');
      }
    } catch (error) {
      console.error('上传失败:', error);
      showMessage('error', '上传失败，请检查网络连接');
    } finally {
      setUploading(null);
    }
  };

  // 保存配置
  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', '配置保存成功');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        showMessage('error', data.error || '保存失败，请重试');
      }
    } catch (error) {
      console.error('保存失败:', error);
      showMessage('error', '保存失败，请检查网络连接');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            message.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-2 hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 说明 */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-medium mb-2">收款码配置</h3>
        <p className="text-gray-400 text-sm">
          上传微信和支付宝收款码，用户充值时会显示对应二维码进行扫码支付。
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
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <span className="text-xs">暂无收款码</span>
                </div>
              )}
            </div>
          </div>

          {/* 上传按钮 */}
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
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {uploading === 'wechat' ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                上传收款码
              </>
            )}
          </Button>
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
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <span className="text-xs">暂无收款码</span>
                </div>
              )}
            </div>
          </div>

          {/* 上传按钮 */}
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
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {uploading === 'alipay' ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                上传收款码
              </>
            )}
          </Button>
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
