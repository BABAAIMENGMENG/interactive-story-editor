import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// AI审核规则（基于内容质量的简单评分）
async function performAIReview(project: {
  name: string;
  description?: string;
  scenes?: any[];
  category?: string;
}): Promise<{ passed: boolean; score: number; issues: string[] }> {
  const issues: string[] = [];
  let score = 1.0;

  // 1. 标题检查
  if (!project.name || project.name.trim().length < 2) {
    issues.push('标题过短或为空');
    score -= 0.2;
  } else if (project.name.length > 50) {
    issues.push('标题过长（建议不超过50字）');
    score -= 0.1;
  }

  // 2. 描述检查
  if (!project.description || project.description.trim().length < 10) {
    issues.push('描述内容过短，建议至少10个字符');
    score -= 0.2;
  }

  // 3. 场景内容检查
  const scenes = project.scenes || [];
  if (scenes.length === 0) {
    issues.push('项目没有任何场景');
    score -= 0.3;
  } else {
    // 检查场景是否有实质内容
    const hasValidScene = scenes.some((scene: any) => {
      const elements = scene.elements || [];
      const hotspots = scene.hotspots || [];
      return scene.panorama || elements.length > 0 || hotspots.length > 0;
    });

    if (!hasValidScene) {
      issues.push('场景缺少有效内容（全景图、元素或热点）');
      score -= 0.2;
    }
  }

  // 4. 敏感词检查（示例）
  const sensitiveWords = ['违规词', '敏感词', '广告']; // 实际应从数据库加载
  const contentToCheck = `${project.name} ${project.description || ''}`;
  const foundSensitive = sensitiveWords.filter(word => contentToCheck.includes(word));
  if (foundSensitive.length > 0) {
    issues.push(`内容包含敏感词：${foundSensitive.join(', ')}`);
    score -= 0.5;
  }

  // 确保分数在0-1之间
  score = Math.max(0, Math.min(1, score));

  return {
    passed: score >= 0.8,
    score,
    issues,
  };
}

// 获取单个项目的审核详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // 获取项目详情
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        profiles:user_id (name, email)
      `)
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 获取审核历史
    const { data: reviews } = await supabase
      .from('project_reviews')
      .select(`
        *,
        profiles:reviewer_id (name)
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      project,
      reviews: reviews || [],
    });
  } catch (error) {
    console.error('获取项目审核详情异常:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

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

    if (!['approved', 'rejected', 'revision_needed'].includes(status)) {
      return NextResponse.json({ error: '无效的审核状态' }, { status: 400 });
    }

    // 获取项目信息
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 更新项目审核状态
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        review_status: status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        review_notes: notes,
      })
      .eq('id', id);

    if (updateError) {
      console.error('更新审核状态失败:', updateError);
      return NextResponse.json({ error: '审核失败' }, { status: 500 });
    }

    // 记录审核历史
    const { error: reviewError } = await supabase
      .from('project_reviews')
      .insert({
        project_id: id,
        reviewer_id: reviewerId,
        review_type: 'manual',
        status,
        notes,
        review_data: { previous_status: project.review_status },
      });

    if (reviewError) {
      console.error('记录审核历史失败:', reviewError);
      // 不中断流程，只记录错误
    }

    // 如果审核通过，触发器会自动奖励快乐豆
    // 如果审核通过且项目设为公开，更新状态
    if (status === 'approved' && !project.is_public) {
      await supabase
        .from('projects')
        .update({ is_public: true })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('审核异常:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
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

    // 执行AI审核
    const aiResult = await performAIReview(project);

    // 获取系统设置中的自动通过阈值
    const { data: settings } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'auto_approve_threshold')
      .single();

    const threshold = settings ? parseFloat(settings.setting_value) : 0.8;

    // 更新AI审核状态
    const updateData: any = {
      ai_review_status: aiResult.passed ? 'passed' : 'failed',
      ai_review_result: {
        score: aiResult.score,
        issues: aiResult.issues,
        threshold,
        reviewed_at: new Date().toISOString(),
      },
    };

    // 如果启用了AI自动审核且通过，直接标记为待人工审核
    const { data: manualRequired } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'manual_review_required')
      .single();

    const needsManualReview = manualRequired?.setting_value === 'true';

    if (aiResult.passed && needsManualReview) {
      // AI通过，等待人工审核
      updateData.review_status = 'pending';
    } else if (aiResult.passed && !needsManualReview) {
      // AI通过且不需要人工审核，直接通过
      updateData.review_status = 'approved';
      updateData.reviewed_at = new Date().toISOString();
    } else {
      // AI不通过，标记为需要修改
      updateData.review_status = 'revision_needed';
      updateData.review_notes = `AI审核未通过（得分：${aiResult.score.toFixed(2)}）\n问题：${aiResult.issues.join('；')}`;
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('更新AI审核结果失败:', updateError);
      return NextResponse.json({ error: '审核失败' }, { status: 500 });
    }

    // 记录AI审核历史
    await supabase
      .from('project_reviews')
      .insert({
        project_id: id,
        review_type: 'ai',
        status: aiResult.passed ? 'approved' : 'revision_needed',
        notes: `AI审核得分：${aiResult.score.toFixed(2)}`,
        review_data: aiResult,
      });

    return NextResponse.json({
      success: true,
      aiResult,
      needsManualReview,
    });
  } catch (error) {
    console.error('AI审核异常:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
