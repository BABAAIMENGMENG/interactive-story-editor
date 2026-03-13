import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    // 从请求头获取 token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const supabase = getSupabaseClient(token);

    // 获取当前用户
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // 获取用户资料
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email || '',
        name: profile?.name || authUser.user_metadata?.name || '',
        avatar: profile?.avatar,
        subscriptionTier: profile?.subscription_tier || 'free',
        subscriptionStatus: profile?.subscription_status || 'active',
        projectsCount: profile?.projects_count || 0,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
