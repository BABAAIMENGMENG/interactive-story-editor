import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

// 创建服务端客户端（优先使用 service_role 权限）
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { confirmText } = body;

    // 安全验证：需要输入确认文字
    if (confirmText !== '确认清空所有数据') {
      return NextResponse.json(
        { error: '请输入正确的确认文字' },
        { status: 400 }
      );
    }

    // 按顺序清空各表数据（注意外键约束）
    const tables = [
      'beans_transactions',      // 快乐豆交易记录
      'project_purchases',       // 作品购买记录
      'recharge_orders',         // 充值订单
      'project_likes',           // 作品点赞
      'project_reviews',         // 作品审核记录
      'projects',                // 项目/作品
      'profiles',                // 用户资料
    ];

    const results = [];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录

        if (error) {
          console.error(`清空表 ${table} 失败:`, error);
          results.push({ table, success: false, error: error.message });
        } else {
          results.push({ table, success: true });
        }
      } catch (err) {
        console.error(`清空表 ${table} 异常:`, err);
        results.push({ table, success: false, error: String(err) });
      }
    }

    // 检查是否全部成功
    const allSuccess = results.every(r => r.success);

    if (allSuccess) {
      return NextResponse.json({
        success: true,
        message: '所有数据已清空',
        results,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '部分数据清空失败',
        results,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('清空数据失败:', error);
    return NextResponse.json(
      { error: '清空数据失败', details: String(error) },
      { status: 500 }
    );
  }
}
