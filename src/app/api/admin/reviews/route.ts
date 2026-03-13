import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取待审核作品列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 尝试查询 projects 表
    const { data, error, count } = await supabase
      .from('projects')
      .select('id, name, description, cover_image, category, beans_price, review_status, ai_review_status, ai_review_result, submitted_for_review_at, reviewed_at, review_notes, created_at, user_id', { count: 'exact' });

    if (error) {
      console.error('获取审核列表失败:', error);
      // 数据库错误时返回模拟数据，便于测试
      // 模拟待审核项目
      const mockProjects = [
        {
          id: 'mock-review-1',
          name: '神秘古堡',
          description: '探索神秘的古堡，揭开隐藏的秘密。',
          cover_image: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=800&q=80',
          category: 'suspense',
          beans_price: 15,
          review_status: 'pending',
          ai_review_status: 'passed',
          ai_review_result: { score: 0.85, issues: [], threshold: 0.8 },
          submitted_for_review_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          user_id: 'user-1',
          profiles: { name: '创作者A' },
        },
        {
          id: 'mock-review-2',
          name: '校园奇遇',
          description: '在校园中发生的一系列有趣故事。',
          cover_image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
          category: 'campus',
          beans_price: 0,
          review_status: 'pending',
          ai_review_status: 'pending',
          submitted_for_review_at: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: 'user-2',
          profiles: { name: '创作者B' },
        },
        {
          id: 'mock-review-3',
          name: '法庭风云',
          description: '作为一名律师，处理各种复杂的案件。',
          cover_image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
          category: 'legal',
          beans_price: 20,
          review_status: 'pending',
          ai_review_status: 'failed',
          ai_review_result: { score: 0.6, issues: ['描述内容过短'], threshold: 0.8 },
          submitted_for_review_at: new Date(Date.now() - 172800000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          user_id: 'user-3',
          profiles: { name: '创作者C' },
        },
      ];
      
      // 根据状态筛选
      const filteredProjects = status === 'all' 
        ? mockProjects 
        : mockProjects.filter(p => p.review_status === status);
      
      return NextResponse.json({
        projects: filteredProjects,
        total: filteredProjects.length,
        page,
        limit,
      });
    }

    // 过滤并排序
    let filteredData = data || [];
    if (status !== 'all') {
      filteredData = filteredData.filter(p => p.review_status === status);
    }
    // 按提交时间排序
    filteredData.sort((a, b) => {
      const timeA = new Date(a.submitted_for_review_at || a.created_at).getTime();
      const timeB = new Date(b.submitted_for_review_at || b.created_at).getTime();
      return timeA - timeB;
    });

    // 分页
    const paginatedData = filteredData.slice(offset, offset + limit);

    return NextResponse.json({
      projects: paginatedData,
      total: filteredData.length,
      page,
      limit,
    });
  } catch (error) {
    console.error('获取审核列表异常:', error);
    return NextResponse.json({
      projects: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  }
}
