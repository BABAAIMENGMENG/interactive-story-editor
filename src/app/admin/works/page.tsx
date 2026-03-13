'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  Trash2,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  EyeOff,
} from 'lucide-react';

interface Work {
  id: string;
  name: string;
  description: string;
  author: { name: string; email: string };
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  approvedAt?: string; // 通过时间
  coverImage?: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: '全部分类' },
  { value: 'romance', label: '言情' },
  { value: 'suspense', label: '悬疑' },
  { value: 'scifi', label: '科幻' },
  { value: 'fantasy', label: '奇幻' },
  { value: 'adventure', label: '冒险' },
  { value: 'campus', label: '校园' },
  { value: 'legal', label: '普法' },
  { value: 'comedy', label: '喜剧' },
  { value: 'other', label: '其他' },
];

export default function AdminWorksPage() {
  const searchParams = useSearchParams();
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedWorks, setSelectedWorks] = useState<string[]>([]);
  
  // 从 URL 参数初始化状态
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  useEffect(() => {
    // 模拟数据
    const mockWorks: Work[] = [
      {
        id: '1',
        name: '迷失的时空',
        description: '一场神秘的时空穿越，你的每一个选择都将改变历史的走向。',
        author: { name: '创作者A', email: 'a@test.com' },
        category: 'suspense',
        status: 'pending',
        isPublic: true,
        viewCount: 0,
        likeCount: 0,
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        name: '星河恋曲',
        description: '在浩瀚的宇宙中，遇见命中注定的那个人。',
        author: { name: '创作者B', email: 'b@test.com' },
        category: 'romance',
        status: 'approved',
        isPublic: true,
        viewCount: 2156,
        likeCount: 256,
        createdAt: '2024-01-14T08:00:00Z',
        approvedAt: '2024-01-14T10:30:00Z',
      },
      {
        id: '3',
        name: '深海迷踪',
        description: '深海研究站发出求救信号，你作为调查员深入海底。',
        author: { name: '创作者A', email: 'a@test.com' },
        category: 'adventure',
        status: 'pending',
        isPublic: true,
        viewCount: 0,
        likeCount: 0,
        createdAt: '2024-01-13T12:00:00Z',
      },
      {
        id: '4',
        name: '魔法学院',
        description: '踏入神秘的魔法学院，学习各种魔法技能。',
        author: { name: '创作者C', email: 'c@test.com' },
        category: 'fantasy',
        status: 'approved',
        isPublic: true,
        viewCount: 3421,
        likeCount: 412,
        createdAt: '2024-01-12T15:00:00Z',
        approvedAt: '2024-01-12T18:00:00Z',
      },
      {
        id: '5',
        name: '校园风云',
        description: '踏入大学校园，经历青春热血的校园生活。',
        author: { name: '创作者B', email: 'b@test.com' },
        category: 'campus',
        status: 'approved',
        isPublic: false,
        viewCount: 1567,
        likeCount: 189,
        createdAt: '2024-01-11T09:00:00Z',
        approvedAt: '2024-01-11T14:00:00Z',
      },
    ];
    setWorks(mockWorks);
    setIsLoading(false);
  }, []);

  // 过滤作品
  const filteredWorks = works.filter((work) => {
    const matchesSearch = work.name.toLowerCase().includes(search.toLowerCase()) ||
      work.author.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || work.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || work.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // 审核操作
  const handleApprove = (workId: string) => {
    setWorks(works.map((w) =>
      w.id === workId ? { ...w, status: 'approved' as const, approvedAt: new Date().toISOString() } : w
    ));
  };

  const handleReject = (workId: string) => {
    setWorks(works.map((w) =>
      w.id === workId ? { ...w, status: 'rejected' as const } : w
    ));
  };

  // 下架/上架
  const handleTogglePublic = (workId: string) => {
    setWorks(works.map((w) =>
      w.id === workId ? { ...w, isPublic: !w.isPublic } : w
    ));
  };

  // 删除
  const handleDelete = (workId: string) => {
    if (confirm('确定要删除这个作品吗？此操作不可恢复。')) {
      setWorks(works.filter((w) => w.id !== workId));
    }
  };

  // 批量审核
  const handleBatchApprove = () => {
    if (selectedWorks.length === 0) return;
    const now = new Date().toISOString();
    setWorks(works.map((w) =>
      selectedWorks.includes(w.id) ? { ...w, status: 'approved' as const, approvedAt: now } : w
    ));
    setSelectedWorks([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
            <Clock className="w-3 h-3" />
            待审核
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
            <CheckCircle className="w-3 h-3" />
            已通过
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
            <XCircle className="w-3 h-3" />
            已拒绝
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryName = (category: string) => {
    return CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-4">
      {/* 筛选和搜索 */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-wrap gap-3">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索作品名称或作者..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* 分类筛选 */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 批量操作 */}
        {selectedWorks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-3">
            <span className="text-gray-400 text-sm">
              已选择 {selectedWorks.length} 个作品
            </span>
            <Button
              size="sm"
              onClick={handleBatchApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1" />
              批量通过
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedWorks([])}
            >
              取消选择
            </Button>
          </div>
        )}
      </div>

      {/* 作品列表 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            没有找到符合条件的作品
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedWorks.length === filteredWorks.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWorks(filteredWorks.map((w) => w.id));
                      } else {
                        setSelectedWorks([]);
                      }
                    }}
                    className="rounded border-gray-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">作品信息</th>
                <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">作者</th>
                <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">分类</th>
                <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">状态</th>
                <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">通过时间</th>
                <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">数据</th>
                <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredWorks.map((work) => (
                <tr key={work.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedWorks.includes(work.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWorks([...selectedWorks, work.id]);
                        } else {
                          setSelectedWorks(selectedWorks.filter((id) => id !== work.id));
                        }
                      }}
                      className="rounded border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{work.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                        {work.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-300 text-sm">{work.author.name}</p>
                      <p className="text-gray-500 text-xs">{work.author.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">{getCategoryName(work.category)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(work.status)}
                    {!work.isPublic && (
                      <span className="ml-1 px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded text-xs">
                        已下架
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {work.approvedAt ? (
                      <span className="text-gray-300 text-xs">
                        {new Date(work.approvedAt).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-gray-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {work.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        {work.likeCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {work.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(work.id)}
                            className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                            title="通过"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(work.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                            title="拒绝"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleTogglePublic(work.id)}
                        className={`p-1.5 rounded ${
                          work.isPublic
                            ? 'text-yellow-400 hover:bg-yellow-500/20'
                            : 'text-gray-400 hover:bg-gray-600'
                        }`}
                        title={work.isPublic ? '下架' : '上架'}
                      >
                        {work.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(work.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
