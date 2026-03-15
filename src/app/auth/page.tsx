'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Phone, MessageCircle } from 'lucide-react';

type LoginMode = 'email' | 'phone';

export default function AuthPage() {
  const [loginMode, setLoginMode] = useState<LoginMode>('phone');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 手机号登录相关
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { signIn, signUp, sendSmsCode, signInWithPhone } = useAuth();
  const router = useRouter();

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 邮箱表单提交
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          router.push('/dashboard');
        }
      } else {
        const result = await signUp(email, password, name);
        if (result.error) {
          setError(result.error);
        } else {
          router.push('/dashboard');
        }
      }
    } catch {
      setError('发生错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    if (countdown > 0) return;
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await sendSmsCode(phone);
      if (result.error) {
        setError(result.error);
      } else {
        setCountdown(60);
      }
    } catch {
      setError('发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [phone, countdown, sendSmsCode]);

  // 手机号登录
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signInWithPhone(phone, code);
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900/20 to-zinc-900 flex items-center justify-center p-3 text-sm">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xs relative z-10">
        {/* Logo和标题 */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              全景互动
            </span>
          </div>
          <p className="text-zinc-400 text-xs">
            创建沉浸式互动短剧和全景体验
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-zinc-800/80 backdrop-blur-xl border border-zinc-700 rounded-xl p-4 shadow-2xl">
          {/* 切换登录方式 */}
          <div className="flex mb-4 bg-zinc-700/50 rounded-md p-0.5">
            <button
              onClick={() => { setLoginMode('phone'); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                loginMode === 'phone'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Phone className="w-3 h-3" />
              手机号
            </button>
            <button
              onClick={() => { setLoginMode('email'); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                loginMode === 'email'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="w-3 h-3" />
              邮箱
            </button>
          </div>

          {/* 手机号登录表单 */}
          {loginMode === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-zinc-300 text-xs">手机号</Label>
                <div className="relative">
                  <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="请输入手机号"
                    required
                    className="pl-8 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="code" className="text-zinc-300 text-xs">验证码</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MessageCircle className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6位验证码"
                      required
                      maxLength={6}
                      className="pl-8 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 h-8 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || isLoading || phone.length !== 11}
                    className="h-8 text-xs px-3 border-zinc-600 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Button>
                </div>
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-md p-2 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* 提交按钮 */}
              <Button
                type="submit"
                disabled={isLoading || phone.length !== 11 || code.length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-8 text-xs"
              >
                {isLoading ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    处理中...
                  </div>
                ) : (
                  '登录 / 注册'
                )}
              </Button>

              <p className="text-zinc-500 text-[10px] text-center">
                未注册的手机号将自动创建账号
              </p>
            </form>
          )}

          {/* 邮箱登录表单 */}
          {loginMode === 'email' && (
            <>
              {/* 切换登录/注册 */}
              <div className="flex mb-4 bg-zinc-700/50 rounded-md p-0.5">
                <button
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isLogin
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  登录
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                    !isLogin
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  注册
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {!isLogin && (
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-zinc-300 text-xs">昵称</Label>
                    <div className="relative">
                      <User className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="您的昵称"
                        className="pl-8 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-zinc-300 text-xs">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="pl-8 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-zinc-300 text-xs">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="至少6位密码"
                      required
                      minLength={6}
                      className="pl-8 pr-8 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 h-8 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 错误信息 */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-md p-2 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-8 text-xs"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      处理中...
                    </div>
                  ) : (
                    isLogin ? '登录' : '创建账户'
                  )}
                </Button>
              </form>
            </>
          )}

          {/* 分隔线 */}
          <div className="flex items-center gap-2 my-3">
            <Separator className="flex-1 bg-zinc-700" />
            <span className="text-zinc-500 text-[10px]">或</span>
            <Separator className="flex-1 bg-zinc-700" />
          </div>

          {/* 访客模式 */}
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full border-zinc-600 text-zinc-400 hover:text-white hover:bg-zinc-700 h-8 text-xs"
          >
            先逛逛再说
          </Button>
        </div>

        {/* 底部提示 */}
        <p className="text-zinc-600 text-[10px] text-center mt-3">
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
