import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 数据库迁移 - 添加新列
 * GET /api/test/migrate
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // 使用 raw SQL 添加列
    const migrations = [
      {
        name: '添加 category 列',
        sql: `ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other';`
      },
      {
        name: '添加 like_count 列',
        sql: `ALTER TABLE projects ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;`
      },
      {
        name: '添加 tags 列',
        sql: `ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;`
      },
      {
        name: '创建 project_likes 表',
        sql: `
          CREATE TABLE IF NOT EXISTS project_likes (
            id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: '创建 project_likes 索引',
        sql: `
          CREATE INDEX IF NOT EXISTS project_likes_project_id_idx ON project_likes(project_id);
          CREATE INDEX IF NOT EXISTS project_likes_user_id_idx ON project_likes(user_id);
        `
      },
      {
        name: '添加分类索引',
        sql: `CREATE INDEX IF NOT EXISTS projects_category_idx ON projects(category);`
      },
    ];

    const results: any[] = [];

    for (const migration of migrations) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: migration.sql 
        });
        
        if (error) {
          // 尝试直接执行
          results.push({
            name: migration.name,
            status: 'failed',
            error: error.message
          });
        } else {
          results.push({
            name: migration.name,
            status: 'success'
          });
        }
      } catch (e) {
        results.push({
          name: migration.name,
          status: 'error',
          error: e instanceof Error ? e.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '迁移完成，请查看结果',
      results,
      hint: '如果部分迁移失败，请手动在数据库中执行SQL'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '迁移失败'
    }, { status: 500 });
  }
}
