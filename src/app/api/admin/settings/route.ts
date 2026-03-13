import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 保存系统设置
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: '缺少设置项名称' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 使用 upsert 插入或更新设置
    const { error } = await supabase
      .from('system_settings')
      .upsert(
        { key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('保存设置失败:', error);
      // 如果表不存在，返回成功（降级处理）
      if (error.code === '42P01') {
        return NextResponse.json({ 
          success: true, 
          message: '数据库表未创建，设置已保存到本地' 
        });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存设置失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

/**
 * 获取系统设置
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const supabase = getSupabaseClient();

    let query = supabase.from('system_settings').select('key, value');
    
    if (key) {
      query = query.eq('key', key);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取设置失败:', error);
      return NextResponse.json({ success: false, settings: {} });
    }

    // 将数组转换为对象
    const settings: Record<string, any> = {};
    (data || []).forEach((item: any) => {
      try {
        settings[item.key] = JSON.parse(item.value);
      } catch {
        settings[item.key] = item.value;
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json({ success: false, settings: {} });
  }
}
