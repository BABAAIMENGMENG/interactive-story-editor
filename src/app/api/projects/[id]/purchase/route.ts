import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 购买作品 API
 * POST /api/projects/[id]/purchase
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. 获取项目信息
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, beans_price, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: '作品不存在' }, { status: 404 });
    }

    // 2. 检查是否已购买
    const { data: existingPurchase } = await supabase
      .from('project_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single();

    if (existingPurchase) {
      return NextResponse.json({ 
        success: true, 
        message: '已购买过此作品',
        alreadyPurchased: true 
      });
    }

    // 3. 如果是免费作品，直接记录购买
    if (project.beans_price === 0) {
      const { error: purchaseError } = await supabase
        .from('project_purchases')
        .insert({
          user_id: userId,
          project_id: projectId,
          beans_spent: 0,
        });

      if (purchaseError) {
        return NextResponse.json({ error: '购买失败' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: '免费作品，已添加到已购列表',
        beansSpent: 0 
      });
    }

    // 4. 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, user_id, beans_balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 5. 检查余额
    if ((user.beans_balance || 0) < project.beans_price) {
      return NextResponse.json({ 
        error: '快乐豆不足',
        required: project.beans_price,
        current: user.beans_balance || 0 
      }, { status: 400 });
    }

    // 6. 扣除用户快乐豆
    const newBalance = (user.beans_balance || 0) - project.beans_price;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ beans_balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: '扣除快乐豆失败' }, { status: 500 });
    }

    // 7. 计算创作者收入（平台抽成规则）
    // 小额作品（1-9豆）：平台不抽成，创作者获得全部
    // 10豆及以上：平台抽成10%（向下取整，最低1豆）
    let platformFee = 0;
    let creatorEarnings = project.beans_price;
    
    if (project.beans_price >= 10) {
      platformFee = Math.max(1, Math.floor(project.beans_price * 0.1));
      creatorEarnings = project.beans_price - platformFee;
    }
    // 10豆以下不抽成，创作者获得全部

    // 8. 给创作者增加快乐豆
    const { data: creator } = await supabase
      .from('profiles')
      .select('beans_balance')
      .eq('user_id', project.user_id)
      .single();

    if (creator) {
      await supabase
        .from('profiles')
        .update({ 
          beans_balance: (creator.beans_balance || 0) + creatorEarnings 
        })
        .eq('user_id', project.user_id);
    }

    // 9. 更新作品累计收入
    const { data: projectStats } = await supabase
      .from('projects')
      .select('total_beans_earned')
      .eq('id', projectId)
      .single();

    if (projectStats) {
      await supabase
        .from('projects')
        .update({ total_beans_earned: (projectStats.total_beans_earned || 0) + creatorEarnings })
        .eq('id', projectId);
    }

    // 10. 记录交易
    await supabase
      .from('beans_transactions')
      .insert({
        user_id: user.user_id,
        project_id: projectId,
        transaction_type: 'spend',
        amount: -project.beans_price,
        balance_after: newBalance,
        description: `购买作品《${project.name}》，平台抽成${platformFee}豆`,
      });

    // 11. 为创作者记录收入
    if (creator) {
      await supabase
        .from('beans_transactions')
        .insert({
          user_id: project.user_id,
          project_id: projectId,
          transaction_type: 'earn',
          amount: creatorEarnings,
          balance_after: (creator.beans_balance || 0) + creatorEarnings,
          description: `作品《${project.name}》收入，平台抽成${platformFee}豆`,
        });
    }

    // 10. 记录购买
    const { error: finalPurchaseError } = await supabase
      .from('project_purchases')
      .insert({
        user_id: userId,
        project_id: projectId,
        beans_spent: project.beans_price,
      });

    if (finalPurchaseError) {
      return NextResponse.json({ error: '记录购买失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '购买成功',
      beansSpent: project.beans_price,
      creatorEarnings: creatorEarnings,
      platformFee: platformFee,
      newBalance: newBalance,
    });

  } catch (error) {
    console.error('购买作品失败:', error);
    return NextResponse.json({ error: '购买失败' }, { status: 500 });
  }
}

/**
 * 检查购买状态 API
 * GET /api/projects/[id]/purchase?userId=xxx
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
      return NextResponse.json({ purchased: false });
    }

    const supabase = getSupabaseClient();

    // 检查是否已购买
    const { data: purchase } = await supabase
      .from('project_purchases')
      .select('id, beans_spent, created_at')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single();

    // 获取作品信息
    const { data: project } = await supabase
      .from('projects')
      .select('beans_price')
      .eq('id', projectId)
      .single();

    return NextResponse.json({
      purchased: !!purchase,
      purchaseInfo: purchase || null,
      beansPrice: project?.beans_price || 0,
      isFree: (project?.beans_price || 0) === 0,
    });

  } catch (error) {
    console.error('检查购买状态失败:', error);
    return NextResponse.json({ purchased: false });
  }
}
