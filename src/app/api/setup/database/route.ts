import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 数据库初始化 - 创建所有表
 * GET /api/setup/database
 * 
 * ⚠️ 只需要执行一次
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const results: { name: string; status: string; error?: string }[] = [];

    // 1. 创建 profiles 表（用户资料）
    const createProfilesTable = `
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255),
        name VARCHAR(255),
        avatar VARCHAR(500),
        subscription_tier VARCHAR(20) DEFAULT 'free',
        subscription_status VARCHAR(20) DEFAULT 'active',
        subscription_start_at TIMESTAMPTZ,
        subscription_end_at TIMESTAMPTZ,
        projects_count INTEGER DEFAULT 0,
        scenes_count INTEGER DEFAULT 0,
        exports_count INTEGER DEFAULT 0,
        beans_balance INTEGER DEFAULT 100,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: createProfilesTable });
      results.push({ name: 'profiles 表', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'profiles 表', status: 'failed', error: e.message });
    }

    // 2. 创建 projects 表
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image VARCHAR(500),
        project_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        category VARCHAR(50) DEFAULT 'other',
        tags JSONB DEFAULT '[]'::jsonb,
        is_public BOOLEAN DEFAULT FALSE,
        share_code VARCHAR(20),
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        beans_price INTEGER DEFAULT 0,
        review_status VARCHAR(20) DEFAULT 'pending',
        reward_given BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
      CREATE INDEX IF NOT EXISTS projects_share_code_idx ON projects(share_code);
      CREATE INDEX IF NOT EXISTS projects_category_idx ON projects(category);
      CREATE INDEX IF NOT EXISTS projects_is_public_idx ON projects(is_public);
      CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: createProjectsTable });
      results.push({ name: 'projects 表', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'projects 表', status: 'failed', error: e.message });
    }

    // 3. 创建 project_likes 表
    const createProjectLikesTable = `
      CREATE TABLE IF NOT EXISTS project_likes (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS project_likes_project_id_idx ON project_likes(project_id);
      CREATE INDEX IF NOT EXISTS project_likes_user_id_idx ON project_likes(user_id);
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: createProjectLikesTable });
      results.push({ name: 'project_likes 表', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'project_likes 表', status: 'failed', error: e.message });
    }

    // 4. 创建 subscriptions 表
    const createSubscriptionsTable = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        tier VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        payment_provider VARCHAR(20),
        payment_id VARCHAR(255),
        amount INTEGER NOT NULL,
        currency VARCHAR(10) DEFAULT 'CNY',
        interval VARCHAR(20) DEFAULT 'monthly',
        start_at TIMESTAMPTZ NOT NULL,
        end_at TIMESTAMPTZ NOT NULL,
        canceled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: createSubscriptionsTable });
      results.push({ name: 'subscriptions 表', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'subscriptions 表', status: 'failed', error: e.message });
    }

    // 5. 创建 beans_transactions 表（快乐豆交易记录）
    const createBeansTransactionsTable = `
      CREATE TABLE IF NOT EXISTS beans_transactions (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        related_project_id VARCHAR(36),
        related_user_id VARCHAR(255),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS beans_transactions_user_id_idx ON beans_transactions(user_id);
      CREATE INDEX IF NOT EXISTS beans_transactions_type_idx ON beans_transactions(type);
      CREATE INDEX IF NOT EXISTS beans_transactions_created_at_idx ON beans_transactions(created_at);
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: createBeansTransactionsTable });
      results.push({ name: 'beans_transactions 表', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'beans_transactions 表', status: 'failed', error: e.message });
    }

    // 6. 创建 reviews 表（作品审核）
    const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id VARCHAR(36) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        ai_score INTEGER,
        ai_reason TEXT,
        admin_id VARCHAR(255),
        admin_note TEXT,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS reviews_project_id_idx ON reviews(project_id);
      CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: createReviewsTable });
      results.push({ name: 'reviews 表', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'reviews 表', status: 'failed', error: e.message });
    }

    // 7. 创建 admin_settings 表
    const createAdminSettingsTable = `
      CREATE TABLE IF NOT EXISTS admin_settings (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(100) NOT NULL UNIQUE,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: createAdminSettingsTable });
      results.push({ name: 'admin_settings 表', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'admin_settings 表', status: 'failed', error: e.message });
    }

    // 8. 创建 admin_users 表（管理员账户）
    const createAdminUsersTable = `
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );
    `;
    
    try {
      await supabase.rpc('exec_sql', { sql: createAdminUsersTable });
      results.push({ name: 'admin_users 表', status: 'success' });
    } catch (e: any) {
      results.push({ name: 'admin_users 表', status: 'failed', error: e.message });
    }

    return NextResponse.json({
      success: true,
      message: '数据库初始化完成',
      results,
      note: '如果部分表创建失败（显示 exec_sql 不存在），请手动在 Supabase SQL 编辑器中执行 SQL 语句'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '初始化失败'
    }, { status: 500 });
  }
}
