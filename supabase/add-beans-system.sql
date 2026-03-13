-- ============================================
-- 快乐豆系统 - 增量更新脚本
-- ============================================
-- 如果你的数据库已经创建了基础表，执行此脚本添加快乐豆功能
-- ============================================

-- 1. 为 profiles 表添加快乐豆相关字段
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS beans_balance INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS total_beans_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_beans_spent INTEGER DEFAULT 0;

-- 更新现有用户的快乐豆余额
UPDATE profiles SET beans_balance = 100 WHERE beans_balance IS NULL;

-- 2. 为 projects 表添加快乐豆相关字段
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS beans_price INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_beans_earned INTEGER DEFAULT 0;

-- 3. 创建快乐豆交易记录表
CREATE TABLE IF NOT EXISTS beans_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'reward', 'admin_add', 'admin_deduct')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建作品购买记录表
CREATE TABLE IF NOT EXISTS project_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  beans_spent INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- 5. 添加索引
CREATE INDEX IF NOT EXISTS idx_projects_beans_price ON projects(beans_price);
CREATE INDEX IF NOT EXISTS idx_beans_transactions_user_id ON beans_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_purchases_user_id ON project_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_project_purchases_project_id ON project_purchases(project_id);

-- 6. 启用 RLS
ALTER TABLE beans_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_purchases ENABLE ROW LEVEL SECURITY;

-- 7. 添加 RLS 策略
CREATE POLICY "Users can view own transactions" ON beans_transactions
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own transactions" ON beans_transactions
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can view own purchases" ON project_purchases
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own purchases" ON project_purchases
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- 8. 添加快乐豆充值套餐配置
INSERT INTO payment_config (config_key, config_value, description) VALUES
  ('beans_100', '10', '100快乐豆 - 10元'),
  ('beans_500', '45', '500快乐豆 - 45元（9折）'),
  ('beans_1000', '80', '1000快乐豆 - 80元（8折）'),
  ('beans_5000', '350', '5000快乐豆 - 350元（7折）'),
  ('new_user_bonus', '100', '新用户赠送快乐豆数量')
ON CONFLICT (config_key) DO NOTHING;

-- 完成！
SELECT '快乐豆系统更新完成！' as status;
