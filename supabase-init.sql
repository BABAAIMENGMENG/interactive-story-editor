-- ============================================
-- VES 互动短剧平台 - 数据库初始化脚本
-- ============================================
-- 使用方法：
-- 1. 打开 Supabase 控制台
-- 2. 进入 SQL Editor
-- 3. 复制粘贴此文件内容并执行
-- ============================================

-- 1. 创建 profiles 表（用户资料）
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
  beans_balance INTEGER DEFAULT 100,  -- 新用户赠送100豆
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);

-- 2. 创建 projects 表
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
  beans_price INTEGER DEFAULT 0,  -- 作品定价
  review_status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  reward_given BOOLEAN DEFAULT FALSE,  -- 是否已发放奖励
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_share_code_idx ON projects(share_code);
CREATE INDEX IF NOT EXISTS projects_category_idx ON projects(category);
CREATE INDEX IF NOT EXISTS projects_is_public_idx ON projects(is_public);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);

-- 3. 创建 project_likes 表
CREATE TABLE IF NOT EXISTS project_likes (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
CREATE INDEX IF NOT EXISTS project_likes_project_id_idx ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS project_likes_user_id_idx ON project_likes(user_id);

-- 4. 创建 subscriptions 表
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

-- 5. 创建 beans_transactions 表（快乐豆交易记录）
CREATE TABLE IF NOT EXISTS beans_transactions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- recharge, purchase, reward, withdrawal
  amount INTEGER NOT NULL,  -- 正数为收入，负数为支出
  balance_after INTEGER NOT NULL,
  related_project_id VARCHAR(36),
  related_user_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS beans_transactions_user_id_idx ON beans_transactions(user_id);
CREATE INDEX IF NOT EXISTS beans_transactions_type_idx ON beans_transactions(type);
CREATE INDEX IF NOT EXISTS beans_transactions_created_at_idx ON beans_transactions(created_at);

-- 6. 创建 reviews 表（作品审核）
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  ai_score INTEGER,  -- AI 审核分数 0-100
  ai_reason TEXT,
  admin_id VARCHAR(255),
  admin_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reviews_project_id_idx ON reviews(project_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);

-- 7. 创建 admin_settings 表
CREATE TABLE IF NOT EXISTS admin_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 创建 admin_users 表（管理员账户）
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ============================================
-- 初始数据
-- ============================================

-- 插入默认管理员账户（密码: admin123）
INSERT INTO admin_users (email, password_hash, name, role)
VALUES ('admin@admin.com', 'admin123', '管理员', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- 插入默认设置
INSERT INTO admin_settings (key, value, description) VALUES
  ('review_threshold', '60', 'AI审核通过阈值'),
  ('reward_amount', '10', '作品发布奖励豆数'),
  ('platform_fee_rate', '0.1', '平台抽成比例')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 完成
-- ============================================
-- 执行完成后，请前往 Storage 创建 media 存储桶
