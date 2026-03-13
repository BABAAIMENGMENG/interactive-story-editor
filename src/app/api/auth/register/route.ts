import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 注册新用户
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少需要6位' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 使用 Supabase Auth 注册
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: '注册失败' }, { status: 500 });
    }

    // 创建用户资料
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email: email,
        name: name || email.split('@')[0],
        subscription_tier: 'free',
        subscription_status: 'active',
        projects_count: 0,
      });

    if (profileError) {
      console.error('创建用户资料失败:', profileError);
      // 不返回错误，因为用户已经创建成功
    }

    // 返回用户信息
    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: email,
        name: name || email.split('@')[0],
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        projectsCount: 0,
      },
      session: authData.session,
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
