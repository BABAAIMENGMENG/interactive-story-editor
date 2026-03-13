import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 使用服务端密钥
);

// 核销用户欢乐豆
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, reason } = body;

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: '参数无效' },
        { status: 400 }
      );
    }

    // 获取用户当前余额
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('beans_balance, display_name, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    const currentBalance = profile.beans_balance || 0;

    if (currentBalance < amount) {
      return NextResponse.json(
        { success: false, error: `用户余额不足，当前余额: ${currentBalance} 豆` },
        { status: 400 }
      );
    }

    // 扣除余额
    const newBalance = currentBalance - amount;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ beans_balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('更新余额失败:', updateError);
      return NextResponse.json(
        { success: false, error: '更新余额失败' },
        { status: 500 }
      );
    }

    // 记录交易
    const { error: txError } = await supabase
      .from('bean_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'write_off',
        amount: -amount, // 负数表示扣除
        platform_fee: 0,
        balance_after: newBalance,
        description: reason || '后台核销',
      });

    if (txError) {
      console.error('记录交易失败:', txError);
    }

    return NextResponse.json({
      success: true,
      data: {
        previousBalance: currentBalance,
        deducted: amount,
        newBalance: newBalance,
        userName: profile.display_name || profile.email,
      },
    });
  } catch (error) {
    console.error('核销失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
