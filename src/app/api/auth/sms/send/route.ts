import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 发送短信验证码
 * POST /api/auth/sms/send
 */
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: '请输入手机号' }, { status: 400 });
    }

    // 验证手机号格式（中国大陆手机号）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 });
    }

    // 格式化为国际格式（+86）
    const formattedPhone = `+86${phone}`;

    const supabase = getSupabaseClient();

    // 使用 Supabase 发送 OTP 验证码
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: true, // 如果用户不存在则自动创建
      },
    });

    if (error) {
      console.error('发送验证码失败:', error);
      
      // 处理常见错误
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ error: '发送过于频繁，请稍后再试' }, { status: 429 });
      }
      
      return NextResponse.json({ error: '验证码发送失败，请稍后重试' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '验证码已发送，请注意查收' 
    });

  } catch (error) {
    console.error('发送验证码错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
