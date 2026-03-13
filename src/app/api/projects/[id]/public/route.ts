import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取公开项目信息（无需认证）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    // 查询项目
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, name, project_data, created_at, updated_at')
      .eq('id', id)
      .eq('is_public', true)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: '项目不存在或未公开' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        projectData: project.project_data,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (error) {
    console.error('获取公开项目失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
