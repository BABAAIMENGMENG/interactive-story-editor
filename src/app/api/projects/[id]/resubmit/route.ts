import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

/**
 * 重新提交审核
 * POST /api/projects/[id]/resubmit
 */
export async function POST(
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
    const { data: project, error: findError } = await supabase
      .from('projects')
      .select('user_id, review_status')
      .eq('id', id)
      .single();

    if (findError || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: '无权操作此项目' }, { status: 403 });
    }

    // 只有被拒绝或需要修改的项目可以重新提交
    if (!['rejected', 'revision_needed'].includes(project.review_status || '')) {
      return NextResponse.json({ error: '当前状态不支持重新提交' }, { status: 400 });
    }

    // 重置审核状态
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        review_status: 'pending',
        review_notes: null,
        submitted_for_review_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('重新提交审核失败:', updateError);
      return NextResponse.json({ error: '重新提交失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '已重新提交审核' });
  } catch (error) {
    console.error('重新提交审核异常:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
