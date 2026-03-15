'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit3,
  Share2,
  Trash2,
  Eye,
  Heart,
  Coins,
  Calendar,
  Link2,
  Copy,
  Check,
  Loader2,
  FileVideo,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreVertical,
  Crown,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  share_code: string;
  is_public: boolean;
  view_count: number;
  like_count: number;
  beans_price: number;
  total_beans_earned: number;
  review_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'revision_needed';
  review_notes?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

// 审核状态配置
const REVIEW_STATUS_CONFIG = {
  draft: {
    label: '草稿',
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    icon: FileVideo,
  },
  pending: {
    label: '审核中',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    icon: Clock,
  },
  approved: {
    label: '已发布',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    icon: CheckCircle,
  },
  rejected: {
    label: '已拒绝',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    icon: XCircle,
  },
  revision_needed: {
    label: '需修改',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    icon: RefreshCw,
  },
};

export default function MyWorksPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'pending' | 'approved'>('all');

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProjects();
    }
  }, [isAuthenticated, user]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('获取作品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (shareCode: string, projectId: string) => {
    const link = `${window.location.origin}/play/${shareCode}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(projectId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('确定要删除这个作品吗？此操作不可恢复。')) {
      return;
    }

    setDeletingId(projectId);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        const data = await response.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 过滤作品
  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    return p.review_status === filter;
  });

  // 统计数据
  const stats = {
    total: projects.length,
    approved: projects.filter(p => p.review_status === 'approved').length,
    pending: projects.filter(p => p.review_status === 'pending').length,
    draft: projects.filter(p => p.review_status === 'draft').length,
    totalViews: projects.reduce((sum, p) => sum + (p.view_count || 0), 0),
    totalLikes: projects.reduce((sum, p) => sum + (p.like_count || 0), 0),
    totalEarnings: projects.reduce((sum, p) => sum + (p.total_beans_earned || 0), 0),
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">请先登录</p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="bg-zinc-800/80 backdrop-blur border-b border-zinc-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1 text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs">返回</span>
              </Link>
              <div className="h-4 w-px bg-zinc-700" />
              <h1 className="font-medium">我的作品</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/create">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-1" />
                  新建作品
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileVideo className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-zinc-400">作品总数</span>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-zinc-400">总播放量</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-xs text-zinc-400">总点赞数</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-zinc-400">总收入</span>
                </div>
                <div className="text-2xl font-bold text-amber-400">{stats.totalEarnings.toLocaleString()} 豆</div>
              </div>
            </div>

            {/* 筛选标签 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                全部 ({stats.total})
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
                className={filter === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                已发布 ({stats.approved})
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
                className={filter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                审核中 ({stats.pending})
              </Button>
              <Button
                variant={filter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('draft')}
                className={filter === 'draft' ? 'bg-gray-600 hover:bg-gray-700' : ''}
              >
                草稿 ({stats.draft})
              </Button>
            </div>

            {/* 作品列表 */}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <FileVideo className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 mb-4">
                  {filter === 'all' ? '还没有创作任何作品' : `没有${filter === 'approved' ? '已发布' : filter === 'pending' ? '审核中' : '草稿'}的作品`}
                </p>
                <Link href="/create">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    开始创作
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => {
                  const statusConfig = REVIEW_STATUS_CONFIG[project.review_status] || REVIEW_STATUS_CONFIG.draft;
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={project.id}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
                    >
                      {/* 封面图 */}
                      <div className="aspect-video bg-zinc-900 relative">
                        {project.cover_image ? (
                          <img
                            src={project.cover_image}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileVideo className="w-12 h-12 text-zinc-600" />
                          </div>
                        )}
                        
                        {/* 状态标签 */}
                        <div className="absolute top-2 left-2">
                          <Badge className={`${statusConfig.color} text-white text-[10px]`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        {/* 价格标签 */}
                        {project.beans_price > 0 && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-amber-500 text-white text-[10px]">
                              {project.beans_price} 豆
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* 内容 */}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1 truncate">{project.name}</h3>
                        {project.description && (
                          <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{project.description}</p>
                        )}

                        {/* 数据统计 */}
                        <div className="flex items-center gap-4 text-xs text-zinc-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {project.view_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {project.like_count || 0}
                          </div>
                          {project.total_beans_earned > 0 && (
                            <div className="flex items-center gap-1 text-amber-400">
                              <Coins className="w-3 h-3" />
                              {project.total_beans_earned}
                            </div>
                          )}
                          <div className="flex items-center gap-1 ml-auto">
                            <Calendar className="w-3 h-3" />
                            {formatDate(project.updated_at)}
                          </div>
                        </div>

                        {/* 分享链接 */}
                        {project.share_code && (
                          <div className="flex items-center gap-2 mb-3 p-2 bg-zinc-900/50 rounded">
                            <Link2 className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                            <span className="text-[10px] text-zinc-500 truncate flex-1">
                              /play/{project.share_code}
                            </span>
                            <button
                              onClick={() => handleCopyLink(project.share_code, project.id)}
                              className="text-purple-400 hover:text-purple-300 flex-shrink-0"
                            >
                              {copiedId === project.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* 审核备注 */}
                        {project.review_notes && project.review_status === 'rejected' && (
                          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            {project.review_notes}
                          </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex gap-2">
                          <Link href={`/create/editor/${project.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Edit3 className="w-3 h-3 mr-1" />
                              编辑
                            </Button>
                          </Link>
                          {project.review_status === 'approved' && project.share_code && (
                            <Link href={`/play/${project.share_code}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="w-3 h-3 mr-1" />
                                预览
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                            onClick={() => handleDelete(project.id)}
                            disabled={deletingId === project.id}
                          >
                            {deletingId === project.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
