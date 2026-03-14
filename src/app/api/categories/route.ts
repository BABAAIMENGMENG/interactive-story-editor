import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 默认分类
const DEFAULT_CATEGORIES = [
  { id: '1', name: '言情', icon: '💕', slug: 'romance', sortOrder: 1, isActive: true },
  { id: '2', name: '悬疑', icon: '🔍', slug: 'suspense', sortOrder: 2, isActive: true },
  { id: '3', name: '科幻', icon: '🚀', slug: 'scifi', sortOrder: 3, isActive: true },
  { id: '4', name: '奇幻', icon: '✨', slug: 'fantasy', sortOrder: 4, isActive: true },
  { id: '5', name: '冒险', icon: '🗺️', slug: 'adventure', sortOrder: 5, isActive: true },
  { id: '6', name: '校园', icon: '🎓', slug: 'campus', sortOrder: 6, isActive: true },
  { id: '7', name: '普法', icon: '⚖️', slug: 'legal', sortOrder: 7, isActive: true },
  { id: '8', name: '喜剧', icon: '😄', slug: 'comedy', sortOrder: 8, isActive: true },
  { id: '9', name: '其他', icon: '📖', slug: 'other', sortOrder: 99, isActive: true },
];

/**
 * 获取分类列表（公开接口）
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'categories')
      .single();

    if (error || !data) {
      // 返回默认分类
      return NextResponse.json({
        success: true,
        categories: DEFAULT_CATEGORIES,
      });
    }

    const categories = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    
    // 只返回启用的分类
    const activeCategories = categories.filter((c: any) => c.isActive);
    
    return NextResponse.json({
      success: true,
      categories: activeCategories,
    });
  } catch (error) {
    console.error('获取分类失败:', error);
    return NextResponse.json({
      success: true,
      categories: DEFAULT_CATEGORIES.filter(c => c.isActive),
    });
  }
}

/**
 * 保存分类列表（管理员接口）
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // 简单验证（实际应验证管理员身份）
    // 这里暂时允许访问，后续可加入管理员验证
    
    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: '分类数据格式错误' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    
    // 使用 upsert 保存分类
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'categories',
        value: JSON.stringify(categories),
        description: '作品分类列表',
      }, {
        onConflict: 'key',
      });

    if (error) {
      console.error('保存分类失败:', error);
      return NextResponse.json({ error: '保存分类失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存分类失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
