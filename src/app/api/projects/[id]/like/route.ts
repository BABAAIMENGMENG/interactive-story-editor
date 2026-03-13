import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 点赞/取消点赞项目
 * POST /api/projects/[id]/like
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // 获取用户标识（登录用户ID或访客ID）
    const body = await request.json();
    const userId = body.userId || body.visitorId;
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用户标识' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 检查是否已点赞
    const { data: existingLike, error: checkError } = await supabase
      .from('project_likes')
      .select('id')
      .eq('projectId', projectId)
      .eq('userId', userId)
      .single();

    if (existingLike) {
      // 已点赞，执行取消点赞
      const { error: deleteError } = await supabase
        .from('project_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('取消点赞失败:', deleteError);
        return NextResponse.json({ error: '操作失败' }, { status: 500 });
      }

      // 减少点赞数
      const { data: project } = await supabase
        .from('projects')
        .select('likeCount')
        .eq('id', projectId)
        .single();

      if (project) {
        await supabase
          .from('projects')
          .update({ likeCount: Math.max(0, (project.likeCount || 0) - 1) })
          .eq('id', projectId);
      }

      return NextResponse.json({
        success: true,
        liked: false,
        message: '已取消点赞',
      });
    } else {
      // 未点赞，执行点赞
      const { error: insertError } = await supabase
        .from('project_likes')
        .insert({
          projectId,
          userId,
        });

      if (insertError) {
        console.error('点赞失败:', insertError);
        return NextResponse.json({ error: '操作失败' }, { status: 500 });
      }

      // 增加点赞数
      const { data: project } = await supabase
        .from('projects')
        .select('likeCount')
        .eq('id', projectId)
        .single();

      if (project) {
        await supabase
          .from('projects')
          .update({ likeCount: (project.likeCount || 0) + 1 })
          .eq('id', projectId);
      }

      return NextResponse.json({
        success: true,
        liked: true,
        message: '点赞成功',
      });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

/**
 * 检查是否已点赞
 * GET /api/projects/[id]/like?userId=xxx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ liked: false });
    }

    const supabase = getSupabaseClient();

    const { data: like } = await supabase
      .from('project_likes')
      .select('id')
      .eq('projectId', projectId)
      .eq('userId', userId)
      .single();

    return NextResponse.json({
      success: true,
      liked: !!like,
    });
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    return NextResponse.json({ liked: false });
  }
}
