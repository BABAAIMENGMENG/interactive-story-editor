import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseServiceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;

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

    // 检查是否配置了 Service Role Key
    if (!supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: '未配置 Supabase Service Role Key',
        error: 'SERVICE_ROLE_KEY_NOT_CONFIGURED',
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
        // 使用 RPC 调用 TRUNCATE（更可靠）
        const { error } = await supabase.rpc('truncate_table', { table_name: table });
        
        if (error) {
          // 如果 RPC 不存在，尝试普通删除
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
        message: `清空失败: ${failedTables.map(t => t.table).join(', ')}`,
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
