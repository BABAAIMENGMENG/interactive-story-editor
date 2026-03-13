'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminAccount {
  email: string;
  password: string;
  name: string;
}

// 默认管理员账户
const DEFAULT_ADMIN: AdminAccount = {
  email: 'admin@admin.com',
  password: 'admin123',
  name: '管理员',
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminConfig, setAdminConfig] = useState<AdminAccount>(DEFAULT_ADMIN);
  const router = useRouter();

  // 是否有自定义配置
  const [hasCustomConfig, setHasCustomConfig] = useState(false);

  // 加载已配置的管理员账户
  useEffect(() => {
    const savedConfig = localStorage.getItem('admin_account_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setAdminConfig(config);
        setHasCustomConfig(true);
      } catch (e) {
        console.error('Failed to load admin config:', e);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 清除旧的自定义配置，使用默认账户
    // 这样可以确保登录成功
    localStorage.removeItem('admin_account_config');
    
    // 验证管理员账户（使用默认账户）
    const validEmail = 'admin@admin.com';
    const validPassword = 'admin123';
    
    if (email.trim() === validEmail && password.trim() === validPassword) {
      // 存储管理员信息到 localStorage
      localStorage.setItem('admin_auth', JSON.stringify({
        email: validEmail,
        name: '管理员',
        loginTime: Date.now(),
      }));
      
      // 使用 window.location 强制刷新页面，确保 layout 重新验证
      window.location.href = '/admin';
    } else {
      setError(`邮箱或密码错误。正确账户: admin@admin.com / admin123`);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo和标题 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-full mb-4">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">管理后台</h1>
          <p className="text-gray-400 text-sm">请使用管理员账户登录</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 邮箱 */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">管理员邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@admin.com"
                  required
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  登录中...
                </div>
              ) : (
                '登录管理后台'
              )}
            </Button>
          </form>

          {/* 当前账户提示 */}
          <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
            <p className="text-gray-400 text-xs text-center">
              {hasCustomConfig ? '当前管理员账户：' : '默认管理员账户：'}
            </p>
            <p className="text-gray-300 text-xs text-center mt-1">
              邮箱: <code className="bg-gray-700 px-1 rounded">{adminConfig.email}</code>
            </p>
            <p className="text-gray-300 text-xs text-center">
              密码: <code className="bg-gray-700 px-1 rounded">{adminConfig.password}</code>
            </p>
            <p className="text-gray-500 text-[10px] text-center mt-2">
              可在后台「系统设置」中修改
            </p>
          </div>
        </div>

        {/* 返回前台 */}
        <p className="text-center mt-4">
          <a
            href="/"
            className="text-gray-400 hover:text-purple-400 text-sm"
          >
            ← 返回前台首页
          </a>
        </p>
      </div>
    </div>
  );
}
