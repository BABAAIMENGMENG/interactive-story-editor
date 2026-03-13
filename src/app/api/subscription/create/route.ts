import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 创建订阅订单
 * POST /api/subscription/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, billingCycle, paymentMethod, amount } = body;

    // 从请求头获取用户ID
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 验证套餐
    const plans: Record<string, { tier: string; price: number; yearlyPrice: number }> = {
      pro: { tier: 'pro', price: 2900, yearlyPrice: 29900 },
      enterprise: { tier: 'enterprise', price: 9900, yearlyPrice: 99900 },
    };

    const plan = plans[planId];
    if (!plan) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 });
    }

    // 计算订阅时间
    const now = new Date();
    const endDate = billingCycle === 'yearly'
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const supabase = getSupabaseClient();

    // 创建订阅记录
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        id: subscriptionId,
        userId,
        tier: plan.tier,
        status: 'active',
        paymentProvider: paymentMethod,
        paymentId,
        amount,
        currency: 'CNY',
        interval: billingCycle,
        startAt: now.toISOString(),
        endAt: endDate.toISOString(),
      });

    if (subError) {
      console.error('创建订阅失败:', subError);
      return NextResponse.json({ error: '创建订阅失败' }, { status: 500 });
    }

    // 更新用户订阅状态
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscriptionTier: plan.tier,
        subscriptionStatus: 'active',
        subscriptionStartAt: now.toISOString(),
        subscriptionEndAt: endDate.toISOString(),
      })
      .eq('userId', userId);

    if (profileError) {
      console.error('更新用户状态失败:', profileError);
    }

    // 生成支付URL（实际应调用微信/支付宝API）
    // 这里返回模拟数据
    const paymentUrl = `https://example.com/pay/${paymentId}`;

    return NextResponse.json({
      success: true,
      subscriptionId,
      paymentId,
      paymentUrl,
      amount,
      expireAt: endDate.toISOString(),
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}

/**
 * 检查订阅状态
 * GET /api/subscription/status
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // 获取用户订阅信息
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscriptionTier, subscriptionStatus, subscriptionEndAt')
      .eq('userId', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: '获取订阅信息失败' }, { status: 500 });
    }

    // 检查是否过期
    const now = new Date();
    const endDate = profile.subscriptionEndAt ? new Date(profile.subscriptionEndAt) : null;
    const isExpired = endDate ? now > endDate : false;

    // 如果过期，更新状态
    if (isExpired && profile.subscriptionStatus === 'active') {
      await supabase
        .from('profiles')
        .update({ subscriptionStatus: 'expired' })
        .eq('userId', userId);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        tier: profile.subscriptionTier || 'free',
        status: isExpired ? 'expired' : (profile.subscriptionStatus || 'active'),
        endDate: profile.subscriptionEndAt,
        isExpired,
      },
    });
  } catch (error) {
    console.error('获取订阅状态失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
