'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderTree,
  FileVideo,
  QrCode,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ClipboardCheck,
  Coins,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: '概览', icon: LayoutDashboard, path: '/admin' },
  { id: 'reviews', label: '作品审核', icon: ClipboardCheck, path: '/admin/reviews' },
  { id: 'works', label: '作品管理', icon: FileVideo, path: '/admin/works' },
  { id: 'beans', label: '欢乐豆管理', icon: Coins, path: '/admin/beans' },
  { id: 'categories', label: '分类管理', icon: FolderTree, path: '/admin/categories' },
  { id: 'payment', label: '收款配置', icon: QrCode, path: '/admin/payment' },
  { id: 'settings', label: '系统设置', icon: Settings, path: '/admin/settings' },
];

interface AdminUser {
  email: string;
  name: string;
  loginTime: number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 检查管理员登录状态
  useEffect(() => {
    // 登录页面不需要验证
    if (pathname === '/admin/login') {
      setIsLoading(false);
      return;
    }

    // 检查 localStorage 中的管理员信息
    const adminAuth = localStorage.getItem('admin_auth');
    
    if (!adminAuth) {
      setIsLoading(false);
      router.push('/admin/login');
      return;
    }

    try {
      const admin: AdminUser = JSON.parse(adminAuth);
      
      // 检查登录是否过期（24小时）
      const loginExpire = 24 * 60 * 60 * 1000;
      if (Date.now() - admin.loginTime > loginExpire) {
        localStorage.removeItem('admin_auth');
        setIsLoading(false);
        router.push('/admin/login');
        return;
      }

      setAdminUser(admin);
      setIsLoading(false);
    } catch {
      localStorage.removeItem('admin_auth');
      setIsLoading(false);
      router.push('/admin/login');
      return;
    }
  }, [pathname, router]);

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  // 登录页面直接渲染内容
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* 侧边栏 */}
      <aside
        className={`bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-56' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-700">
          {sidebarOpen && (
            <span className="text-white font-bold">管理后台</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            {sidebarOpen && '返回前台'}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm w-full"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && '退出登录'}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        {/* 顶部栏 */}
        <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <h1 className="text-white font-medium">
            {NAV_ITEMS.find((item) => item.path === pathname)?.label || '管理后台'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{adminUser?.name || '管理员'}</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 text-sm"
            >
              退出
            </button>
          </div>
        </header>

        {/* 页面内容 */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
