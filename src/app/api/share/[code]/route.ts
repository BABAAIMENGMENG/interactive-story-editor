import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 分类映射
const CATEGORY_MAP: Record<string, string> = {
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
const MOCK_PROJECTS: Record<string, any> = {
  'losttime': {
    id: 'mock-1',
    name: '迷失的时空',
    description: '一场神秘的时空穿越，你的每一个选择都将改变历史的走向。穿越到不同的时代，解开时空之谜。',
    coverImage: null,
    projectData: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    viewCount: 1234,
    likeCount: 128,
    category: 'suspense',
    createdAt: '2024-01-15T10:00:00Z',
    author: { name: '创作者A' },
  },
  'starlove': {
    id: 'mock-2',
    name: '星河恋曲',
    description: '在浩瀚的宇宙中，遇见命中注定的那个人。一段跨越星系的浪漫爱情故事，由你来书写结局。',
    coverImage: null,
    projectData: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    viewCount: 2156,
    likeCount: 256,
    category: 'romance',
    createdAt: '2024-01-14T08:00:00Z',
    author: { name: '创作者B' },
  },
  'deepsea': {
    id: 'mock-3',
    name: '深海迷踪',
    description: '深海研究站发出求救信号，你作为调查员深入海底，揭开令人战栗的真相。',
    coverImage: null,
    projectData: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    viewCount: 892,
    likeCount: 67,
    category: 'adventure',
    createdAt: '2024-01-13T12:00:00Z',
    author: { name: '创作者A' },
  },
  'magic': {
    id: 'mock-4',
    name: '魔法学院',
    description: '踏入神秘的魔法学院，学习各种魔法技能，结交志同道合的朋友，对抗黑暗势力。',
    coverImage: null,
    projectData: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    viewCount: 3421,
    likeCount: 412,
    category: 'fantasy',
    createdAt: '2024-01-12T15:00:00Z',
    author: { name: '创作者C' },
  },
  'campus': {
    id: 'mock-5',
    name: '校园风云',
    description: '踏入大学校园，经历青春热血的校园生活，在学业、友情、爱情中做出你的选择。',
    coverImage: null,
    projectData: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    viewCount: 1567,
    likeCount: 189,
    category: 'campus',
    createdAt: '2024-01-11T09:00:00Z',
    author: { name: '创作者B' },
  },
  'career': {
    id: 'mock-6',
    name: '职场逆袭',
    description: '从职场小白到行业精英，你的每一个决策都将影响你的职业发展。轻松幽默的职场故事。',
    coverImage: null,
    projectData: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    viewCount: 756,
    likeCount: 92,
    category: 'comedy',
    createdAt: '2024-01-10T14:00:00Z',
    author: { name: '创作者D' },
  },
  'space': {
    id: 'mock-7',
    name: '星际远航',
    description: '驾驶飞船探索未知星系，遭遇外星文明，做出改变宇宙格局的重大决策。',
    coverImage: null,
    projectData: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    viewCount: 1823,
    likeCount: 234,
    category: 'scifi',
    createdAt: '2024-01-09T11:00:00Z',
    author: { name: '创作者C' },
  },
  'legal': {
    id: 'mock-8',
    name: '法槌之下',
    description: '作为一名法官，你将面对各种复杂的案件，用法律的尺度衡量正义，守护公平。',
    coverImage: null,
    projectData: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    viewCount: 2345,
    likeCount: 312,
    category: 'legal',
    createdAt: '2024-01-08T16:00:00Z',
    author: { name: '创作者E' },
  },
};

/**
 * 获取公开分享的项目
 * GET /api/share/[code]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const supabase = getSupabaseClient();
    
    // 尝试从数据库获取
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        cover_image,
        project_data,
        view_count,
        like_count,
        category,
        created_at,
        user_id,
        beans_price
      `)
      .eq('share_code', code)
      .eq('is_public', true)
      .single();

    // 如果数据库没有，使用模拟数据
    if (error || !project) {
      const mockProject = MOCK_PROJECTS[code];
      
      if (!mockProject) {
        return NextResponse.json(
          { error: '作品不存在或已下架' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        project: {
          ...mockProject,
          categoryName: CATEGORY_MAP[mockProject.category] || '其他',
          isLiked: false,
        },
      });
    }

    // 获取作者信息
    const { data: author } = await supabase
      .from('profiles')
      .select('name, avatar')
      .eq('userId', project.user_id)
      .single();

    // 检查是否已点赞
    let isLiked = false;
    if (userId) {
      const { data: like } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', userId)
        .single();
      isLiked = !!like;
    }

    // 检查是否已购买（付费作品）
    let isPurchased = false;
    const beansPrice = project.beans_price || 0;
    if (userId && beansPrice > 0) {
      const { data: purchase } = await supabase
        .from('project_purchases')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', userId)
        .single();
      isPurchased = !!purchase;
    }

    // 免费作品自动视为已购买
    if (beansPrice === 0) {
      isPurchased = true;
    }

    // 增加浏览次数
    await supabase
      .from('projects')
      .update({ view_count: (project.view_count || 0) + 1 })
      .eq('id', project.id);

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        coverImage: project.cover_image,
        projectData: project.project_data,
        viewCount: project.view_count,
        likeCount: project.like_count,
        category: project.category,
        categoryName: CATEGORY_MAP[project.category || 'other'] || '其他',
        createdAt: project.created_at,
        author: author || { name: '匿名用户' },
        isLiked,
        beansPrice,
        isPurchased,
        isFree: beansPrice === 0,
      },
    });
  } catch (error) {
    console.error('获取分享项目失败:', error);
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    );
  }
}
