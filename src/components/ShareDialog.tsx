'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Check, 
  Link2, 
  MessageCircle, 
  QrCode,
  Gift,
  Users,
  Share2
} from 'lucide-react';
import { 
  getShareLink, 
  getInviteLink, 
  shareToWechat, 
  shareToWeibo, 
  shareToQQ,
  nativeShare,
  downloadQRCode 
} from '@/lib/share';
import { getApiUrl } from '@/lib/api-config';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'project' | 'invite';
  shareCode?: string;
  inviteCode?: string;
  title?: string;
  description?: string;
  coverImage?: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  type,
  shareCode,
  inviteCode,
  title = '分享作品',
  description = '',
  coverImage,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteInfo, setInviteInfo] = useState<{
    code: string;
    link: string;
    count: number;
    rewards: number;
  } | null>(null);

  useEffect(() => {
    if (type === 'project' && shareCode) {
      setLink(getShareLink(shareCode));
    } else if (type === 'invite') {
      // 获取邀请信息
      fetchInviteInfo();
    }
  }, [type, shareCode]);

  const fetchInviteInfo = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(getApiUrl('/api/invite'), { headers });
      const data = await response.json();
      
      if (data.success) {
        setInviteInfo({
          code: data.inviteCode,
          link: data.inviteLink,
          count: data.inviteCount || 0,
          rewards: data.totalInviteRewards || 0,
        });
        setInviteLink(data.inviteLink);
      }
    } catch (e) {
      console.error('获取邀请信息失败:', e);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  const handleShare = async (platform: string) => {
    const shareLink = type === 'project' ? link : inviteLink;
    const shareTitle = type === 'project' ? title : '邀请你加入互动故事编辑器';
    
    switch (platform) {
      case 'wechat':
        await shareToWechat(shareTitle || '', shareLink);
        break;
      case 'weibo':
        window.open(shareToWeibo(shareTitle || '', shareLink, coverImage), '_blank');
        break;
      case 'qq':
        window.open(shareToQQ(shareTitle || '', shareLink, description, coverImage), '_blank');
        break;
      case 'native':
        await nativeShare({
          title: shareTitle || '',
          text: description,
          url: shareLink,
        });
        break;
    }
  };

  const handleDownloadQRCode = async () => {
    const shareLink = type === 'project' ? link : inviteLink;
    const filename = type === 'project' ? `作品分享-${shareCode}` : '邀请二维码';
    await downloadQRCode(shareLink, filename);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {type === 'project' ? '分享作品' : '邀请好友'}
          </DialogTitle>
          <DialogDescription>
            {type === 'project' 
              ? '将作品分享给好友，让更多人看到你的创作'
              : '邀请好友注册，双方都可获得奖励'}
          </DialogDescription>
        </DialogHeader>

        {type === 'invite' && inviteInfo && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-purple-500/10 rounded-lg p-3 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-purple-400" />
              <p className="text-2xl font-bold text-white">{inviteInfo.count}</p>
              <p className="text-xs text-gray-400">已邀请人数</p>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-3 text-center">
              <Gift className="w-5 h-5 mx-auto mb-1 text-amber-400" />
              <p className="text-2xl font-bold text-amber-400">{inviteInfo.rewards}</p>
              <p className="text-xs text-gray-400">累计奖励(豆)</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* 链接展示 */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">
              {type === 'project' ? '作品链接' : '邀请链接'}
            </label>
            <div className="flex gap-2">
              <Input
                value={type === 'project' ? link : inviteLink}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(type === 'project' ? link : inviteLink)}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 邀请码展示 */}
          {type === 'invite' && inviteInfo && (
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">我的邀请码</p>
              <p className="text-xl font-mono font-bold text-white tracking-widest">
                {inviteInfo.code}
              </p>
            </div>
          )}

          {/* 分享按钮 */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => handleShare('wechat')}
            >
              <MessageCircle className="w-6 h-6 text-green-500" />
              <span className="text-xs">微信</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => handleShare('weibo')}
            >
              <MessageCircle className="w-6 h-6 text-red-500" />
              <span className="text-xs">微博</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => handleShare('qq')}
            >
              <MessageCircle className="w-6 h-6 text-blue-500" />
              <span className="text-xs">QQ</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={handleDownloadQRCode}
            >
              <QrCode className="w-6 h-6 text-purple-500" />
              <span className="text-xs">二维码</span>
            </Button>
          </div>

          {/* 奖励说明 */}
          {type === 'invite' && (
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-3">
              <p className="text-sm text-gray-300 mb-2">邀请奖励规则</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• 好友通过你的链接注册，双方各得 <span className="text-amber-400 font-bold">50</span> 快乐豆</li>
                <li>• 邀请人数无上限，多邀多得</li>
                <li>• 快乐豆可用于购买付费作品</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
