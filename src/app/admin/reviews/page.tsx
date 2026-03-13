'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  User,
  Calendar,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  category: string;
  beans_price: number;
  review_status: 'pending' | 'approved' | 'rejected' | 'revision_needed';
  ai_review_status?: 'pending' | 'passed' | 'failed' | 'manual_required';
  ai_review_result?: {
    score: number;
    issues: string[];
    threshold: number;
  };
  submitted_for_review_at: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    name: string;
    email: string;
  };
}

const statusConfig = {
  pending: { label: '待审核', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
  approved: { label: '已通过', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  rejected: { label: '已拒绝', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  revision_needed: { label: '需修改', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
};

const aiStatusConfig = {
  pending: { label: '待审核', color: 'text-gray-400' },
  passed: { label: '已通过', color: 'text-green-400' },
  failed: { label: '未通过', color: 'text-red-400' },
  manual_required: { label: '需人工', color: 'text-yellow-400' },
};

export default function AdminReviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // 选中的项目详情
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 加载项目列表
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/admin/reviews?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('加载审核列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, page]);

  // 查看项目详情
  const handleViewDetail = async (project: Project) => {
    setSelectedProject(project);
    setReviewNotes('');
    setShowDetail(true);
  };

  // 执行AI审核
  const handleAIReview = async (projectId: string) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/reviews/${projectId}`, {
        method: 'PUT',
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // 更新列表中的项目
        setProjects(projects.map(p => 
          p.id === projectId 
            ? { 
                ...p, 
                ai_review_status: data.aiResult.passed ? 'passed' : 'failed',
                ai_review_result: data.aiResult,
                review_status: data.needsManualReview ? 'pending' : (data.aiResult.passed ? 'approved' : 'revision_needed'),
              } 
            : p
        ));
        
        // 更新选中的项目
        if (selectedProject?.id === projectId) {
          setSelectedProject({
            ...selectedProject,
            ai_review_status: data.aiResult.passed ? 'passed' : 'failed',
            ai_review_result: data.aiResult,
          });
        }
      }
    } catch (error) {
      console.error('AI审核失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 人工审核
  const handleManualReview = async (status: 'approved' | 'rejected' | 'revision_needed') => {
    if (!selectedProject) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/reviews/${selectedProject.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: reviewNotes,
          reviewerId: 'admin', // 实际应从session获取
        }),
      });

      if (response.ok) {
        // 更新列表
        setProjects(projects.map(p => 
          p.id === selectedProject.id 
            ? { ...p, review_status: status, review_notes: reviewNotes, reviewed_at: new Date().toISOString() }
            : p
        ));
        
        setShowDetail(false);
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('审核失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">作品审核</h1>
            <p className="text-gray-400 text-sm">人工审核 + AI智能审核双向保障</p>
          </div>
        </div>
        <Button
          onClick={fetchProjects}
          variant="outline"
          className="border-gray-600 text-gray-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-4">
        {/* 状态筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">状态：</span>
          <div className="flex gap-1">
            {[
              { key: 'pending', label: '待审核' },
              { key: 'approved', label: '已通过' },
              { key: 'revision_needed', label: '需修改' },
              { key: 'rejected', label: '已拒绝' },
              { key: 'all', label: '全部' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => { setStatusFilter(item.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  statusFilter === item.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索作品名称..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无待审核的作品</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects
            .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* 封面图 */}
                  <div className="w-20 h-14 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {project.cover_image ? (
                      <img
                        src={project.cover_image}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* 项目信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{project.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs border ${statusConfig[project.review_status].color}`}>
                        {statusConfig[project.review_status].label}
                      </span>
                      {project.ai_review_status && (
                        <span className={`text-xs ${aiStatusConfig[project.ai_review_status]?.color}`}>
                          🤖 {aiStatusConfig[project.ai_review_status]?.label}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-1">{project.description || '暂无描述'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {project.profiles?.name || '未知用户'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.submitted_for_review_at || project.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        💎 {project.beans_price || 0}豆
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleViewDetail(project)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      审核
                    </Button>
                  </div>
                </div>

                {/* AI审核结果预览 */}
                {project.ai_review_result && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-400">
                        AI评分：<span className={project.ai_review_result.score >= project.ai_review_result.threshold ? 'text-green-400' : 'text-red-400'}>
                          {Math.round(project.ai_review_result.score * 100)}%
                        </span>
                      </span>
                      {project.ai_review_result.issues.length > 0 && (
                        <span className="text-yellow-400">
                          ⚠️ {project.ai_review_result.issues.length}个问题
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-gray-400 text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 审核详情弹窗 */}
      {showDetail && selectedProject && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">审核作品</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 项目详情 */}
            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div className="flex gap-4">
                <div className="w-32 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  {selectedProject.cover_image ? (
                    <img
                      src={selectedProject.cover_image}
                      alt={selectedProject.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{selectedProject.name}</h3>
                  <p className="text-gray-400 text-sm">{selectedProject.description || '暂无描述'}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>作者：{selectedProject.profiles?.name || '未知'}</span>
                    <span>价格：💎 {selectedProject.beans_price || 0}豆</span>
                  </div>
                </div>
              </div>

              {/* 审核状态 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">人工审核</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[selectedProject.review_status].color}`}>
                      {statusConfig[selectedProject.review_status].label}
                    </span>
                  </div>
                  {selectedProject.reviewed_at && (
                    <p className="text-gray-500 text-xs">
                      审核时间：{new Date(selectedProject.reviewed_at).toLocaleString()}
                    </p>
                  )}
                  {selectedProject.review_notes && (
                    <p className="text-gray-400 text-xs mt-2">
                      备注：{selectedProject.review_notes}
                    </p>
                  )}
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">AI审核</span>
                    {selectedProject.ai_review_status ? (
                      <span className={`text-xs ${aiStatusConfig[selectedProject.ai_review_status]?.color}`}>
                        {aiStatusConfig[selectedProject.ai_review_status]?.label}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">未审核</span>
                    )}
                  </div>
                  {selectedProject.ai_review_result && (
                    <>
                      <p className="text-gray-500 text-xs">
                        评分：{Math.round(selectedProject.ai_review_result.score * 100)}%
                        (阈值：{Math.round(selectedProject.ai_review_result.threshold * 100)}%)
                      </p>
                      {selectedProject.ai_review_result.issues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-yellow-400 text-xs mb-1">发现问题：</p>
                          <ul className="text-gray-400 text-xs space-y-1">
                            {selectedProject.ai_review_result.issues.map((issue, i) => (
                              <li key={i}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 审核操作 */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center gap-3 mb-4">
                  <Button
                    onClick={() => handleAIReview(selectedProject.id)}
                    disabled={submitting}
                    variant="outline"
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI审核
                  </Button>
                  <span className="text-gray-500 text-xs">让AI自动检测内容质量</span>
                </div>

                {/* 审核备注 */}
                <div className="mb-4">
                  <label className="text-gray-400 text-sm block mb-2">审核备注</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="输入审核意见（可选）..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* 审核按钮 */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleManualReview('approved')}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    通过审核
                  </Button>
                  <Button
                    onClick={() => handleManualReview('revision_needed')}
                    disabled={submitting}
                    variant="outline"
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    要求修改
                  </Button>
                  <Button
                    onClick={() => handleManualReview('rejected')}
                    disabled={submitting}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    拒绝
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
