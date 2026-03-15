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
 * 获取用户的充值订单
 * GET /api/recharge/orders
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

    // 获取用户订单
    const { data: orders, error } = await supabase
      .from('recharge_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('获取订单失败:', error);
      return NextResponse.json({ error: '获取订单失败' }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });

  } catch (error) {
    console.error('获取充值订单失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

/**
 * 创建充值订单（凭证审核模式）
 * POST /api/recharge/orders
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
    const { packageId, paymentMethod, paymentProof, remark } = body;

    // 验证套餐
    const pkg = RECHARGE_PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json({ error: '无效的充值套餐' }, { status: 400 });
    }

    // 验证支付方式
    if (!['wechat', 'alipay'].includes(paymentMethod)) {
      return NextResponse.json({ error: '无效的支付方式' }, { status: 400 });
    }

    // 验证凭证（必须上传）
    if (!paymentProof) {
      return NextResponse.json({ error: '请上传付款凭证' }, { status: 400 });
    }

    // 创建订单（所有订单需审核）
    const orderData = {
      user_id: user.id,
      package_id: packageId,
      beans_amount: pkg.beans,
      price: pkg.price,
      status: 'pending',
      payment_method: paymentMethod,
      payment_proof: paymentProof,
      remark: remark || null,
    };

    const { data: order, error } = await supabase
      .from('recharge_orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('创建订单失败:', error);
      return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order,
      message: '订单已提交，请等待审核',
    });

  } catch (error) {
    console.error('创建充值订单失败:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}
