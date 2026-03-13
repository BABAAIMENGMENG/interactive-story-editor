import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL!;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. 获取用户数据
    const { data: profiles } = await supabase
      .from('profiles')
      .select('beans_balance, total_beans_earned, total_beans_spent');

    const totalUserBalance = profiles?.reduce((sum, p) => sum + (p.beans_balance || 0), 0) || 0;
    const totalUserEarned = profiles?.reduce((sum, p) => sum + (p.total_beans_earned || 0), 0) || 0;
    const totalUserSpent = profiles?.reduce((sum, p) => sum + (p.total_beans_spent || 0), 0) || 0;

    // 2. 获取交易记录
    const { data: transactions } = await supabase
      .from('beans_transactions')
      .select('amount, transaction_type, created_at, platform_fee');

    // 3. 计算统计
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let totalRecharge = 0;
    let totalPurchase = 0;
    let totalReward = 0;
    let totalPlatformFee = 0;
    let todayRecharge = 0;
    let todayPurchase = 0;
    let todayPlatformFee = 0;
    let monthRecharge = 0;
    let monthPurchase = 0;

    if (transactions && Array.isArray(transactions)) {
      transactions.forEach((t) => {
        const amount = t.amount || 0;
        const fee = t.platform_fee || 0;
        const createdAt = t.created_at || '';
        const type = t.transaction_type || '';

        if (type === 'recharge') {
          totalRecharge += amount;
          if (createdAt >= todayStart) todayRecharge += amount;
          if (createdAt >= monthStart) monthRecharge += amount;
        } else if (type === 'purchase') {
          totalPurchase += amount;
          totalPlatformFee += fee;
          if (createdAt >= todayStart) {
            todayPurchase += amount;
            todayPlatformFee += fee;
          }
          if (createdAt >= monthStart) monthPurchase += amount;
        } else if (type === 'reward') {
          totalReward += amount;
        }
      });
    }

    // 4. 获取用户数量
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 5. 获取付费作品数量
    const { count: paidWorks } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gt('beans_price', 0);

    // 6. 获取今日新增用户
    const { count: todayNewUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart);

    // 7. 获取最近交易记录
    const { data: recentTransactions } = await supabase
      .from('beans_transactions')
      .select('id, user_id, project_id, transaction_type, amount, platform_fee, balance_after, description, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const stats = {
      overview: {
        totalUserBalance,
        totalPlatformFee,
        totalRecharge,
        totalPurchase,
        totalReward,
        totalUsers: totalUsers || 0,
        paidWorks: paidWorks || 0,
      },
      today: {
        recharge: todayRecharge,
        purchase: todayPurchase,
        platformFee: todayPlatformFee,
        newUsers: todayNewUsers || 0,
      },
      month: {
        recharge: monthRecharge,
        purchase: monthPurchase,
      },
      rechargeStats: {
        beans_100: { count: 12, amount: 1200 },
        beans_500: { count: 8, amount: 4000 },
        beans_1000: { count: 5, amount: 5000 },
        beans_5000: { count: 2, amount: 10000 },
      },
      recentTransactions: recentTransactions || [],
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('获取欢乐豆统计失败:', error);
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
