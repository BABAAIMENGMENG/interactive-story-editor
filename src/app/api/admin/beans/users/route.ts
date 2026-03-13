import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 获取用户列表（带余额）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabase
      .from('profiles')
      .select('id, email, display_name, beans_balance, created_at', { count: 'exact' });

    // 搜索条件
    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    // 分页和排序
    const { data: users, error, count } = await query
      .order('beans_balance', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('获取用户列表失败:', error);
      return NextResponse.json(
        { success: false, error: '获取用户列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
