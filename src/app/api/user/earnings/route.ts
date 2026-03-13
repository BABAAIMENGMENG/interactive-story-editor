import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 获取创作者收入统计
 * GET /api/user/earnings
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const supabase = getSupabaseClient(token);
    
    // 获取用户信息
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 获取用户资料
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('beans_balance, total_beans_earned')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
    }

    // 获取用户的作品列表（含收入统计）
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, cover_image, beans_price, total_beans_earned, view_count, like_count, created_at, review_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 获取收入交易记录
    const { data: earnings, error: earningsError } = await supabase
      .from('beans_transactions')
      .select('id, amount, balance_after, description, created_at, project_id')
      .eq('user_id', user.id)
      .eq('transaction_type', 'earn')
      .order('created_at', { ascending: false })
      .limit(50);

    // 计算统计数据
    const totalWorks = projects?.length || 0;
    const paidWorks = projects?.filter(p => p.beans_price > 0).length || 0;
    const totalWorksEarnings = projects?.reduce((sum, p) => sum + (p.total_beans_earned || 0), 0) || 0;
    const totalViews = projects?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;
    const totalLikes = projects?.reduce((sum, p) => sum + (p.like_count || 0), 0) || 0;

    // 本月收入（简化计算）
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEarnings = earnings?.filter(e => new Date(e.created_at) >= monthStart)
      .reduce((sum, e) => sum + e.amount, 0) || 0;

    // 今日收入
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEarnings = earnings?.filter(e => new Date(e.created_at) >= todayStart)
      .reduce((sum, e) => sum + e.amount, 0) || 0;

    return NextResponse.json({
      // 总览
      balance: profile?.beans_balance || 0,
      totalEarnings: profile?.total_beans_earned || 0,
      totalWorksEarnings,
      
      // 统计
      totalWorks,
      paidWorks,
      totalViews,
      totalLikes,
      
      // 时间段收入
      monthEarnings,
      todayEarnings,
      
      // 作品列表
      projects: projects || [],
      
      // 收入明细
      recentEarnings: earnings || [],
    });

  } catch (error) {
    console.error('获取收入统计失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
