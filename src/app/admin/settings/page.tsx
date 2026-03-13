'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Check,
  AlertCircle,
  Bell,
  Globe,
  Database,
  Server,
  MessageCircle,
} from 'lucide-react';

interface AdminAccount {
  email: string;
  password: string;
  name: string;
}

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  enableRegistration: boolean;
  enableUpload: boolean;
  maxUploadSize: number;
  maintenanceMode: boolean;
  // 快乐豆相关设置
  publishRewardBeans: number;
  newUserBonus: number;
  aiReviewEnabled: boolean;
  manualReviewRequired: boolean;
  autoApproveThreshold: number;
  // 联系方式设置
  contactWechat: string;
  contactEmail: string;
  contactOnlineTime: string;
}

export default function AdminSettingsPage() {
  // 管理员账户
  const [adminAccount, setAdminAccount] = useState<AdminAccount>({
    email: 'admin@admin.com',
    password: 'admin123',
    name: '管理员',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState('');

  // 系统设置
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: '全景互动',
    siteDescription: '创建沉浸式互动短剧和全景体验',
    enableRegistration: true,
    enableUpload: true,
    maxUploadSize: 100,
    maintenanceMode: false,
    // 快乐豆相关设置
    publishRewardBeans: 50,
    newUserBonus: 100,
    aiReviewEnabled: true,
    manualReviewRequired: true,
    autoApproveThreshold: 0.8,
    // 联系方式设置
    contactWechat: 'CS_Service',
    contactEmail: 'support@cs-interactive.com',
    contactOnlineTime: '工作日 9:00 - 18:00',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // 加载已保存的设置
  useEffect(() => {
    // 加载管理员账户
    const savedAdmin = localStorage.getItem('admin_account_config');
    if (savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin);
        setAdminAccount(parsed);
      } catch (e) {
        console.error('Failed to load admin account:', e);
      }
    }

    // 加载系统设置
    const savedSettings = localStorage.getItem('system_settings');
    if (savedSettings) {
      try {
        setSystemSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load system settings:', e);
      }
    }
  }, []);

  // 保存管理员账户
  const handleSaveAccount = () => {
    setAccountError('');
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminAccount.email)) {
      setAccountError('请输入有效的邮箱地址');
      return;
    }

    // 验证密码长度
    if (adminAccount.password.length < 6) {
      setAccountError('密码至少需要6个字符');
      return;
    }

    // 保存到 localStorage
    localStorage.setItem('admin_account_config', JSON.stringify(adminAccount));
    
    // 同时更新登录信息
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth) {
      const auth = JSON.parse(adminAuth);
      auth.email = adminAccount.email;
      auth.name = adminAccount.name;
      localStorage.setItem('admin_auth', JSON.stringify(auth));
    }

    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 3000);
  };

  // 保存系统设置
  const handleSaveSettings = () => {
    localStorage.setItem('system_settings', JSON.stringify(systemSettings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 管理员账户设置 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-3">
          <Shield className="w-5 h-5 text-purple-400" />
          <h2 className="text-white font-medium">管理员账户</h2>
        </div>
        
        <div className="p-5 space-y-4">
          {/* 名称 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">管理员名称</label>
              <input
                type="text"
                value={adminAccount.name}
                onChange={(e) => setAdminAccount({ ...adminAccount, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="管理员名称"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">登录邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={adminAccount.email}
                  onChange={(e) => setAdminAccount({ ...adminAccount, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
          </div>

          {/* 密码 */}
          <div className="md:w-1/2">
            <label className="text-gray-400 text-sm block mb-2">登录密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminAccount.password}
                onChange={(e) => setAdminAccount({ ...adminAccount, password: e.target.value })}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="至少6位密码"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">修改后需要使用新密码登录</p>
          </div>

          {/* 错误提示 */}
          {accountError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {accountError}
            </div>
          )}

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAccount}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {accountSaved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存账户
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 系统设置 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-3">
          <Server className="w-5 h-5 text-blue-400" />
          <h2 className="text-white font-medium">系统设置</h2>
        </div>
        
        <div className="p-5 space-y-4">
          {/* 网站信息 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">网站名称</label>
              <input
                type="text"
                value={systemSettings.siteName}
                onChange={(e) => setSystemSettings({ ...systemSettings, siteName: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">网站描述</label>
              <input
                type="text"
                value={systemSettings.siteDescription}
                onChange={(e) => setSystemSettings({ ...systemSettings, siteDescription: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* 功能开关 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white text-sm">开放注册</p>
                  <p className="text-gray-500 text-xs">允许新用户注册</p>
                </div>
              </div>
              <button
                onClick={() => setSystemSettings({ ...systemSettings, enableRegistration: !systemSettings.enableRegistration })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  systemSettings.enableRegistration ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    systemSettings.enableRegistration ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white text-sm">允许上传</p>
                  <p className="text-gray-500 text-xs">用户可上传媒体文件</p>
                </div>
              </div>
              <button
                onClick={() => setSystemSettings({ ...systemSettings, enableUpload: !systemSettings.enableUpload })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  systemSettings.enableUpload ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    systemSettings.enableUpload ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 上传大小限制 */}
          <div className="md:w-1/2">
            <label className="text-gray-400 text-sm block mb-2">最大上传大小 (MB)</label>
            <input
              type="number"
              value={systemSettings.maxUploadSize}
              onChange={(e) => setSystemSettings({ ...systemSettings, maxUploadSize: parseInt(e.target.value) || 100 })}
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              min={1}
              max={500}
            />
          </div>

          {/* 维护模式 */}
          <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white text-sm">维护模式</p>
                <p className="text-gray-400 text-xs">开启后前台将显示维护页面</p>
              </div>
            </div>
            <button
              onClick={() => setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                systemSettings.maintenanceMode ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  systemSettings.maintenanceMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {settingsSaved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存设置
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 快乐豆设置 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-3">
          <span className="text-xl">💎</span>
          <h2 className="text-white font-medium">快乐豆设置</h2>
        </div>
        
        <div className="p-5 space-y-4">
          {/* 奖励设置 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">发布作品奖励快乐豆</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={systemSettings.publishRewardBeans}
                  onChange={(e) => setSystemSettings({ ...systemSettings, publishRewardBeans: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  min={0}
                  max={1000}
                />
                <span className="text-gray-400 text-sm">豆</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">用户发布作品审核通过后获得的快乐豆</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">新用户赠送快乐豆</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={systemSettings.newUserBonus}
                  onChange={(e) => setSystemSettings({ ...systemSettings, newUserBonus: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  min={0}
                  max={1000}
                />
                <span className="text-gray-400 text-sm">豆</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">新用户注册时赠送的快乐豆</p>
            </div>
          </div>

          {/* 审核设置 */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-white text-sm font-medium mb-3">审核设置</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🤖</span>
                  <div>
                    <p className="text-white text-sm">启用AI审核</p>
                    <p className="text-gray-500 text-xs">自动检测内容质量</p>
                  </div>
                </div>
                <button
                  onClick={() => setSystemSettings({ ...systemSettings, aiReviewEnabled: !systemSettings.aiReviewEnabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    systemSettings.aiReviewEnabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      systemSettings.aiReviewEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">👤</span>
                  <div>
                    <p className="text-white text-sm">需要人工审核</p>
                    <p className="text-gray-500 text-xs">AI通过后仍需人工确认</p>
                  </div>
                </div>
                <button
                  onClick={() => setSystemSettings({ ...systemSettings, manualReviewRequired: !systemSettings.manualReviewRequired })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    systemSettings.manualReviewRequired ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      systemSettings.manualReviewRequired ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* AI审核阈值 */}
            <div className="mt-4">
              <label className="text-gray-400 text-sm block mb-2">AI审核通过阈值</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  value={systemSettings.autoApproveThreshold}
                  onChange={(e) => setSystemSettings({ ...systemSettings, autoApproveThreshold: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  min={0}
                  max={1}
                  step={0.05}
                />
                <span className="text-white text-sm w-16 text-right">
                  {Math.round(systemSettings.autoApproveThreshold * 100)}%
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                AI评分高于此阈值才可通过审核（0-100%）
              </p>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end border-t border-gray-700 pt-4">
            <Button
              onClick={handleSaveSettings}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {settingsSaved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存设置
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 联系方式设置 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-green-400" />
          <h2 className="text-white font-medium">联系方式设置</h2>
        </div>
        
        <div className="p-5 space-y-4">
          <p className="text-gray-400 text-sm">设置前台页面"联系管理员"弹窗中显示的联系方式</p>
          
          {/* 微信号 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">
                <span className="text-green-400 mr-1">💬</span> 微信号
              </label>
              <input
                type="text"
                value={systemSettings.contactWechat}
                onChange={(e) => setSystemSettings({ ...systemSettings, contactWechat: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="输入微信号"
              />
              <p className="text-gray-500 text-xs mt-1">用户扫码或搜索添加</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">
                <span className="text-blue-400 mr-1">📧</span> 联系邮箱
              </label>
              <input
                type="email"
                value={systemSettings.contactEmail}
                onChange={(e) => setSystemSettings({ ...systemSettings, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="support@example.com"
              />
              <p className="text-gray-500 text-xs mt-1">用户邮件联系地址</p>
            </div>
          </div>

          {/* 在线时间 */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">
              <span className="text-amber-400 mr-1">🕐</span> 在线服务时间
            </label>
            <input
              type="text"
              value={systemSettings.contactOnlineTime}
              onChange={(e) => setSystemSettings({ ...systemSettings, contactOnlineTime: e.target.value })}
              className="w-full md:w-1/2 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="工作日 9:00 - 18:00"
            />
            <p className="text-gray-500 text-xs mt-1">显示客服在线时间段</p>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end border-t border-gray-700 pt-4">
            <Button
              onClick={handleSaveSettings}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {settingsSaved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存设置
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 危险操作 */}
      <div className="bg-gray-800 rounded-lg border border-red-500/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h2 className="text-white font-medium">危险操作</h2>
        </div>
        
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm">清空所有数据</p>
              <p className="text-gray-500 text-xs">删除所有项目、用户数据，此操作不可恢复</p>
            </div>
            <Button
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => {
                if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
                  alert('功能开发中，暂不支持');
                }
              }}
            >
              清空数据
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
