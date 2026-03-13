import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 获取待审核作品列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 查询 projects 表
    let query = supabase
      .from('projects')
      .select('id, name, description, cover_image, category, beans_price, review_status, ai_review_status, ai_review_result, submitted_for_review_at, reviewed_at, review_notes, created_at, user_id', { count: 'exact' });

    // 根据状态筛选
    if (status !== 'all') {
      query = query.eq('review_status', status);
    }

    // 分页和排序
    const { data, error, count } = await query
      .order('submitted_for_review_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('获取审核列表失败:', error);
      return NextResponse.json({
        projects: [],
        total: 0,
        page,
        limit,
        error: error.message,
      });
    }

    // 获取创作者信息
    let projectsWithProfiles = data || [];
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      projectsWithProfiles = data.map(project => ({
        ...project,
        profiles: profileMap.get(project.user_id) || { name: '未知用户', email: '' }
      }));
    }

    return NextResponse.json({
      projects: projectsWithProfiles,
      total: count || 0,
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
