'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getAuthToken } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  FolderOpen,
  Trash2,
  Edit3,
  Play,
  LogOut,
  User,
  Crown,
  Settings,
  Search,
  Calendar,
  MoreVertical,
  Cloud,
  HardDrive,
  Database,
  RefreshCw,
  Check,
  AlertCircle,
  Coins,
  Link2,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { indexedDBStorage, type ProjectData } from '@/lib/storage';
import { 
  syncAllProjects, 
  pullFromCloud, 
  getSyncStatus, 
  subscribeSyncStatus,
  type SyncStatus 
} from '@/lib/auto-sync';

interface Project {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  share_code?: string;
  isPublic: boolean;
  viewCount: number;
  likeCount?: number;
  total_beans_earned?: number;
  createdAt: string;
  updatedAt: string;
  scenes?: any[];
  review_status?: 'pending' | 'approved' | 'rejected' | 'revision_needed';
  review_notes?: string;
  beans_price?: number;
}

// 订阅套餐配置
const SUBSCRIPTION_PLANS = {
  free: {
    name: '免费版',
    maxProjects: 3,
    maxScenes: 10,
    features: ['3个项目', '10个场景', '基础组件', '有水印'],
  },
  pro: {
    name: '专业版',
    maxProjects: 50,
    maxScenes: 100,
    features: ['无限项目', '100个场景', '高级组件', '无水印', '优先支持'],
  },
  enterprise: {
    name: '企业版',
    maxProjects: -1,
    maxScenes: -1,
    features: ['无限项目', '无限场景', '全部功能', 'API接口', '专属客服'],
  },
};

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number }>({ usage: 0, quota: 0 });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [beansBalance, setBeansBalance] = useState<number>(0);

  const router = useRouter();

  // 订阅同步状态变化
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus(setSyncStatus);
    return unsubscribe;
  }, []);

  // 加载存储使用情况
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      indexedDBStorage.getStorageEstimate().then((info) => {
        setStorageInfo(info);
      });
    }
  }, [isLoading, isAuthenticated]);

  // 加载项目列表（云端或本地）
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        fetchCloudProjects();
        fetchBeansBalance();
      } else {
        // 未登录时清空项目列表，引导用户登录
        setProjects([]);
        setIsLoadingProjects(false);
      }
    }
  }, [isLoading, isAuthenticated]);

  // 从云端加载项目
  const fetchCloudProjects = async () => {
    try {
      const token = getAuthToken();
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
      console.error('加载云端项目失败:', error);
      // 降级到本地项目
      fetchLocalProjects();
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // 获取快乐豆余额
  const fetchBeansBalance = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/user/beans', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBeansBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('获取快乐豆余额失败:', error);
    }
  };

  // 从本地加载项目 (使用 IndexedDB)
  const fetchLocalProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const savedProjects = await indexedDBStorage.getAllProjects();
      const projectList = savedProjects.map((project) => ({
        id: project.id,
        name: project.name || '未命名项目',
        description: project.description || '',
        coverImage: undefined,
        isPublic: false,
        viewCount: 0,
        createdAt: new Date(project.createdAt).toISOString(),
        updatedAt: new Date(project.updatedAt).toISOString(),
        scenes: project.scenes || [],
      }));
      setProjects(projectList);
      
      // 同时检查 localStorage 是否有旧数据需要迁移
      const oldData = localStorage.getItem('interactive-stories');
      if (oldData && savedProjects.length === 0) {
        // 迁移旧数据到 IndexedDB
        await migrateFromLocalStorage();
      }
    } catch (error) {
      console.error('加载本地项目失败:', error);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // 从 localStorage 迁移数据到 IndexedDB
  const migrateFromLocalStorage = async () => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('interactive-stories') || '{}');
      for (const [id, data] of Object.entries(savedProjects) as [string, any][]) {
        const project: ProjectData = {
          id,
          name: data.name || '未命名项目',
          description: data.description || '',
          canvasWidth: data.canvasWidth || 1920,
          canvasHeight: data.canvasHeight || 1080,
          scenes: data.scenes || [],
          globalVariables: data.globalVariables || [],
          createdAt: new Date(data.createdAt || Date.now()).getTime(),
          updatedAt: new Date(data.updatedAt || Date.now()).getTime(),
        };
        await indexedDBStorage.saveProject(project);
      }
      // 迁移完成后清除旧数据
      localStorage.removeItem('interactive-stories');
      // 重新加载项目
      fetchLocalProjects();
      console.log('数据迁移完成');
    } catch (error) {
      console.error('数据迁移失败:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    // 未登录不允许创建项目
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }

    setIsCreating(true);
    try {
      // 云端创建
      const token = getAuthToken();
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProjectName,
          projectData: {
            scenes: [],
            mediaResources: [],
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/create/editor/${data.project.id}`);
      } else {
        const error = await response.json();
        alert(error.error || '创建项目失败');
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      alert('创建项目失败，请重试');
    } finally {
      setIsCreating(false);
      setShowNewProjectDialog(false);
      setNewProjectName('');
    }
  };

  // 复制分享链接
  const handleCopyShareLink = async (shareCode: string, projectId: string) => {
    const link = `${window.location.origin}/play/${shareCode}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(projectId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) return;

    try {
      if (isAuthenticated) {
        const token = getAuthToken();
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setProjects(projects.filter(p => p.id !== projectId));
        }
      } else {
        // 本地删除 (使用 IndexedDB)
        await indexedDBStorage.deleteProject(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
      }
    } catch (error) {
      console.error('删除项目失败:', error);
    }
  };

  // 重新提交审核
  const handleResubmit = async (projectId: string) => {
    if (!isAuthenticated) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/projects/${projectId}/resubmit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // 更新项目状态
        setProjects(projects.map(p => 
          p.id === projectId 
            ? { ...p, review_status: 'pending', review_notes: '' }
            : p
        ));
        alert('已重新提交审核，请等待管理员审核');
      } else {
        const error = await response.json();
        alert(error.error || '重新提交失败');
      }
    } catch (error) {
      console.error('重新提交审核失败:', error);
      alert('重新提交失败，请重试');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // 手动同步所有项目到云端
  const handleManualSync = async () => {
    if (!isAuthenticated || isManualSyncing) return;
    
    setIsManualSyncing(true);
    try {
      await syncAllProjects();
      // 同步完成后重新加载项目列表
      await fetchCloudProjects();
    } catch (error) {
      console.error('手动同步失败:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // 过滤项目
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 获取用户套餐信息
  const userPlan = SUBSCRIPTION_PLANS[user?.subscriptionTier || 'free'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-sm">
      {/* 顶部导航 */}
      <header className="bg-zinc-800/80 backdrop-blur border-b border-zinc-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-10">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-bold text-white">全景互动</span>
            </Link>

            {/* 用户信息 */}
            <div className="flex items-center gap-2">
              {/* 快乐豆余额 */}
              {isAuthenticated && (
                <Link href="/pricing" className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-[10px] font-medium hover:opacity-90 transition-opacity">
                  <span>💎</span>
                  <span>{beansBalance}</span>
                </Link>
              )}
              
              {/* 订阅状态 */}
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'enterprise'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'bg-zinc-700 text-zinc-300'
              }`}>
                {user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'enterprise' ? (
                  <span className="flex items-center gap-0.5">
                    <Crown className="w-3 h-3" />
                    {userPlan.name}
                  </span>
                ) : isAuthenticated ? (
                  <Link href="/pricing" className="hover:text-white">升级专业版</Link>
                ) : null}
              </div>

              {/* 用户菜单 */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-1 p-1 rounded hover:bg-zinc-700 transition-colors">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white hidden sm:block text-xs">{user?.name}</span>
                  </button>

                  {/* 下拉菜单 */}
                  <div className="absolute right-0 top-full mt-0.5 w-36 bg-zinc-800 border border-zinc-700 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-xs">
                    <Link
                      href="/settings"
                      className="flex items-center gap-1.5 px-2 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    >
                      <Settings className="w-3 h-3" />
                      设置
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    >
                      <LogOut className="w-3 h-3" />
                      退出登录
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/auth">
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-7 text-xs">
                    登录
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* 已登录提示 - 自动云备份状态 */}
        {isAuthenticated && (
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-white font-medium text-xs flex items-center gap-1.5">
                    云端自动同步
                    {syncStatus.isSyncing || isManualSyncing ? (
                      <span className="text-purple-300">
                        <RefreshCw className="w-3 h-3 inline animate-spin" />
                        同步中...
                      </span>
                    ) : syncStatus.lastSyncTime ? (
                      <span className="text-zinc-400 font-normal">
                        <Check className="w-3 h-3 inline text-green-400" />
                        已同步
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-normal">已启用</span>
                    )}
                  </p>
                  <p className="text-zinc-300 text-[10px]">
                    {syncStatus.lastSyncTime 
                      ? `最后同步: ${new Date(syncStatus.lastSyncTime).toLocaleString('zh-CN')}`
                      : '保存项目时自动同步到云端'
                    }
                    {syncStatus.error && (
                      <span className="text-red-400 ml-1">
                        <AlertCircle className="w-3 h-3 inline" />
                        {syncStatus.error}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualSync}
                  disabled={isManualSyncing || syncStatus.isSyncing}
                  className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600 h-7 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${(isManualSyncing || syncStatus.isSyncing) ? 'animate-spin' : ''}`} />
                  手动同步
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 未登录提示 */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-lg p-4 mb-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-purple-600/30 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm mb-1">请先登录</p>
                <p className="text-zinc-400 text-xs">登录后可查看和管理您的项目</p>
              </div>
              <Link href="/auth">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  登录 / 注册
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 欢迎区域 */}
        {isAuthenticated && (
          <div className="mb-4">
            <h1 className="text-lg font-bold text-white mb-0.5">
              你好，{user?.name}
            </h1>
            <p className="text-zinc-400 text-xs">
              管理你的互动项目，创建沉浸式体验
            </p>
          </div>
        )}

        {/* 操作栏 */}
        {isAuthenticated && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <Input
                type="text"
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-7 text-xs"
              />
            </div>

            {/* 新建项目按钮 */}
            <Button
              size="sm"
              onClick={() => setShowNewProjectDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-7 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              新建项目
            </Button>
          </div>
        )}

        {/* 使用量提示 */}
        {isAuthenticated && user?.subscriptionTier === 'free' && (
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-2 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-xs">免费版限制</p>
                <p className="text-zinc-300 text-[10px]">
                  已使用 {projects.length}/{userPlan.maxProjects} 个项目
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-purple-500 text-purple-300 hover:bg-purple-500/20 h-6 text-[10px] px-2"
                onClick={() => router.push('/pricing')}
              >
                升级专业版
              </Button>
            </div>
          </div>
        )}

        {/* 项目列表 */}
        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-10">
            <FolderOpen className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-zinc-400 mb-1">
              {searchQuery ? '没有找到项目' : '还没有项目'}
            </h3>
            <p className="text-zinc-500 text-xs mb-3">
              {searchQuery ? '尝试其他搜索词' : '创建你的第一个互动项目吧'}
            </p>
            {!searchQuery && isAuthenticated && (
              <Button
                size="sm"
                onClick={() => setShowNewProjectDialog(true)}
                className="bg-purple-600 hover:bg-purple-700 h-7 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                新建项目
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden hover:border-purple-500/50 transition-all group"
              >
                {/* 封面图 */}
                <div className="aspect-video bg-zinc-700 relative">
                  {project.coverImage ? (
                    <img
                      src={project.coverImage}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-zinc-600" />
                    </div>
                  )}
                  
                  {/* 审核状态标签 */}
                  {project.review_status && (
                    <div className="absolute top-1.5 left-1.5">
                      {project.review_status === 'pending' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          待审核
                        </span>
                      )}
                      {project.review_status === 'approved' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/30">
                          已通过
                        </span>
                      )}
                      {project.review_status === 'rejected' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                          已拒绝
                        </span>
                      )}
                      {project.review_status === 'revision_needed' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          需修改
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* 价格标签 */}
                  {project.beans_price !== undefined && project.beans_price > 0 && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        💎 {project.beans_price}豆
                      </span>
                    </div>
                  )}
                  
                  {/* 悬停操作 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <Link href={`/create/editor/${project.id}`}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 h-6 text-[10px] px-2">
                        <Edit3 className="w-3 h-3 mr-0.5" />
                        编辑
                      </Button>
                    </Link>
                    <Link href={`/preview/${project.id}`} target="_blank">
                      <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/20 h-6 text-[10px] px-2">
                        <Play className="w-3 h-3 mr-0.5" />
                        预览
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* 项目信息 */}
                <div className="p-2">
                  <h3 className="font-medium text-white truncate text-xs">{project.name}</h3>
                  <p className="text-zinc-500 text-[10px] line-clamp-2 mb-1.5">
                    {project.description || '暂无描述'}
                  </p>
                  
                  {/* 分享链接 */}
                  {project.share_code && project.review_status === 'approved' && (
                    <div className="flex items-center gap-1 mb-1.5 p-1.5 bg-zinc-900/50 rounded">
                      <Link2 className="w-2.5 h-2.5 text-zinc-500 flex-shrink-0" />
                      <span className="text-[10px] text-zinc-500 truncate flex-1">
                        /play/{project.share_code}
                      </span>
                      <button
                        onClick={() => handleCopyShareLink(project.share_code!, project.id)}
                        className="text-purple-400 hover:text-purple-300 flex-shrink-0"
                      >
                        {copiedId === project.id ? (
                          <Check className="w-2.5 h-2.5" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* 审核不通过提示 */}
                  {(project.review_status === 'rejected' || project.review_status === 'revision_needed') && project.review_notes && (
                    <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/30 rounded text-[10px]">
                      <p className="text-red-300 font-medium mb-0.5">审核意见：</p>
                      <p className="text-zinc-300">{project.review_notes}</p>
                      <Button
                        size="sm"
                        className="mt-1.5 h-5 text-[10px] px-2 bg-purple-600 hover:bg-purple-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResubmit(project.id);
                        }}
                      >
                        重新提交审核
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 新建项目对话框 */}
      {showNewProjectDialog && isAuthenticated && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 w-full max-w-xs">
            <h2 className="text-sm font-bold text-white mb-3">新建项目</h2>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-medium text-zinc-300 mb-1">
                  项目名称
                </label>
                <Input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称"
                  className="bg-zinc-700 border-zinc-600 text-white h-7 text-xs"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-zinc-600 text-zinc-300 h-7 text-xs"
                  onClick={() => {
                    setShowNewProjectDialog(false);
                    setNewProjectName('');
                  }}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || isCreating}
                >
                  {isCreating ? '创建中...' : '创建'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
