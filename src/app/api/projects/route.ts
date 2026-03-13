import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const supabase = getSupabaseClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('获取项目列表失败:', error);
      return NextResponse.json({ error: '获取项目列表失败' }, { status: 500 });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建新项目
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const supabase = getSupabaseClient(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, projectData } = body;

    if (!name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    // 检查用户订阅和项目数量限制
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, projects_count')
      .eq('user_id', user.id)
      .single();

    const limits: Record<string, number> = {
      free: 3,
      pro: 50,
      enterprise: -1,
    };

    const tier = profile?.subscription_tier || 'free';
    const maxProjects = limits[tier];
    const currentCount = profile?.projects_count || 0;

    if (maxProjects !== -1 && currentCount >= maxProjects) {
      return NextResponse.json({ 
        error: `已达到项目数量上限（${maxProjects}个），请升级套餐` 
      }, { status: 403 });
    }

    // 生成分享码
    const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 创建项目
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description,
        project_data: projectData || { scenes: [], mediaResources: [] },
        is_public: false,
        share_code: shareCode,
        view_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('创建项目失败:', error);
      return NextResponse.json({ error: '创建项目失败' }, { status: 500 });
    }

    // 更新用户项目计数
    await supabase
      .from('profiles')
      .update({ projects_count: currentCount + 1 })
      .eq('user_id', user.id);

    return NextResponse.json({ project });
  } catch (error) {
    console.error('创建项目错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
