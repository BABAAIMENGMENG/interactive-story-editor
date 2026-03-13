import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 创建测试数据
 * GET /api/test/seed
 * 
 * 仅用于开发测试，生产环境请删除此文件
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // 清理旧的测试数据
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', 'test-user-001');
    
    if (deleteError) {
      console.log('删除旧数据:', deleteError.message);
    }

    // 测试用户ID
    const testUserId = 'test-user-001';
    
    // 创建测试用户
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        userId: testUserId,
        name: '测试创作者',
        email: 'test@example.com',
        subscriptionTier: 'pro',
      });
    
    if (profileError) {
      console.log('创建用户错误:', profileError.message);
    }

    // 测试项目数据
    const testProjects = [
      {
        name: '迷失的时空',
        description: '一场神秘的时空穿越，你的每一个选择都将改变历史的走向。',
        category: 'suspense',
        shareCode: 'losttime',
        viewCount: 1234,
        likeCount: 128,
      },
      {
        name: '星河恋曲',
        description: '在浩瀚的宇宙中，遇见命中注定的那个人。',
        category: 'romance',
        shareCode: 'starlove',
        viewCount: 2156,
        likeCount: 256,
      },
      {
        name: '深海迷踪',
        description: '深海研究站发出求救信号，你作为调查员深入海底。',
        category: 'suspense',
        shareCode: 'deepsea',
        viewCount: 892,
        likeCount: 67,
      },
      {
        name: '魔法学院',
        description: '踏入神秘的魔法学院，学习各种魔法技能。',
        category: 'fantasy',
        shareCode: 'magic',
        viewCount: 3421,
        likeCount: 412,
      },
      {
        name: '末日求生',
        description: '末日降临，你需要在废土中生存下去。',
        category: 'horror',
        shareCode: 'doom',
        viewCount: 1567,
        likeCount: 189,
      },
      {
        name: '职场逆袭',
        description: '从职场小白到行业精英，你的每一个决策都将影响你的职业发展。',
        category: 'comedy',
        shareCode: 'career',
        viewCount: 756,
        likeCount: 92,
      },
      {
        name: '星际远航',
        description: '驾驶飞船探索未知星系，遭遇外星文明。',
        category: 'scifi',
        shareCode: 'space',
        viewCount: 1823,
        likeCount: 234,
      },
    ];

    const errors: string[] = [];
    const createdProjects: any[] = [];

    // 创建项目
    for (const project of testProjects) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: testUserId,
          name: project.name,
          description: project.description,
          category: project.category,
          share_code: project.shareCode,
          is_public: true,
          view_count: project.viewCount,
          like_count: project.likeCount,
          project_data: {
            scenes: [],
            canvasWidth: 1920,
            canvasHeight: 1080,
          },
        })
        .select();
      
      if (error) {
        errors.push(`${project.name}: ${error.message}`);
      } else {
        createdProjects.push(project.name);
      }
    }

    // 检查创建后的数据
    const { data: checkData } = await supabase
      .from('projects')
      .select('id, name, is_public, share_code')
      .limit(10);

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0 ? '测试数据创建成功！' : '部分数据创建失败',
      created: createdProjects,
      errors: errors.length > 0 ? errors : undefined,
      checkData: checkData,
    });
  } catch (error) {
    console.error('创建测试数据失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '创建失败',
    }, { status: 500 });
  }
}
