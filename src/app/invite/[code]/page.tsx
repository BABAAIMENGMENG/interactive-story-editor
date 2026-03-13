'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Gift, Users, Gem, Sparkles, Check, Loader2 } from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.code as string;

  const [isLoading, setIsLoading] = useState(true);
  const [inviterInfo, setInviterInfo] = useState<{ name: string } | null>(null);
  const [visitorId, setVisitorId] = useState<string>('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取访客ID
  useEffect(() => {
    let vid = localStorage.getItem('visitor_id');
    if (!vid) {
      vid = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', vid);
    }
    setVisitorId(vid);
  }, []);

  // 检查邀请码有效性
  useEffect(() => {
    const checkInvite = async () => {
      if (!inviteCode) {
        setIsLoading(false);
        return;
      }

      try {
        // 这里可以添加一个API来验证邀请码有效性
        // 暂时直接显示页面
        setInviterInfo({ name: '好友' });
      } catch (e) {
        console.error('验证邀请码失败:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkInvite();
  }, [inviteCode]);

  // 保存邀请码并跳转
  const handleAcceptInvite = () => {
    if (inviteCode) {
      localStorage.setItem('pending_invite_code', inviteCode.toUpperCase());
    }
    router.push('/');
  };

  // 领取奖励（已登录用户）
  const handleClaimReward = async () => {
    if (!visitorId || isClaiming) return;

    setIsClaiming(true);
    setError(null);

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: visitorId, inviteCode }),
      });

      const data = await response.json();

      if (data.success) {
        setClaimed(true);
        localStorage.removeItem('pending_invite_code');
      } else {
        setError(data.message || data.error || '领取失败');
      }
    } catch (e) {
      console.error('领取奖励失败:', e);
      setError('网络错误，请重试');
    } finally {
      setIsClaiming(false);
    }
  };

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">验证邀请码...</p>
        </div>
      </div>
    );
  }

  // 已领取
  if (claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">奖励已到账</h1>
          <p className="text-gray-400 mb-6">
            恭喜您获得 <span className="text-amber-400 font-bold">50</span> 快乐豆奖励！
          </p>
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            开始探索
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-gray-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full">
        {/* 顶部装饰 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-4 shadow-lg shadow-amber-500/30">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">好友邀请奖励</h1>
          <p className="text-gray-400">
            {inviterInfo?.name || '好友'} 邀请您加入互动短剧
          </p>
        </div>

        {/* 奖励信息 */}
        <div className="space-y-4 mb-8">
          {/* 双方奖励 */}
          <div className="bg-gray-700/50 rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300 text-sm">邀请人</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Gem className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">+50</span>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-600" />
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <span className="text-gray-300 text-sm">您</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Gem className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">+50</span>
              </div>
            </div>
          </div>

          {/* 邀请码展示 */}
          <div className="bg-gray-700/30 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm mb-2">邀请码</p>
            <p className="text-2xl font-mono font-bold text-white tracking-widest">
              {inviteCode?.toUpperCase()}
            </p>
          </div>

          {/* 活动说明 */}
          <div className="text-sm text-gray-400 space-y-2">
            <p>• 新用户注册即可领取 50 快乐豆</p>
            <p>• 邀请人也将获得 50 快乐豆奖励</p>
            <p>• 每个用户只能使用一次邀请码</p>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* 按钮 */}
        <div className="space-y-3">
          <Button
            onClick={handleAcceptInvite}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg rounded-xl"
          >
            接受邀请，立即注册
          </Button>
          <Button
            onClick={handleClaimReward}
            disabled={isClaiming}
            variant="outline"
            className="w-full py-4 rounded-xl border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                领取中...
              </>
            ) : (
              '我已注册，领取奖励'
            )}
          </Button>
        </div>

        {/* 底部 */}
        <p className="text-center text-gray-500 text-xs mt-6">
          © 2026 互动短剧 - 分享创作，收获快乐
        </p>
      </div>
    </div>
  );
}
