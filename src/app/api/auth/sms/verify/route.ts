import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyStoredCode, isDevMode } from '@/lib/sms-store';
import { randomUUID } from 'crypto';

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

    // 开发模式或模拟模式：使用本地验证
    if (isDevMode()) {
      // 本地验证码验证
      if (!verifyStoredCode(phone, code)) {
        return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
      }

      // 查找或创建用户
      const supabase = getSupabaseClient();
      
      // 查找是否已有该手机号的用户
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id, name, subscription_tier, subscription_status, projects_count')
        .eq('phone', phone)
        .single();

      if (existingProfile) {
        // 用户已存在，返回登录成功
        return NextResponse.json({
          success: true,
          user: {
            id: existingProfile.user_id,
            phone: phone,
            name: existingProfile.name,
            subscriptionTier: existingProfile.subscription_tier || 'free',
            subscriptionStatus: existingProfile.subscription_status || 'active',
            projectsCount: existingProfile.projects_count || 0,
          },
          session: {
            access_token: `mock_token_${Date.now()}`,
            refresh_token: `mock_refresh_${Date.now()}`,
          },
        });
      }

      // 创建新用户 - 使用真实 UUID
      const newUserId = randomUUID();
      const randomName = `用户${phone.slice(-4)}`;

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: newUserId,
          name: randomName,
          phone: phone,
          subscription_tier: 'free',
          subscription_status: 'active',
          beans_balance: 100,
          projects_count: 0,
        });

      if (insertError) {
        console.error('创建用户失败:', insertError);
        return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: newUserId,
          phone: phone,
          name: randomName,
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          projectsCount: 0,
        },
        session: {
          access_token: `mock_token_${Date.now()}`,
          refresh_token: `mock_refresh_${Date.now()}`,
        },
      });
    }

    // 生产模式：使用 Supabase 验证
    const formattedPhone = `+86${phone}`;
    const supabase = getSupabaseClient();

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
      .select('user_id, name, subscription_tier, subscription_status, projects_count')
      .eq('user_id', data.user?.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // 用户不存在，创建 profile
      const randomName = `用户${phone.slice(-4)}`;
      await supabase.from('profiles').insert({
        user_id: data.user?.id,
        name: randomName,
        phone: phone,
        subscription_tier: 'free',
        subscription_status: 'active',
        beans_balance: 100,
        projects_count: 0,
      });
    }

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
