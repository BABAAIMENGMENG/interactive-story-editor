'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Heart,
  Eye,
  Flame,
  Star,
  Search,
  Share2,
  ArrowLeft,
  Filter,
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

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从URL获取初始值
  const initialCategory = searchParams.get('category') || 'all';
  const initialSort = searchParams.get('sort') || 'popular';
  const initialSearch = searchParams.get('q') || '';
  
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // 获取或创建访客ID
  const [visitorId, setVisitorId] = useState<string>('');
  
  useEffect(() => {
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
      
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/projects/public?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPublicProjects(data.projects || []);
      }
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [selectedCategory, selectedSort, selectedPriceFilter, visitorId, searchQuery]);

  useEffect(() => {
    if (visitorId) {
      fetchPublicProjects();
    }
  }, [fetchPublicProjects, visitorId]);

  // 更新URL参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedSort !== 'popular') params.set('sort', selectedSort);
    if (searchQuery) params.set('q', searchQuery);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/explore${newUrl}`, { scroll: false });
  }, [selectedCategory, selectedSort, searchQuery, router]);

  // 点赞处理
  const handleLike = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/projects/${projectId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: visitorId }),
      });
      
      if (response.ok) {
        setPublicProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              isLiked: !p.isLiked,
              likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1,
            };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublicProjects();
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-sm">
      {/* Header */}
      <header className="bg-zinc-800/80 backdrop-blur border-b border-zinc-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-10">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1 text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs">返回首页</span>
              </Link>
              <div className="h-4 w-px bg-zinc-700" />
              <h1 className="text-white font-medium">探索作品</h1>
            </div>
            <Link href="/auth">
              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-7 text-xs">
                登录
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* 搜索栏 */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="搜索作品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </form>

        {/* 分类筛选 */}
        <div className="mb-4">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 排序选项 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-xs text-zinc-300">排序：</span>
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedSort(opt.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    selectedSort === opt.id
                      ? 'bg-purple-500/40 text-white'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {typeof Icon === 'string' ? Icon : <Icon className="w-3 h-3" />}
                  {opt.name}
                </button>
              );
            })}
          </div>
          
          <div className="h-4 w-px bg-zinc-600" />
          
          {/* 价格筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-300">价格：</span>
            {PRICE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedPriceFilter(filter.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  selectedPriceFilter === filter.id
                    ? 'bg-purple-500/40 text-white'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {filter.icon}
                {filter.name}
              </button>
            ))}
          </div>
        </div>

        {/* 作品列表 */}
        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : publicProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {publicProjects.map((project) => (
              <Link
                key={project.id}
                href={`/play/${project.shareCode}`}
                className="group overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg transition-all hover:border-purple-500/50 hover:bg-white/10"
              >
                {/* 封面 */}
                <div className="relative h-40 bg-gradient-to-br from-purple-600 to-pink-600">
                  {project.coverImage ? (
                    <img
                      src={project.coverImage}
                      alt={project.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-600/50 to-pink-600/50">
                      <Play className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* 分类标签 */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 border border-white/20">
                      {project.categoryName}
                    </Badge>
                    {project.beansPrice > 0 ? (
                      <Badge className="bg-amber-500/90 text-white text-[10px] px-1.5 py-0.5 border border-amber-400/50">
                        💎 {project.beansPrice}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/90 text-white text-[10px] px-1.5 py-0.5 border border-green-400/50">
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
                  <p className="text-gray-200 text-[10px] line-clamp-2 mb-2">
                    {project.description || '暂无描述'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-gray-300">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {project.viewCount}
                      </span>
                      <button
                        onClick={(e) => handleLike(e, project.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          project.isLiked 
                            ? 'text-pink-400' 
                            : 'text-gray-300 hover:text-pink-400'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${project.isLiked ? 'fill-current' : ''}`} />
                        {project.likeCount}
                      </button>
                    </div>
                    <span className="flex items-center gap-1 text-purple-300 hover:text-purple-200">
                      <Share2 className="w-3 h-3" />
                      分享
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-800/30 rounded-lg">
            <Play className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
            <p className="text-zinc-200 text-sm mb-1">暂无作品</p>
            <p className="text-zinc-400 text-xs">该分类下还没有公开作品</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
