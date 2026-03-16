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

// 项目卡片组件 - 处理图片加载状态
function ProjectCard({ 
  project, 
  visitorId, 
  onLike 
}: { 
  project: PublicProject; 
  visitorId: string;
  onLike: (projectId: string, currentLiked: boolean) => void;
}) {
  const [imageError, setImageError] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLike(project.id, project.isLiked || false);
  };

  const showPlaceholder = !project.coverImage || imageError;

  return (
    <Link
      href={`/play/${project.shareCode}`}
      className="group overflow-hidden border border-gray-200 bg-white rounded-lg transition-all hover:shadow-lg hover:border-purple-300"
    >
      {/* 封面 */}
      <div className={`relative h-40 ${showPlaceholder ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-100'}`}>
        {project.coverImage && !imageError ? (
          <img
            src={project.coverImage}
            alt={project.name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Play className="w-10 h-10 text-white/70" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        
        {/* 分类标签 */}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge className="bg-white text-gray-900 text-[10px] px-1.5 py-0.5">
            {project.categoryName}
          </Badge>
          {project.beansPrice > 0 ? (
            <Badge className="bg-amber-400 text-gray-900 text-[10px] px-1.5 py-0.5">
              💎 {project.beansPrice}
            </Badge>
          ) : (
            <Badge className="bg-green-400 text-gray-900 text-[10px] px-1.5 py-0.5">
              🆓 免费
            </Badge>
          )}
        </div>
        
        {/* 播放按钮 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            {/* 播放/暂停组合图标 */}
            <div className="flex items-center gap-0.5">
              <Play className="w-4 h-4 text-purple-600 ml-0.5" />
              <div className="flex gap-0.5 mr-0.5">
                <div className="w-0.5 h-3 bg-purple-600 rounded-sm" />
                <div className="w-0.5 h-3 bg-purple-600 rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 项目信息 */}
      <div className="p-3 bg-white">
        <h4 className="font-medium text-gray-900 truncate text-sm">{project.name}</h4>
        <p className="text-gray-600 text-[10px] line-clamp-2 mb-2">
          {project.description || '暂无描述'}
        </p>
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {project.viewCount}
            </span>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${
                project.isLiked 
                  ? 'text-pink-500' 
                  : 'text-gray-500 hover:text-pink-500'
              }`}
            >
              <Heart className={`w-3 h-3 ${project.isLiked ? 'fill-current' : ''}`} />
              {project.likeCount}
            </button>
          </div>
          <span className="flex items-center gap-1 text-purple-600 hover:text-purple-700">
            <Share2 className="w-3 h-3" />
            分享
          </span>
        </div>
      </div>
    </Link>
  );
}

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 获取或创建访客ID
  const [visitorId, setVisitorId] = useState<string>('');
  
  useEffect(() => {
    let vid = localStorage.getItem('visitor_id');
    if (!vid) {
      vid = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', vid);
    }
    setVisitorId(vid);
    
    // 从 URL 参数初始化筛选状态
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');
    const q = searchParams.get('q');
    if (category) setSelectedCategory(category);
    if (sort) setSelectedSort(sort);
    if (q) setSearchQuery(q);
  }, [searchParams]);

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
  const handleLike = async (projectId: string, currentLiked: boolean) => {
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
        <div className="p-3 bg-white/10 rounded-lg mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-white" />
              <span className="text-xs text-white">排序：</span>
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedSort(opt.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      selectedSort === opt.id
                        ? 'bg-white text-gray-900'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {typeof Icon === 'string' ? Icon : <Icon className="w-3 h-3" />}
                    {opt.name}
                  </button>
                );
              })}
            </div>
            
            <div className="h-4 w-px bg-white/30" />
            
            {/* 价格筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white">价格：</span>
              {PRICE_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedPriceFilter(filter.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    selectedPriceFilter === filter.id
                      ? 'bg-white text-gray-900'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {filter.icon}
                  {filter.name}
                </button>
              ))}
            </div>
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
              <ProjectCard
                key={project.id}
                project={project}
                visitorId={visitorId}
                onLike={(projectId, currentLiked) => handleLike(projectId, currentLiked)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/10 rounded-lg">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-white text-sm mb-1">暂无作品</p>
            <p className="text-gray-300 text-xs">该分类下还没有公开作品</p>
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
