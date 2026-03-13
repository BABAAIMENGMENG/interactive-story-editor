import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 欢乐豆统计 API
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 获取所有用户的欢乐豆余额统计
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('beans_balance, total_beans_earned, total_beans_spent');

    if (profilesError) {
      console.error('获取用户数据失败:', profilesError);
    }

    // 计算用户总余额和累计数据
    const totalUserBalance = profiles?.reduce((sum, p) => sum + (p.beans_balance || 0), 0) || 0;
    const totalUserEarned = profiles?.reduce((sum, p) => sum + (p.total_beans_earned || 0), 0) || 0;
    const totalUserSpent = profiles?.reduce((sum, p) => sum + (p.total_beans_spent || 0), 0) || 0;

    // 2. 获取交易记录统计
    const { data: transactions, error: transactionsError } = await supabase
      .from('beans_transactions')
      .select('amount, transaction_type, created_at, platform_fee');

    if (transactionsError) {
      console.error('获取交易记录失败:', transactionsError);
    }

    // 3. 计算各类交易统计
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let totalRecharge = 0;      // 总充值
    let totalPurchase = 0;      // 总购买消费
    let totalReward = 0;        // 总奖励
    let totalPlatformFee = 0;   // 平台累计抽成
    let todayRecharge = 0;      // 今日充值
    let todayPurchase = 0;      // 今日购买
    let todayPlatformFee = 0;   // 今日平台抽成
    let monthRecharge = 0;      // 本月充值
    let monthPurchase = 0;      // 本月购买

    transactions?.forEach((t) => {
      const amount = t.amount || 0;
      const fee = t.platform_fee || 0;
      const createdAt = t.created_at || '';
      const type = t.transaction_type || '';

      // 总计
      if (type === 'recharge') {
        totalRecharge += amount;
      } else if (type === 'purchase') {
        totalPurchase += amount;
        totalPlatformFee += fee;
      } else if (type === 'reward') {
        totalReward += amount;
      }

      // 今日
      if (createdAt >= todayStart) {
        if (type === 'recharge') {
          todayRecharge += amount;
        } else if (type === 'purchase') {
          todayPurchase += amount;
          todayPlatformFee += fee;
        }
      }

      // 本月
      if (createdAt >= monthStart) {
        if (type === 'recharge') {
          monthRecharge += amount;
        } else if (type === 'purchase') {
          monthPurchase += amount;
        }
      }
    });

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

    // 7. 最近交易记录
    const { data: recentTransactions } = await supabase
      .from('beans_transactions')
      .select('id, user_id, project_id, transaction_type, amount, platform_fee, balance_after, description, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // 8. 充值排行（模拟数据，实际需要真实交易记录）
    const rechargeStats = {
      beans_100: { count: 12, amount: 1200 },
      beans_500: { count: 8, amount: 4000 },
      beans_1000: { count: 5, amount: 5000 },
      beans_5000: { count: 2, amount: 10000 },
    };

    const stats = {
      // 概览数据
      overview: {
        totalUserBalance,      // 用户手中总欢乐豆
        totalPlatformFee,      // 平台累计抽成
        totalRecharge,         // 总充值
        totalPurchase,         // 总消费
        totalReward,           // 总奖励发放
        totalUsers: totalUsers || 0,
        paidWorks: paidWorks || 0,
      },
      // 今日数据
      today: {
        recharge: todayRecharge,
        purchase: todayPurchase,
        platformFee: todayPlatformFee,
        newUsers: todayNewUsers || 0,
      },
      // 本月数据
      month: {
        recharge: monthRecharge,
        purchase: monthPurchase,
      },
      // 充值套餐统计
      rechargeStats,
      // 最近交易
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
