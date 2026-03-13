import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 生成分享码
function generateShareCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 获取单个项目
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabase = token ? getSupabaseClient(token) : getSupabaseClient();

    // 获取项目
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 检查权限：私有项目需要认证
    if (!project.is_public) {
      if (!token) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== project.user_id) {
        return NextResponse.json({ error: '无权访问此项目' }, { status: 403 });
      }
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('获取项目错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 检查项目所有权
    const { data: existingProject, error: findError } = await supabase
      .from('projects')
      .select('user_id, share_code')
      .eq('id', id)
      .single();

    if (findError || !existingProject) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (existingProject.user_id !== user.id) {
      return NextResponse.json({ error: '无权修改此项目' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.coverImage !== undefined) updates.cover_image = body.coverImage;
    if (body.projectData !== undefined) updates.project_data = body.projectData;
    if (body.beansPrice !== undefined) updates.beans_price = body.beansPrice;
    if (body.category !== undefined) updates.category = body.category;
    if (body.isPublic !== undefined) {
      // 如果设置为公开，需要进入审核流程
      if (body.isPublic) {
        updates.is_public = false; // 先设为私有，审核通过后才会公开
        updates.review_status = 'pending';
        updates.submitted_for_review_at = new Date().toISOString();
        
        // 如果没有分享码，生成一个
        if (!existingProject.share_code) {
          updates.share_code = generateShareCode();
        }
      } else {
        updates.is_public = false;
      }
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新项目失败:', error);
      return NextResponse.json({ error: '更新项目失败' }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('更新项目错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 检查项目所有权
    const { data: existingProject, error: findError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();

    if (findError || !existingProject) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (existingProject.user_id !== user.id) {
      return NextResponse.json({ error: '无权删除此项目' }, { status: 403 });
    }

    // 删除项目
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除项目失败:', error);
      return NextResponse.json({ error: '删除项目失败' }, { status: 500 });
    }

    // 更新用户项目计数
    const { data: profile } = await supabase
      .from('profiles')
      .select('projects_count')
      .eq('user_id', user.id)
      .single();

    if (profile && profile.projects_count > 0) {
      await supabase
        .from('profiles')
        .update({ projects_count: profile.projects_count - 1 })
        .eq('user_id', user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除项目错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
