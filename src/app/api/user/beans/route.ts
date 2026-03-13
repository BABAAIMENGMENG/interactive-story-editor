import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 充值套餐配置
const RECHARGE_PACKAGES: Record<string, { beans: number; price: number }> = {
  beans_100: { beans: 100, price: 10 },
  beans_500: { beans: 500, price: 45 },
  beans_1000: { beans: 1000, price: 80 },
  beans_5000: { beans: 5000, price: 350 },
  beans_10000: { beans: 10000, price: 600 },
};

/**
 * 获取用户快乐豆余额
 * GET /api/user/beans
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const includeTransactions = searchParams.get('transactions') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('beans_balance, total_beans_earned, total_beans_spent')
      .eq('id', user.id)
      .single();

    if (error) {
      // 如果用户资料不存在，创建一个
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0],
            beans_balance: 100, // 新用户赠送100豆
          })
          .select('beans_balance, total_beans_earned, total_beans_spent')
          .single();

        if (createError) {
          return NextResponse.json({ error: '创建用户失败' }, { status: 500 });
        }

        return NextResponse.json({
          balance: newProfile.beans_balance || 0,
          totalEarned: newProfile.total_beans_earned || 0,
          totalSpent: newProfile.total_beans_spent || 0,
        });
      }
      
      return NextResponse.json({ error: '获取余额失败' }, { status: 500 });
    }

    const result: any = {
      balance: profile?.beans_balance || 0,
      totalEarned: profile?.total_beans_earned || 0,
      totalSpent: profile?.total_beans_spent || 0,
    };

    // 如果请求交易记录
    if (includeTransactions) {
      const offset = (page - 1) * limit;
      
      const { data: transactions, error: txError, count } = await supabase
        .from('beans_transactions')
        .select('id, transaction_type, amount, balance_after, description, created_at, project_id', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!txError) {
        result.transactions = transactions || [];
        result.totalTransactions = count || 0;
        result.page = page;
        result.limit = limit;
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('获取快乐豆余额失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * 充值快乐豆
 * POST /api/user/beans
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { packageId, paymentMethod } = body;

    // 验证套餐
    const pkg = RECHARGE_PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json({ error: '无效的充值套餐' }, { status: 400 });
    }

    // 创建充值订单
    const orderId = `recharge_${Date.now()}_${user.id.slice(0, 8)}`;
    
    // 这里应该调用真实的支付API创建订单
    // 目前模拟充值成功
    const mockPaymentSuccess = true;

    if (mockPaymentSuccess) {
      // 获取当前余额
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('beans_balance')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }

      const currentBalance = profile?.beans_balance || 0;
      const newBalance = currentBalance + pkg.beans;

      // 更新余额
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ beans_balance: newBalance })
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json({ error: '充值失败' }, { status: 500 });
      }

      // 记录交易
      await supabase
        .from('beans_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'recharge',
          amount: pkg.beans,
          balance_after: newBalance,
          description: `充值${pkg.beans}快乐豆（¥${pkg.price}）`,
        });

      return NextResponse.json({
        success: true,
        balance: newBalance,
        added: pkg.beans,
        orderId,
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: '支付失败',
      orderId,
    });

  } catch (error) {
    console.error('充值快乐豆失败:', error);
    return NextResponse.json({ error: '充值失败' }, { status: 500 });
  }
}
