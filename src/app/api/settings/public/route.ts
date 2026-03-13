import { NextResponse } from 'next/server';

/**
 * 获取公开的系统设置
 * 用于前台页面读取联系方式等配置
 */
export async function GET() {
  // 默认设置
  const defaultSettings = {
    contactWechat: 'CS_Service',
    contactEmail: 'support@cs-interactive.com',
    contactOnlineTime: '工作日 9:00 - 18:00',
    siteName: '全景互动',
    siteDescription: '创建沉浸式互动短剧和全景体验',
  };

  try {
    // 从数据库或配置文件读取
    // 这里暂时返回默认值，实际应用可从 Supabase 读取
    return NextResponse.json({
      success: true,
      settings: defaultSettings,
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    return NextResponse.json({
      success: false,
      settings: defaultSettings,
    });
  }
}
