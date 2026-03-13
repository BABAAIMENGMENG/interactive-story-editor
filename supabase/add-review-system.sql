-- ============================================
-- 作品审核系统 - 增量更新脚本
-- ============================================
-- 执行此脚本添加作品审核功能和发布奖励机制
-- ============================================

-- 1. 创建系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- 2. 为 projects 表添加审核相关字段
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'revision_needed')),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS ai_review_status TEXT CHECK (ai_review_status IN ('pending', 'passed', 'failed', 'manual_required')),
ADD COLUMN IF NOT EXISTS ai_review_result JSONB,
ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ;

-- 3. 创建审核记录表
CREATE TABLE IF NOT EXISTS project_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  review_type TEXT NOT NULL CHECK (review_type IN ('manual', 'ai')),
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'revision_needed')),
  notes TEXT,
  review_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 插入默认系统设置
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('publish_reward_beans', '50', '发布作品奖励快乐豆数量'),
  ('ai_review_enabled', 'true', '是否启用AI审核'),
  ('manual_review_required', 'true', '是否需要人工审核'),
  ('auto_approve_threshold', '0.8', 'AI审核通过阈值（0-1）'),
  ('max_revision_count', '3', '最大修改次数')
ON CONFLICT (setting_key) DO NOTHING;

-- 5. 添加索引
CREATE INDEX IF NOT EXISTS idx_projects_review_status ON projects(review_status);
CREATE INDEX IF NOT EXISTS idx_projects_submitted_for_review ON projects(submitted_for_review_at);
CREATE INDEX IF NOT EXISTS idx_project_reviews_project_id ON project_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_reviewer_id ON project_reviews(reviewer_id);

-- 6. 启用 RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;

-- 7. 添加 RLS 策略
CREATE POLICY "Admins can manage system_settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage project_reviews" ON project_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view reviews of own projects" ON project_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_reviews.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

-- 8. 创建审核通过后自动奖励快乐豆的函数
CREATE OR REPLACE FUNCTION reward_beans_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  reward_amount INTEGER;
BEGIN
  -- 只在审核状态从非approved变为approved时触发
  IF NEW.review_status = 'approved' AND (OLD.review_status IS NULL OR OLD.review_status != 'approved') THEN
    -- 获取奖励金额
    SELECT CAST(setting_value AS INTEGER) INTO reward_amount
    FROM system_settings
    WHERE setting_key = 'publish_reward_beans';
    
    -- 如果没有设置，默认奖励50豆
    IF reward_amount IS NULL THEN
      reward_amount := 50;
    END IF;
    
    -- 更新用户快乐豆余额
    UPDATE profiles
    SET 
      beans_balance = beans_balance + reward_amount,
      total_beans_earned = total_beans_earned + reward_amount
    WHERE id = NEW.user_id;
    
    -- 记录交易
    INSERT INTO beans_transactions (user_id, project_id, transaction_type, amount, balance_after, description)
    SELECT 
      NEW.user_id,
      NEW.id,
      'reward',
      reward_amount,
      beans_balance,
      '作品《' || NEW.name || '》审核通过奖励'
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建触发器
DROP TRIGGER IF EXISTS on_project_approved ON projects;
CREATE TRIGGER on_project_approved
  AFTER UPDATE OF review_status ON projects
  FOR EACH ROW
  EXECUTE FUNCTION reward_beans_on_approval();

-- 完成！
SELECT '作品审核系统更新完成！' as status;
