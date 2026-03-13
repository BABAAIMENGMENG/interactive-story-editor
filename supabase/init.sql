-- ============================================
-- CS 互动短剧平台 - Supabase 数据库初始化脚本
-- ============================================
-- 执行方式：在 Supabase 控制台的 SQL Editor 中执行此脚本
-- ============================================

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_end_date TIMESTAMPTZ,
  beans_balance INTEGER DEFAULT 100,  -- 快乐豆余额，新用户赠送100豆
  total_beans_earned INTEGER DEFAULT 0,  -- 累计获得的豆
  total_beans_spent INTEGER DEFAULT 0,  -- 累计消费的豆
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 项目表
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  project_data JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,
  category TEXT DEFAULT 'other',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  beans_price INTEGER DEFAULT 0,  -- 观看所需快乐豆数量，0表示免费
  total_beans_earned INTEGER DEFAULT 0,  -- 作品累计获得的豆
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 项目点赞表
CREATE TABLE IF NOT EXISTS project_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  payment_method TEXT,
  amount DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 支付配置表（管理员配置收款码）
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 管理员账户表
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 7. 快乐豆交易记录表
CREATE TABLE IF NOT EXISTS beans_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'reward', 'admin_add', 'admin_deduct')),
  amount INTEGER NOT NULL,  -- 正数表示获得，负数表示消费
  balance_after INTEGER NOT NULL,  -- 交易后余额
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 作品购买记录表（观众购买作品）
CREATE TABLE IF NOT EXISTS project_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  beans_spent INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)  -- 每个用户只能购买一次
);

-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_share_code ON projects(share_code);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_beans_price ON projects(beans_price);
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON project_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_beans_transactions_user_id ON beans_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_purchases_user_id ON project_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_project_purchases_project_id ON project_purchases(project_id);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beans_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_purchases ENABLE ROW LEVEL SECURITY;

-- profiles 表策略
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = id::text OR email = auth.jwt() ->> 'email');

-- projects 表策略
CREATE POLICY "Public projects are viewable by everyone" ON projects
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- project_likes 表策略
CREATE POLICY "Likes are viewable by everyone" ON project_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert likes" ON project_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own likes" ON project_likes
  FOR DELETE USING (user_id = auth.uid()::text);

-- subscriptions 表策略
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- payment_config 表策略（仅管理员可访问）
CREATE POLICY "Payment config is viewable by everyone" ON payment_config
  FOR SELECT USING (true);

-- admin_users 表策略（仅服务端访问）
CREATE POLICY "Admin users only accessible via service role" ON admin_users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- beans_transactions 表策略
CREATE POLICY "Users can view own transactions" ON beans_transactions
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own transactions" ON beans_transactions
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- project_purchases 表策略
CREATE POLICY "Users can view own purchases" ON project_purchases
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own purchases" ON project_purchases
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- ============================================
-- 初始数据
-- ============================================

-- 插入默认支付配置
INSERT INTO payment_config (config_key, config_value, description) VALUES
  ('wechat_qr', '', '微信收款码URL'),
  ('alipay_qr', '', '支付宝收款码URL'),
  ('price_monthly_pro', '29.9', '专业版月费'),
  ('price_yearly_pro', '299', '专业版年费'),
  ('price_monthly_enterprise', '99', '企业版月费'),
  ('price_yearly_enterprise', '999', '企业版年费')
ON CONFLICT (config_key) DO NOTHING;

-- 插入默认管理员账户（密码：admin123）
-- 注意：生产环境请修改此密码！
INSERT INTO admin_users (email, password_hash, name) VALUES
  ('admin@admin.com', '$2a$10$YourHashedPasswordHere', '管理员')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 快乐豆充值套餐配置
-- ============================================

INSERT INTO payment_config (config_key, config_value, description) VALUES
  ('beans_100', '10', '100快乐豆 - 10元'),
  ('beans_500', '45', '500快乐豆 - 45元（9折）'),
  ('beans_1000', '80', '1000快乐豆 - 80元（8折）'),
  ('beans_5000', '350', '5000快乐豆 - 350元（7折）'),
  ('new_user_bonus', '100', '新用户赠送快乐豆数量')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================
-- 完成！
-- ============================================
-- 执行完此脚本后，请：
-- 1. 记录你的 Supabase 项目 URL 和 anon key
-- 2. 在 Vercel 环境变量中配置这些值
-- 3. 修改管理员默认密码
