import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 获取所有充值订单（管理员）
 * GET /api/admin/recharge
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = getSupabaseClient();

    // 构建查询 - recharge_orders 关联 auth.users 通过 user_id
    // 注意：Supabase 中 auth.users 和 public.profiles 是分开的
    // 我们需要先获取订单，然后单独获取用户信息
    let query = supabase
      .from('recharge_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('获取订单失败:', error);
      return NextResponse.json({ error: '获取订单失败' }, { status: 500 });
    }

    // 获取用户信息
    let ordersWithProfiles = orders || [];
    if (orders && orders.length > 0) {
      const userIds = [...new Set(orders.map(o => o.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      ordersWithProfiles = orders.map(order => ({
        ...order,
        profiles: profileMap.get(order.user_id) || { name: '未知', email: '' }
      }));
    }

    return NextResponse.json({
      orders: ordersWithProfiles,
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('获取充值订单失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * 审核充值订单（管理员）
 * PATCH /api/admin/recharge
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, action, reason } = body;

    if (!orderId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 获取订单信息
    const { data: order, error: fetchError } = await supabase
      .from('recharge_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: '该订单已处理' }, { status: 400 });
    }

    if (action === 'approve') {
      // 获取用户当前余额
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('beans_balance')
        .eq('user_id', order.user_id)
        .single();

      if (profileError) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }

      const currentBalance = profile?.beans_balance || 0;
      const newBalance = currentBalance + order.beans_amount;

      // 更新订单状态
      const { error: updateOrderError } = await supabase
        .from('recharge_orders')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateOrderError) {
        console.error('更新订单失败:', updateOrderError);
        return NextResponse.json({ error: '更新订单失败' }, { status: 500 });
      }

      // 更新用户余额
      const { error: updateBalanceError } = await supabase
        .from('profiles')
        .update({ beans_balance: newBalance })
        .eq('user_id', order.user_id);

      if (updateBalanceError) {
        console.error('更新余额失败:', updateBalanceError);
        return NextResponse.json({ error: '更新余额失败' }, { status: 500 });
      }

      // 记录交易
      await supabase
        .from('beans_transactions')
        .insert({
          user_id: order.user_id,
          transaction_type: 'recharge',
          amount: order.beans_amount,
          balance_after: newBalance,
          description: `充值${order.beans_amount}快乐豆（¥${order.price}）`,
        });

      return NextResponse.json({
        success: true,
        message: '审核通过，快乐豆已到账',
        newBalance,
      });

    } else {
      // 拒绝
      const { error: updateError } = await supabase
        .from('recharge_orders')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          remark: reason ? `${order.remark || ''}\n拒绝原因: ${reason}` : order.remark,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('更新订单失败:', updateError);
        return NextResponse.json({ error: '更新订单失败' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '已拒绝该订单',
      });
    }

  } catch (error) {
    console.error('审核订单失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
