import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 登出
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const supabase = getSupabaseClient(token);
      await supabase.auth.signOut();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('登出错误:', error);
    return NextResponse.json({ success: true }); // 即使失败也返回成功
  }
}
