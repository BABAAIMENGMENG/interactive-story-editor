import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 分类映射
const CATEGORY_MAP: Record<string, string> = {
  'all': '全部',
  'romance': '言情',
  'suspense': '悬疑',
  'scifi': '科幻',
  'fantasy': '奇幻',
  'adventure': '冒险',
  'campus': '校园',
  'legal': '普法',
  'comedy': '喜剧',
  'other': '其他',
};

/**
 * 获取公开项目列表
 * GET /api/projects/public
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'popular';
    const priceFilter = searchParams.get('priceFilter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId');

    const supabase = getSupabaseClient();

    // 从数据库获取公开且已审核通过的项目
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        cover_image,
        share_code,
        view_count,
        like_count,
        category,
        beans_price,
        total_beans_earned,
        created_at,
        user_id
      `)
      .eq('is_public', true)
      .eq('review_status', 'approved');

    // 分类筛选
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // 价格筛选
    if (priceFilter === 'free') {
      query = query.eq('beans_price', 0);
    } else if (priceFilter === 'paid') {
      query = query.gt('beans_price', 0);
    }

    // 排序
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'mostLiked':
        query = query.order('like_count', { ascending: false });
        break;
      case 'mostEarned':
        query = query.order('total_beans_earned', { ascending: false });
        break;
      case 'popular':
      default:
        query = query.order('view_count', { ascending: false });
        break;
    }

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: projects, error } = await query;

    if (error) {
      console.error('数据库查询错误:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        projects: [],
      });
    }

    // 如果提供了用户ID，获取创作者信息和点赞状态
    let profilesMap = new Map();
    let likedProjectIds: string[] = [];
    
    if (projects && projects.length > 0) {
      // 获取创作者信息
      const userIds = [...new Set(projects.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      
      profilesMap = new Map((profiles || []).map(p => [p.user_id, p.name]));

      // 检查点赞状态
      if (userId) {
        try {
          const { data: likes } = await supabase
            .from('project_likes')
            .select('project_id')
            .eq('user_id', userId)
            .in('project_id', projects.map(p => p.id));
          
          likedProjectIds = likes?.map(l => l.project_id) || [];
        } catch (e) {
          // 表可能不存在，忽略错误
        }
      }
    }

    const publicProjects = projects?.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      coverImage: project.cover_image,
      shareCode: project.share_code,
      viewCount: project.view_count || 0,
      likeCount: project.like_count || 0,
      category: project.category || 'other',
      categoryName: CATEGORY_MAP[project.category || 'other'] || '其他',
      beansPrice: project.beans_price || 0,
      totalBeansEarned: project.total_beans_earned || 0,
      isFree: (project.beans_price || 0) === 0,
      createdAt: project.created_at,
      author: { name: profilesMap.get(project.user_id) || '创作者' },
      isLiked: likedProjectIds.includes(project.id),
    })) || [];

    return NextResponse.json({
      success: true,
      projects: publicProjects,
      categories: CATEGORY_MAP,
    });
  } catch (error) {
    console.error('获取公开项目失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败', projects: [] },
      { status: 500 }
    );
  }
}
