'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  BookOpen,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  Plus,
  Share2,
  Heart,
  Eye,
  Flame,
  Star,
  Filter,
  MessageCircle,
  X,
  Mail,
  Send,
} from 'lucide-react';
import Link from 'next/link';

// 分类配置
const CATEGORIES = [
  { id: 'all', name: '全部', icon: '🎬' },
  { id: 'romance', name: '言情', icon: '💕' },
  { id: 'suspense', name: '悬疑', icon: '🔍' },
  { id: 'scifi', name: '科幻', icon: '🚀' },
  { id: 'fantasy', name: '奇幻', icon: '✨' },
  { id: 'adventure', name: '冒险', icon: '🗺️' },
  { id: 'campus', name: '校园', icon: '🎓' },
  { id: 'legal', name: '普法', icon: '⚖️' },
  { id: 'comedy', name: '喜剧', icon: '😄' },
  { id: 'other', name: '其他', icon: '📖' },
];

// 排序选项
const SORT_OPTIONS = [
  { id: 'popular', name: '最热门', icon: Flame },
  { id: 'newest', name: '最新发布', icon: Star },
  { id: 'mostLiked', name: '最多点赞', icon: Heart },
  { id: 'mostEarned', name: '收入最高', icon: '💰' },
];

// 价格筛选选项
const PRICE_FILTERS = [
  { id: 'all', name: '全部', icon: '🎬' },
  { id: 'free', name: '免费观看', icon: '🆓' },
  { id: 'paid', name: '付费观看', icon: '💎' },
];

interface PublicProject {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  shareCode: string;
  viewCount: number;
  likeCount: number;
  category: string;
  categoryName: string;
  beansPrice: number;
  totalBeansEarned: number;
  isFree: boolean;
  tags?: string[];
  createdAt: string;
  author: {
    name: string;
    avatar?: string;
  };
  isLiked?: boolean;
}

function HomePageContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从URL获取初始值
  const initialCategory = searchParams.get('category') || 'all';
  const initialSort = searchParams.get('sort') || 'popular';
  
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('all');
  
  // 联系管理员弹窗
  const [showContactDialog, setShowContactDialog] = useState(false);

  // 获取或创建访客ID
  const [visitorId, setVisitorId] = useState<string>('');
  
  useEffect(() => {
    // 从localStorage获取或创建访客ID
    let vid = localStorage.getItem('visitor_id');
    if (!vid) {
      vid = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', vid);
    }
    setVisitorId(vid);
  }, []);

  // 加载公开项目
  const fetchPublicProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        sort: selectedSort,
        priceFilter: selectedPriceFilter,
        userId: visitorId,
      });
      
      const response = await fetch(`/api/projects/public?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPublicProjects(data.projects || []);
      }
    } catch (error) {
      console.error('加载公开项目失败:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [selectedCategory, selectedSort, selectedPriceFilter, visitorId]);

  useEffect(() => {
    if (visitorId) {
      fetchPublicProjects();
    }
  }, [fetchPublicProjects, visitorId]);

  // 更新URL参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    }
    if (selectedSort !== 'popular') {
      params.set('sort', selectedSort);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [selectedCategory, selectedSort]);

  // 点赞项目
  const handleLike = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/projects/${projectId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: visitorId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 更新本地状态
        setPublicProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              likeCount: data.liked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1),
              isLiked: data.liked,
            };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      {/* 顶部导航 */}
      <header className="bg-black/20 backdrop-blur border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-pink-500">
                <Play className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">CS 互动短剧</h1>
                <p className="text-[10px] text-gray-400">全景交互平台</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <Link href="/tutorial">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-7 text-xs">
                  <BookOpen className="mr-1 h-3 w-3" />
                  软件教程
                </Button>
              </Link>
              <Link href={isAuthenticated ? '/dashboard' : '/auth'}>
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-7 text-xs">
                  {isAuthenticated ? '我的项目' : '登录'}
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-8 px-3">
        <div className="container mx-auto text-center">
          <Badge className="mb-3 bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] px-2 py-0.5">
            <Sparkles className="w-3 h-3 mr-1" />
            全新体验
          </Badge>
          <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">
            沉浸式互动短剧
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              你的选择改变故事
            </span>
          </h2>
          <p className="mx-auto mb-4 max-w-xl text-xs text-gray-300">
            在360度全景场景中探索故事世界，与角色互动，做出影响剧情的关键选择。
            每一个决定都将带你走向不同的结局。
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-7 text-xs">
                <Plus className="mr-1 h-3 w-3" />
                开始创作
              </Button>
            </Link>
            <Link href="#projects">
              <Button size="sm" variant="outline" className="border-white/20 bg-white text-gray-900 hover:bg-gray-100 h-7 text-xs">
                <Play className="mr-1 h-3 w-3" />
                立即体验
              </Button>
            </Link>
          </div>
        </div>

        {/* 背景装饰 */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-6 px-3">
        <div className="container mx-auto">
          <h3 className="mb-3 text-center text-lg font-bold text-white">
            核心特性
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="border-white/10 bg-white/5 backdrop-blur-sm rounded-lg p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/20">
                <Play className="h-4 w-4 text-purple-400" />
              </div>
              <h4 className="text-white text-sm font-medium">全景场景</h4>
              <p className="text-gray-400 text-xs mt-1">
                360度沉浸式场景，自由探索每一个角落
              </p>
            </div>

            <div className="border-white/10 bg-white/5 backdrop-blur-sm rounded-lg p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-pink-500/20">
                <Users className="h-4 w-4 text-pink-400" />
              </div>
              <h4 className="text-white text-sm font-medium">互动角色</h4>
              <p className="text-gray-400 text-xs mt-1">
                与生动的角色对话，影响他们的命运
              </p>
            </div>

            <div className="border-white/10 bg-white/5 backdrop-blur-sm rounded-lg p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/20">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <h4 className="text-white text-sm font-medium">多结局</h4>
              <p className="text-gray-400 text-xs mt-1">
                你的选择决定故事走向，解锁不同结局
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Projects Section */}
      <section id="projects" className="py-6 px-3">
        <div className="container mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                热门作品
              </h3>
              <p className="mt-0.5 text-gray-400 text-xs">
                体验创作者们的精彩作品，分享给好友
              </p>
            </div>
            <Link href="/explore">
              <Button size="sm" variant="outline" className="border-white/20 bg-white text-gray-900 hover:bg-gray-100 h-7 text-xs">
                查看全部
              </Button>
            </Link>
          </div>

          {/* 分类筛选 */}
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* 排序选项 */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-xs text-gray-300">排序：</span>
              {SORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedSort(option.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                      selectedSort === option.id
                        ? 'bg-purple-500/30 text-purple-200'
                        : 'text-gray-200 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    {typeof Icon === 'string' ? Icon : <Icon className="w-3 h-3" />}
                    {option.name}
                  </button>
                );
              })}
            </div>
            
            <div className="h-4 w-px bg-gray-700" />
            
            {/* 价格筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">价格：</span>
              {PRICE_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedPriceFilter(filter.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                    selectedPriceFilter === filter.id
                      ? 'bg-purple-500/30 text-purple-200'
                      : 'text-gray-200 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {filter.icon}
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

          {isLoadingProjects ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-800/50 rounded-lg overflow-hidden animate-pulse">
                  <div className="h-32 bg-gray-700" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : publicProjects.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {publicProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/play/${project.shareCode}`}
                  className="group overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm rounded-lg transition-all hover:border-purple-500/50 hover:bg-white/10"
                >
                  {/* 封面 */}
                  <div className="relative h-32 bg-gradient-to-br from-purple-600 to-pink-600">
                    {project.coverImage && (
                      <img
                        src={project.coverImage}
                        alt={project.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* 分类标签 */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge className="bg-black/50 text-white text-[10px] px-1.5 py-0">
                        {project.categoryName}
                      </Badge>
                      {project.beansPrice > 0 ? (
                        <Badge className="bg-amber-500/80 text-white text-[10px] px-1.5 py-0">
                          💎 {project.beansPrice}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/80 text-white text-[10px] px-1.5 py-0">
                          🆓 免费
                        </Badge>
                      )}
                    </div>
                    
                    {/* 播放按钮 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-purple-600 ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* 项目信息 */}
                  <div className="p-3">
                    <h4 className="font-medium text-white truncate text-sm">{project.name}</h4>
                    <p className="text-gray-300 text-[11px] line-clamp-2 mb-2">
                      {project.description || '暂无描述'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {project.viewCount}
                        </span>
                        <button
                          onClick={(e) => handleLike(e, project.id)}
                          className={`flex items-center gap-1 transition-colors ${
                            project.isLiked 
                              ? 'text-pink-500' 
                              : 'hover:text-pink-400'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${project.isLiked ? 'fill-current' : ''}`} />
                          {project.likeCount}
                        </button>
                      </div>
                      <span className="flex items-center gap-1 text-purple-400">
                        <Share2 className="w-3 h-3" />
                        分享
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800/30 rounded-lg">
              <Play className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-1">暂无该分类的作品</p>
              <p className="text-gray-500 text-xs mb-3">换个分类看看，或者成为第一个创作者</p>
              <Link href="/dashboard">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  开始创作
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-3">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">
              开始创作你的互动短剧
            </h3>
            <p className="text-gray-300 text-xs mb-4">
              无需编程，拖拽式编辑器，轻松创建沉浸式互动体验
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Plus className="w-4 h-4 mr-1" />
                免费开始
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-3" suppressHydrationWarning>
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">
              © 2024 CS 互动短剧 · 全景交互平台
            </p>
            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={() => setShowContactDialog(true)}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                联系管理员
              </button>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                💎 充值中心
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 悬浮联系按钮 */}
      <button
        onClick={() => setShowContactDialog(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-40"
        title="联系管理员"
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </button>

      {/* 联系管理员弹窗 */}
      {showContactDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl max-w-sm w-full overflow-hidden">
            {/* 头部 */}
            <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
              <h3 className="font-medium text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                联系管理员
              </h3>
              <button
                onClick={() => setShowContactDialog(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-4 space-y-4">
              {/* 微信 */}
              <div className="bg-zinc-700/50 rounded-lg p-4 text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">💬</span>
                </div>
                <p className="text-white font-medium mb-1">微信客服</p>
                <p className="text-zinc-400 text-xs mb-3">扫描二维码或搜索微信号</p>
                <div className="bg-zinc-600 rounded px-3 py-2 text-center">
                  <p className="text-white text-sm font-mono">CS_Service</p>
                </div>
              </div>

              {/* 邮箱 */}
              <div className="flex items-center gap-3 p-3 bg-zinc-700/50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-400 text-xs">邮箱</p>
                  <p className="text-white text-sm">support@cs-interactive.com</p>
                </div>
              </div>

              {/* 在线时间 */}
              <div className="flex items-center gap-3 p-3 bg-zinc-700/50 rounded-lg">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-400 text-xs">在线时间</p>
                  <p className="text-white text-sm">工作日 9:00 - 18:00</p>
                </div>
              </div>

              {/* 提示 */}
              <p className="text-xs text-zinc-500 text-center">
                如有问题或建议，欢迎随时联系我们
              </p>
            </div>

            {/* 底部 */}
            <div className="px-4 py-3 border-t border-zinc-700">
              <button
                onClick={() => setShowContactDialog(false)}
                className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 包装组件
function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}

export default HomePage;
