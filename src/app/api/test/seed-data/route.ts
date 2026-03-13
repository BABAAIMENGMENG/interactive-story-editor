import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 测试项目数据
const TEST_PROJECTS = [
  {
    id: 'test-1',
    name: '迷失的时空',
    description: '一场神秘的时空穿越，你的每一个选择都将改变历史的走向。穿越到不同的时代，解开时空之谜。',
    cover_image: null,
    project_data: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    category: 'suspense',
    is_public: true,
    share_code: 'losttime',
    view_count: 1234,
    like_count: 128,
    user_id: 'system',
  },
  {
    id: 'test-2',
    name: '星河恋曲',
    description: '在浩瀚的宇宙中，遇见命中注定的那个人。一段跨越星系的浪漫爱情故事，由你来书写结局。',
    cover_image: null,
    project_data: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    category: 'romance',
    is_public: true,
    share_code: 'starlove',
    view_count: 2156,
    like_count: 256,
    user_id: 'system',
  },
  {
    id: 'test-3',
    name: '深海迷踪',
    description: '深海研究站发出求救信号，你作为调查员深入海底，揭开令人战栗的真相。',
    cover_image: null,
    project_data: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    category: 'adventure',
    is_public: true,
    share_code: 'deepsea',
    view_count: 892,
    like_count: 67,
    user_id: 'system',
  },
  {
    id: 'test-4',
    name: '魔法学院',
    description: '踏入神秘的魔法学院，学习各种魔法技能，结交志同道合的朋友，对抗黑暗势力。',
    cover_image: null,
    project_data: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    category: 'fantasy',
    is_public: true,
    share_code: 'magic',
    view_count: 3421,
    like_count: 412,
    user_id: 'system',
  },
  {
    id: 'test-5',
    name: '校园风云',
    description: '踏入大学校园，经历青春热血的校园生活，在学业、友情、爱情中做出你的选择。',
    cover_image: null,
    project_data: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    category: 'campus',
    is_public: true,
    share_code: 'campus',
    view_count: 1567,
    like_count: 189,
    user_id: 'system',
  },
  {
    id: 'test-6',
    name: '职场逆袭',
    description: '从职场小白到行业精英，你的每一个决策都将影响你的职业发展。轻松幽默的职场故事。',
    cover_image: null,
    project_data: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    category: 'comedy',
    is_public: true,
    share_code: 'career',
    view_count: 756,
    like_count: 92,
    user_id: 'system',
  },
  {
    id: 'test-7',
    name: '星际远航',
    description: '驾驶飞船探索未知星系，遭遇外星文明，做出改变宇宙格局的重大决策。',
    cover_image: null,
    project_data: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    category: 'scifi',
    is_public: true,
    share_code: 'space',
    view_count: 1823,
    like_count: 234,
    user_id: 'system',
  },
  {
    id: 'test-8',
    name: '法槌之下',
    description: '作为一名法官，你将面对各种复杂的案件，用法律的尺度衡量正义，守护公平。',
    cover_image: null,
    project_data: { scenes: [], canvasWidth: 1920, canvasHeight: 1080 },
    category: 'legal',
    is_public: true,
    share_code: 'legal',
    view_count: 2345,
    like_count: 312,
    user_id: 'system',
  },
];

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // 先检查是否已有数据
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: '数据库已有数据，跳过插入',
        count: existing.length,
      });
    }

    // 插入测试数据
    const { error } = await supabase
      .from('projects')
      .insert(TEST_PROJECTS);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '测试数据插入成功',
      count: TEST_PROJECTS.length,
      projects: TEST_PROJECTS.map(p => ({ id: p.id, name: p.name, share_code: p.share_code })),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '插入失败',
    }, { status: 500 });
  }
}
