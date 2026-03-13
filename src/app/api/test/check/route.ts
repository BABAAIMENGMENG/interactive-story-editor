import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 检查数据库数据
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // 直接查询所有项目
    const { data: allProjects, error: err1 } = await supabase
      .from('projects')
      .select('*');
    
    // 查询公开项目
    const { data: publicProjects, error: err2 } = await supabase
      .from('projects')
      .select('*')
      .eq('is_public', true);
    
    return NextResponse.json({
      allProjectsCount: allProjects?.length || 0,
      publicProjectsCount: publicProjects?.length || 0,
      allProjects: allProjects?.map(p => ({
        id: p.id,
        name: p.name,
        is_public: p.is_public,
        share_code: p.share_code,
        category: p.category,
      })),
      publicProjects: publicProjects?.map(p => ({
        id: p.id,
        name: p.name,
        is_public: p.is_public,
        share_code: p.share_code,
      })),
      errors: {
        err1: err1?.message,
        err2: err2?.message,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
