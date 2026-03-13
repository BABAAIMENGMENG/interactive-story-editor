import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

// 人工审核
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { status, notes, reviewerId } = body;

    console.log('人工审核请求:', { id, status, notes, reviewerId });

    if (!['approved', 'rejected', 'revision_needed'].includes(status)) {
      return NextResponse.json({ error: '无效的审核状态' }, { status: 400 });
    }

    // 获取项目信息
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    console.log('获取项目:', { project, projectError });

    if (projectError || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 更新项目审核状态
    const updateData: Record<string, any> = {
      review_status: status,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    };

    // 只有传入有效的 UUID 才设置 reviewed_by
    if (reviewerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewerId)) {
      updateData.reviewed_by = reviewerId;
    }

    console.log('更新数据:', updateData);

    const { data: updateResult, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select();

    console.log('更新结果:', { updateResult, updateError });

    if (updateError) {
      console.error('更新审核状态失败:', updateError);
      return NextResponse.json({ error: '审核失败', details: updateError.message }, { status: 500 });
    }

    // 如果审核通过，将项目设为公开
    if (status === 'approved' && !project.is_public) {
      const { error: publicError } = await supabase
        .from('projects')
        .update({ is_public: true })
        .eq('id', id);
      
      console.log('更新公开状态:', { publicError });
    }

    // 记录审核历史（可选，不中断流程）
    try {
      await supabase
        .from('project_reviews')
        .insert({
          project_id: id,
          reviewer_id: reviewerId || null,
          review_type: 'manual',
          status,
          notes,
          review_data: { previous_status: project.review_status },
        });
    } catch (e) {
      console.log('记录审核历史失败（可忽略）:', e);
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('审核异常:', error);
    return NextResponse.json({ error: '服务器错误', details: String(error) }, { status: 500 });
  }
}

// AI审核
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // 获取项目信息
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 简单的 AI 审核逻辑
    const issues: string[] = [];
    let score = 1.0;

    if (!project.name || project.name.trim().length < 2) {
      issues.push('标题过短');
      score -= 0.2;
    }

    if (!project.description || project.description.trim().length < 10) {
      issues.push('描述过短');
      score -= 0.2;
    }

    score = Math.max(0, Math.min(1, score));

    const aiResult = {
      passed: score >= 0.8,
      score,
      issues,
    };

    // 更新 AI 审核状态
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        ai_review_status: aiResult.passed ? 'passed' : 'failed',
        ai_review_result: {
          score: aiResult.score,
          issues: aiResult.issues,
          threshold: 0.8,
        },
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      aiResult,
    });
  } catch (error) {
    console.error('AI审核异常:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 获取单个项目的审核详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
