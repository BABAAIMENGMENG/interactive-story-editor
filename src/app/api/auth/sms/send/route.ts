import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { storeCode, isDevMode, getDevCode } from '@/lib/sms-store';

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

    // 开发模式：使用固定验证码
    if (isDevMode()) {
      const code = storeCode(phone, getDevCode());
      console.log(`[开发模式] 手机号 ${phone} 验证码: ${code}`);

      return NextResponse.json({ 
        success: true, 
        message: '验证码已发送（开发模式）',
        devCode: code, // 开发环境返回验证码方便测试
      });
    }

    // 生产模式：使用 Supabase 发送真实短信
    const formattedPhone = `+86${phone}`;
    const supabase = getSupabaseClient();

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('发送验证码失败:', error);
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ error: '发送过于频繁，请稍后再试' }, { status: 429 });
      }
      
      // 如果 Supabase 短信服务未配置，回退到模拟模式
      if (error.message.includes('SMS') || error.message.includes('provider')) {
        console.log('Supabase 短信服务未配置，使用模拟验证码');
        const code = storeCode(phone);

        return NextResponse.json({ 
          success: true, 
          message: '验证码已发送（模拟模式）',
          devCode: code,
        });
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
