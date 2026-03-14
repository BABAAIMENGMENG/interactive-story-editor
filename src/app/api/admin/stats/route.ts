import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET() {
  try {
    // 获取作品统计
    const { count: totalWorks } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // 获取待审核作品数
    const { count: pendingWorks } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 获取用户总数
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 获取总播放量
    const { data: projectsData } = await supabase
      .from('projects')
      .select('view_count');
    const totalViews = projectsData?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

    // 获取总点赞数
    const { count: totalLikes } = await supabase
      .from('project_likes')
      .select('*', { count: 'exact', head: true });

    // 获取今日播放量（简化处理，实际需要根据日期筛选）
    const todayViews = 0;

    // 获取最近作品
    const { data: recentWorks } = await supabase
      .from('projects')
      .select('id, name, author_id, status, view_count, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // 获取作者信息
    const authorIds = recentWorks?.map(w => w.author_id).filter(Boolean) || [];
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', authorIds);

    const authorMap = new Map(authors?.map(a => [a.id, a.username]) || []);

    const formattedRecentWorks = recentWorks?.map(work => ({
      id: work.id,
      name: work.name,
      author: authorMap.get(work.author_id) || '未知',
      status: work.status || 'pending',
      viewCount: work.view_count || 0,
      likeCount: 0,
      createdAt: work.created_at,
    })) || [];

    return NextResponse.json({
      success: true,
      stats: {
        totalWorks: totalWorks || 0,
        pendingWorks: pendingWorks || 0,
        totalViews,
        totalLikes: totalLikes || 0,
        totalUsers: totalUsers || 0,
        todayViews,
      },
      recentWorks: formattedRecentWorks,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取统计数据失败',
        stats: {
          totalWorks: 0,
          pendingWorks: 0,
          totalViews: 0,
          totalLikes: 0,
          totalUsers: 0,
          todayViews: 0,
        },
        recentWorks: []
      },
      { status: 500 }
    );
  }
}
