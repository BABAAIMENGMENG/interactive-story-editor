import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

/**
 * 邀请奖励配置
 */
const INVITE_REWARD = {
  inviter: 50,  // 邀请人获得50豆
  invitee: 50,  // 被邀请人获得50豆
};

/**
 * 获取用户邀请信息
 * GET /api/invite?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 获取用户信息
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, invite_code, invited_by, invite_rewarded, beans_balance')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 如果用户没有邀请码，生成一个
    if (!profile.invite_code) {
      const inviteCode = generateInviteCode();
      await supabase
        .from('profiles')
        .update({ invite_code: inviteCode })
        .eq('id', userId);
      profile.invite_code = inviteCode;
    }

    // 获取邀请统计
    const { data: invitees } = await supabase
      .from('profiles')
      .select('id, name, created_at')
      .eq('invited_by', userId);

    // 获取邀请奖励统计
    const { data: rewardTransactions } = await supabase
      .from('beans_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .eq('transaction_type', 'invite_reward');

    const totalInviteRewards = rewardTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const inviteCount = invitees?.length || 0;

    // 构建邀请链接（优先使用请求的 origin）
    const host = request.headers.get('host') || 'localhost:5000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    return NextResponse.json({
      success: true,
      inviteCode: profile.invite_code,
      inviteLink: `${baseUrl}/invite/${profile.invite_code}`,
      invitedBy: profile.invited_by,
      inviteRewarded: profile.invite_rewarded,
      inviteCount,
      totalInviteRewards,
      inviteReward: INVITE_REWARD,
    });
  } catch (error) {
    console.error('获取邀请信息失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * 领取邀请奖励
 * POST /api/invite
 * Body: { userId: string, inviteCode: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, inviteCode } = body;

    if (!userId || !inviteCode) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. 获取当前用户信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, invite_code, invited_by, invite_rewarded, beans_balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 2. 检查是否已经领取过奖励
    if (profile.invite_rewarded) {
      return NextResponse.json({ 
        success: false, 
        message: '已经领取过邀请奖励' 
      });
    }

    // 3. 检查是否已经有邀请人
    if (profile.invited_by) {
      return NextResponse.json({ 
        success: false, 
        message: '已经绑定过邀请人' 
      });
    }

    // 4. 查找邀请人
    const { data: inviter, error: inviterError } = await supabase
      .from('profiles')
      .select('id, user_id, invite_code, beans_balance')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (inviterError || !inviter) {
      return NextResponse.json({ error: '邀请码无效' }, { status: 400 });
    }

    // 5. 不能邀请自己
    if (inviter.id === userId) {
      return NextResponse.json({ error: '不能使用自己的邀请码' }, { status: 400 });
    }

    // 6. 更新被邀请人信息
    await supabase
      .from('profiles')
      .update({ 
        invited_by: inviter.id,
        invite_rewarded: true,
        beans_balance: (profile.beans_balance || 0) + INVITE_REWARD.invitee,
      })
      .eq('id', userId);

    // 7. 给邀请人增加快乐豆
    await supabase
      .from('profiles')
      .update({ 
        beans_balance: (inviter.beans_balance || 0) + INVITE_REWARD.inviter,
      })
      .eq('id', inviter.id);

    // 8. 记录被邀请人的奖励交易
    await supabase
      .from('beans_transactions')
      .insert({
        user_id: profile.user_id,
        transaction_type: 'invite_reward',
        amount: INVITE_REWARD.invitee,
        balance_after: (profile.beans_balance || 0) + INVITE_REWARD.invitee,
        description: `使用邀请码注册，获得${INVITE_REWARD.invitee}豆奖励`,
      });

    // 9. 记录邀请人的奖励交易
    await supabase
      .from('beans_transactions')
      .insert({
        user_id: inviter.user_id,
        transaction_type: 'invite_reward',
        amount: INVITE_REWARD.inviter,
        balance_after: (inviter.beans_balance || 0) + INVITE_REWARD.inviter,
        description: `邀请新用户注册，获得${INVITE_REWARD.inviter}豆奖励`,
      });

    return NextResponse.json({
      success: true,
      message: '邀请奖励领取成功',
      inviteeReward: INVITE_REWARD.invitee,
      inviterReward: INVITE_REWARD.inviter,
      newBalance: (profile.beans_balance || 0) + INVITE_REWARD.invitee,
    });
  } catch (error) {
    console.error('领取邀请奖励失败:', error);
    return NextResponse.json({ error: '领取失败' }, { status: 500 });
  }
}

/**
 * 生成邀请码
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
