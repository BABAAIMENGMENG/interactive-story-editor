import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

// 模拟数据（用于测试）
const MOCK_PROJECTS = [
  {
    id: 'mock-1',
    name: '迷失的时空',
    description: '一场神秘的时空穿越，你的每一个选择都将改变历史的走向。穿越到不同的时代，解开时空之谜。',
    cover_image: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&q=80',
    share_code: 'losttime',
    view_count: 1234,
    like_count: 128,
    category: 'suspense',
    beans_price: 10,
    total_beans_earned: 1250,
    tags: ['悬疑', '穿越'],
    created_at: '2024-01-15T10:00:00Z',
    user_id: 'user-1',
  },
  {
    id: 'mock-2',
    name: '星河恋曲',
    description: '在浩瀚的宇宙中，遇见命中注定的那个人。一段跨越星系的浪漫爱情故事，由你来书写结局。',
    cover_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    share_code: 'starlove',
    view_count: 2156,
    like_count: 256,
    category: 'romance',
    beans_price: 0, // 免费
    total_beans_earned: 0,
    tags: ['言情', '科幻'],
    created_at: '2024-01-14T08:00:00Z',
    user_id: 'user-2',
  },
  {
    id: 'mock-3',
    name: '深海迷踪',
    description: '深海研究站发出求救信号，你作为调查员深入海底，揭开令人战栗的真相。',
    cover_image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    share_code: 'deepsea',
    view_count: 892,
    like_count: 67,
    category: 'adventure',
    beans_price: 15,
    total_beans_earned: 890,
    tags: ['冒险', '悬疑'],
    created_at: '2024-01-13T12:00:00Z',
    user_id: 'user-1',
  },
  {
    id: 'mock-4',
    name: '魔法学院',
    description: '踏入神秘的魔法学院，学习各种魔法技能，结交志同道合的朋友，对抗黑暗势力。',
    cover_image: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=800&q=80',
    share_code: 'magic',
    view_count: 3421,
    like_count: 412,
    category: 'fantasy',
    beans_price: 20,
    total_beans_earned: 5670,
    tags: ['奇幻', '魔法'],
    created_at: '2024-01-12T15:00:00Z',
    user_id: 'user-3',
  },
  {
    id: 'mock-5',
    name: '校园风云',
    description: '踏入大学校园，经历青春热血的校园生活，在学业、友情、爱情中做出你的选择。',
    cover_image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
    share_code: 'campus',
    view_count: 1567,
    like_count: 189,
    category: 'campus',
    beans_price: 0, // 免费
    total_beans_earned: 0,
    tags: ['校园', '青春'],
    created_at: '2024-01-11T09:00:00Z',
    user_id: 'user-2',
  },
  {
    id: 'mock-6',
    name: '职场逆袭',
    description: '从职场小白到行业精英，你的每一个决策都将影响你的职业发展。轻松幽默的职场故事。',
    cover_image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80',
    share_code: 'career',
    view_count: 756,
    like_count: 92,
    category: 'comedy',
    beans_price: 5,
    total_beans_earned: 340,
    tags: ['喜剧', '职场'],
    created_at: '2024-01-10T14:00:00Z',
    user_id: 'user-4',
  },
  {
    id: 'mock-7',
    name: '星际远航',
    description: '驾驶飞船探索未知星系，遭遇外星文明，做出改变宇宙格局的重大决策。',
    cover_image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
    share_code: 'space',
    view_count: 1823,
    like_count: 234,
    category: 'scifi',
    beans_price: 25,
    total_beans_earned: 3210,
    tags: ['科幻', '冒险'],
    created_at: '2024-01-09T11:00:00Z',
    user_id: 'user-3',
  },
  {
    id: 'mock-8',
    name: '法槌之下',
    description: '作为一名法官，你将面对各种复杂的案件，用法律的尺度衡量正义，守护公平。',
    cover_image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
    share_code: 'legal',
    view_count: 2345,
    like_count: 312,
    category: 'legal',
    beans_price: 0, // 免费
    total_beans_earned: 0,
    tags: ['普法', '法律'],
    created_at: '2024-01-08T16:00:00Z',
    user_id: 'user-5',
  },
];

/**
 * 获取公开项目列表
 * GET /api/projects/public
 * 
 * 参数：
 * - category: 分类 (all, romance, suspense, scifi, fantasy, adventure, campus, legal, comedy, other)
 * - sort: 排序 (popular, newest, mostLiked, mostEarned)
 * - priceFilter: 价格筛选 (all, free, paid)
 * - limit: 数量限制
 * - offset: 偏移量
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

    // 尝试从数据库获取数据
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
      .not('share_code', 'is', null);

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

    // 如果数据库查询失败或没有数据，使用模拟数据
    let projectList = projects;
    if (error || !projects || projects.length === 0) {
      console.log('数据库查询错误:', error);
      console.log('使用模拟数据');
      
      // 过滤分类
      projectList = category === 'all' 
        ? [...MOCK_PROJECTS]
        : MOCK_PROJECTS.filter(p => p.category === category);
      
      // 过滤价格
      if (priceFilter === 'free') {
        projectList = projectList.filter(p => p.beans_price === 0);
      } else if (priceFilter === 'paid') {
        projectList = projectList.filter(p => p.beans_price > 0);
      }
      
      // 排序
      switch (sort) {
        case 'newest':
          projectList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'mostLiked':
          projectList.sort((a, b) => b.like_count - a.like_count);
          break;
        case 'mostEarned':
          projectList.sort((a, b) => (b.total_beans_earned || 0) - (a.total_beans_earned || 0));
          break;
        case 'popular':
        default:
          projectList.sort((a, b) => b.view_count - a.view_count);
          break;
      }
      
      // 分页
      projectList = projectList.slice(offset, offset + limit);
    }

    // 如果提供了用户ID，检查点赞状态
    let likedProjectIds: string[] = [];
    if (userId && projectList && projectList.length > 0) {
      try {
        const { data: likes } = await supabase
          .from('project_likes')
          .select('project_id')
          .eq('user_id', userId)
          .in('project_id', projectList.map(p => p.id));
        
        likedProjectIds = likes?.map(l => l.project_id) || [];
      } catch (e) {
        // 表可能不存在，忽略错误
      }
    }

    const publicProjects = projectList?.map(project => ({
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
      tags: (project as any).tags || [],
      createdAt: project.created_at,
      author: { name: '创作者' },
      isLiked: likedProjectIds.includes(project.id),
    })) || [];

    return NextResponse.json({
      success: true,
      projects: publicProjects,
      categories: CATEGORY_MAP,
    });
  } catch (error) {
    console.error('获取公开项目失败:', error);
    return NextResponse.json({ projects: [] });
  }
}
