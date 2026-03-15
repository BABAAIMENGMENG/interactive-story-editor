import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 验证码登录
 * POST /api/auth/sms/verify
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: '请输入手机号和验证码' }, { status: 400 });
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 });
    }

    // 验证码格式（6位数字）
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: '请输入6位数字验证码' }, { status: 400 });
    }

    // 格式化为国际格式（+86）
    const formattedPhone = `+86${phone}`;

    const supabase = getSupabaseClient();

    // 验证 OTP
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: code,
      type: 'sms',
    });

    if (error) {
      console.error('验证码验证失败:', error);
      
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        return NextResponse.json({ error: '验证码错误或已过期，请重新获取' }, { status: 400 });
      }
      
      return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 });
    }

    if (!data.session) {
      return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 });
    }

    // 检查是否是新用户，如果是则创建 profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('userId, name, subscription_tier, subscription_status, projects_count')
      .eq('userId', data.user?.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // 用户不存在，创建 profile
      const randomName = `用户${phone.slice(-4)}`;
      await supabase.from('profiles').insert({
        userId: data.user?.id,
        name: randomName,
        phone: phone,
        subscription_tier: 'free',
        subscription_status: 'active',
        beans_balance: 100, // 新用户赠送100豆
        projects_count: 0,
      });
    }

    // 返回用户信息和 session
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        phone: phone,
        name: profile?.name || `用户${phone.slice(-4)}`,
        subscriptionTier: profile?.subscription_tier || 'free',
        subscriptionStatus: profile?.subscription_status || 'active',
        projectsCount: profile?.projects_count || 0,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });

  } catch (error) {
    console.error('验证码登录错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
