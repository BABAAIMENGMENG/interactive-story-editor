'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Share2,
  Play,
  Heart,
  Eye,
  Copy,
  Check,
  MessageCircle,
  QrCode,
  ThumbsUp,
  X,
  Loader2,
  Gem,
} from 'lucide-react';
import { GameViewer } from '@/components/game/GameViewer';

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  projectData: {
    scenes: any[];
    canvasWidth?: number;
    canvasHeight?: number;
    globalVariables?: any[];
  };
  viewCount: number;
  likeCount: number;
  category?: string;
  categoryName?: string;
  createdAt: string;
  author?: {
    name: string;
    avatar?: string;
  };
  isLiked?: boolean;
  beansPrice?: number;
  isPurchased?: boolean;
  isFree?: boolean;
}

function PlayPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareCode = params.shareCode as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');
  
  // 购买相关状态
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [userBeansBalance, setUserBeansBalance] = useState<number | null>(null);
  
  // 从 URL 参数初始化自动播放
  useEffect(() => {
    const auto = searchParams.get('auto');
    if (auto === 'true') {
      setIsPlaying(true);
    }
  }, [searchParams]);

  // 获取或创建访客ID
  useEffect(() => {
    let vid = localStorage.getItem('visitor_id');
    if (!vid) {
      vid = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', vid);
    }
    setVisitorId(vid);
  }, []);

  // 加载项目数据
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/share/${shareCode}?userId=${visitorId}`);
        if (!response.ok) {
          throw new Error('作品不存在或已下架');
        }
        const data = await response.json();
        setProject(data.project);
        
        // 获取用户快乐豆余额
        if (visitorId) {
          try {
            const beansRes = await fetch(`/api/user/beans?userId=${visitorId}`);
            if (beansRes.ok) {
              const beansData = await beansRes.json();
              setUserBeansBalance(beansData.balance || 0);
            }
          } catch (e) {
            console.error('获取快乐豆余额失败:', e);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (shareCode && visitorId) {
      fetchProject();
    }
  }, [shareCode, visitorId]);

  // 点赞
  const handleLike = async () => {
    if (!project || isLiking || !visitorId) return;
    
    setIsLiking(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: visitorId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProject(prev => prev ? {
          ...prev,
          likeCount: data.liked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
          isLiked: data.liked,
        } : null);
      }
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // 购买作品
  const handlePurchase = async () => {
    if (!project || !visitorId || isPurchasing) return;
    
    setIsPurchasing(true);
    setPurchaseError(null);
    
    try {
      const response = await fetch(`/api/projects/${project.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: visitorId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 更新项目状态为已购买
        setProject(prev => prev ? {
          ...prev,
          isPurchased: true,
        } : null);
        
        // 更新用户余额
        if (data.newBalance !== undefined) {
          setUserBeansBalance(data.newBalance);
        }
        
        // 关闭弹窗，开始播放
        setShowPurchaseDialog(false);
        setIsPlaying(true);
      } else if (data.alreadyPurchased) {
        // 已购买过，直接播放
        setProject(prev => prev ? { ...prev, isPurchased: true } : null);
        setShowPurchaseDialog(false);
        setIsPlaying(true);
      } else {
        setPurchaseError(data.error || '购买失败');
      }
    } catch (error) {
      console.error('购买失败:', error);
      setPurchaseError('网络错误，请重试');
    } finally {
      setIsPurchasing(false);
    }
  };

  // 点击开始体验
  const handleStartPlay = () => {
    if (!project) return;
    
    // 如果是付费作品且未购买，显示购买弹窗
    if (!project.isFree && !project.isPurchased) {
      setShowPurchaseDialog(true);
      return;
    }
    
    // 已购买或免费作品，直接播放
    setIsPlaying(true);
  };

  // 获取分享链接
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/play/${shareCode}?auto=true`
    : '';

  // 复制链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 微信分享
  const handleWechatShare = () => {
    // 生成二维码或调用微信分享
    setShowShare(true);
  };

  // QQ分享
  const handleQQShare = () => {
    const shareTitle = project?.name || '互动短剧';
    const shareDesc = project?.description || '来玩这个互动短剧吧！';
    const shareImg = project?.coverImage || '';
    
    // QQ分享链接
    const qqShareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&desc=${encodeURIComponent(shareDesc)}&pics=${encodeURIComponent(shareImg)}`;
    
    window.open(qqShareUrl, '_blank', 'width=600,height=400');
  };

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误
  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || '作品不存在'}</p>
          <Button onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  // 游戏界面
  if (isPlaying) {
    return (
      <div className="relative">
        {/* 返回按钮 */}
        <button
          onClick={() => setIsPlaying(false)}
          className="absolute top-2 left-2 z-50 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
        >
          ← 返回
        </button>
        
        {/* 游戏内容 */}
        <GameViewer 
          scenes={project.projectData.scenes}
          canvasWidth={project.projectData.canvasWidth || 1920}
          canvasHeight={project.projectData.canvasHeight || 1080}
          globalVariables={project.projectData.globalVariables || []}
        />
      </div>
    );
  }

  // 预览页面
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      {/* 封面区域 */}
      <div className="relative h-[50vh] min-h-[300px]">
        {/* 背景 */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: project.coverImage 
              ? `url(${project.coverImage})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* 内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
          {/* 分类标签 */}
          {project.categoryName && (
            <div className="mb-2">
              <span className="bg-purple-500/50 text-white text-xs px-2 py-0.5 rounded-full">
                {project.categoryName}
              </span>
            </div>
          )}
          
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-2">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-sm md:text-base text-gray-200 text-center max-w-xl mb-6">
              {project.description}
            </p>
          )}
          
          {/* 开始按钮 */}
          <Button
            size="lg"
            onClick={handleStartPlay}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-6 rounded-full shadow-lg shadow-purple-500/30"
          >
            <Play className="w-5 h-5 mr-2" />
            {project.isFree ? '开始体验' : project.isPurchased ? '开始体验' : `💎 ${project.beansPrice} 豆 解锁`}
          </Button>
          
          {/* 统计 */}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {project.viewCount} 次播放
            </span>
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1 transition-colors ${
                project.isLiked 
                  ? 'text-pink-400' 
                  : 'hover:text-pink-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${project.isLiked ? 'fill-current' : ''}`} />
              {project.likeCount} 点赞
            </button>
          </div>
        </div>
      </div>

      {/* 分享区域 */}
      <div className="max-w-xl mx-auto p-4">
        {/* 分享按钮 */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            分享给好友
          </h3>
          
          <div className="flex gap-2">
            {/* 微信分享 */}
            <Button
              variant="outline"
              onClick={handleWechatShare}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              微信
            </Button>
            
            {/* QQ分享 */}
            <Button
              variant="outline"
              onClick={handleQQShare}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-0"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.99-1.73 6.65-2.87 7.97-3.44 3.8-1.6 4.59-1.88 5.1-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/>
              </svg>
              QQ
            </Button>
            
            {/* 复制链接 */}
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  复制链接
                </>
              )}
            </Button>
          </div>
          
          {/* 链接展示 */}
          <div className="mt-3 p-2 bg-gray-900/50 rounded text-xs text-gray-400 break-all">
            {shareUrl}
          </div>
        </div>

        {/* 二维码弹窗 */}
        {showShare && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-xs w-full">
              <h3 className="text-white font-medium mb-4 text-center">微信扫码分享</h3>
              
              {/* 二维码占位 */}
              <div className="bg-white p-4 rounded-lg mb-4">
                <div className="w-48 h-48 mx-auto flex items-center justify-center text-gray-500">
                  <QrCode className="w-32 h-32 text-gray-400" />
                </div>
              </div>
              
              <p className="text-gray-400 text-xs text-center mb-4">
                打开微信扫一扫，分享给好友
              </p>
              
              <Button
                variant="outline"
                onClick={() => setShowShare(false)}
                className="w-full"
              >
                关闭
              </Button>
            </div>
          </div>
        )}

        {/* 购买弹窗 */}
        {showPurchaseDialog && project && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Gem className="w-5 h-5 text-amber-400" />
                  解锁作品
                </h3>
                <button
                  onClick={() => setShowPurchaseDialog(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                <p className="text-white font-medium mb-2">{project.name}</p>
                <p className="text-gray-400 text-sm mb-3">{project.description || '暂无描述'}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">价格</span>
                  <span className="text-amber-400 font-medium">💎 {project.beansPrice} 快乐豆</span>
                </div>
              </div>
              
              {/* 用户余额 */}
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">我的余额</span>
                  <span className={userBeansBalance && userBeansBalance >= (project.beansPrice || 0) ? 'text-green-400' : 'text-red-400'}>
                    💎 {userBeansBalance !== null ? userBeansBalance : '...'} 豆
                  </span>
                </div>
                {userBeansBalance !== null && userBeansBalance < (project.beansPrice || 0) && (
                  <p className="text-red-400 text-xs mt-2">快乐豆不足，请先充值</p>
                )}
              </div>
              
              {/* 错误提示 */}
              {purchaseError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">{purchaseError}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseDialog(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handlePurchase}
                  disabled={isPurchasing || (userBeansBalance !== null && userBeansBalance < (project.beansPrice || 0))}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      购买中...
                    </>
                  ) : (
                    <>确认购买</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 作者信息 */}
        {project.author && (
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                {project.author.avatar ? (
                  <img 
                    src={project.author.avatar} 
                    alt={project.author.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium">
                    {project.author.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div>
                <p className="text-white font-medium">{project.author.name}</p>
                <p className="text-gray-400 text-xs">
                  创建于 {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PlayPageContent />
    </Suspense>
  );
}
