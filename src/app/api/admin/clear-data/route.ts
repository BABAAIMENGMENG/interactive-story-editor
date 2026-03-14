import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 在函数内部读取环境变量
    const supabaseUrl = process.env.COZE_SUPABASE_URL;
    const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

    const body = await request.json();
    const { confirmText } = body;

    // 安全验证：需要输入确认文字
    if (confirmText !== '确认清空所有数据') {
      return NextResponse.json(
        { error: '请输入正确的确认文字' },
        { status: 400 }
      );
    }

    // 检查环境变量
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('环境变量缺失:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return NextResponse.json({
        success: false,
        message: '数据库配置缺失，请检查环境变量',
        error: 'CONFIG_MISSING',
      }, { status: 500 });
    }

    // 创建服务端客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 按顺序清空各表数据（注意外键约束）
    const tables = [
      'beans_transactions',      // 快乐豆交易记录
      'project_likes',           // 作品点赞
      'reviews',                 // 作品审核记录
      'subscriptions',           // 订阅记录
      'projects',                // 项目/作品
      'profiles',                // 用户资料
    ];

    const results = [];

    for (const table of tables) {
      try {
        // 尝试普通删除
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .gt('created_at', '1970-01-01'); // 删除所有记录
        
        if (deleteError) {
          console.error(`清空表 ${table} 失败:`, deleteError);
          results.push({ table, success: false, error: deleteError.message });
        } else {
          results.push({ table, success: true });
        }
      } catch (err) {
        console.error(`清空表 ${table} 异常:`, err);
        results.push({ table, success: false, error: String(err) });
      }
    }

    // 检查是否全部成功
    const failedTables = results.filter(r => !r.success);

    if (failedTables.length === 0) {
      return NextResponse.json({
        success: true,
        message: '所有数据已清空',
        results,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `清空失败: ${failedTables.map(t => `${t.table}: ${t.error}`).join(', ')}`,
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
