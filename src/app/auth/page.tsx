'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called', { email, password, isLogin });
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        console.log('Calling signIn...');
        const result = await signIn(email, password);
        console.log('signIn result:', result);
        if (result.error) {
          setError(result.error);
        } else {
          console.log('Login success, redirecting to dashboard');
          router.push('/dashboard');
        }
      } else {
        console.log('Calling signUp...');
        const result = await signUp(email, password, name);
        console.log('signUp result:', result);
        if (result.error) {
          setError(result.error);
        } else {
          console.log('Register success, redirecting to dashboard');
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('发生错误，请重试');
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

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-3">
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

          {/* 分隔线 */}
          <div className="flex items-center gap-2 my-3">
            <Separator className="flex-1 bg-zinc-700" />
            <span className="text-zinc-500 text-[10px]">或</span>
            <Separator className="flex-1 bg-zinc-700" />
          </div>

          {/* 访客模式 */}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700 h-7 text-xs"
            onClick={() => router.push('/')}
          >
            以访客身份继续
          </Button>
        </div>

        {/* 底部信息 */}
        <p className="text-center text-zinc-500 text-[10px] mt-3">
          {isLogin ? '还没有账户？' : '已有账户？'}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="ml-1 text-purple-400 hover:text-purple-300"
          >
            {isLogin ? '立即注册' : '立即登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
