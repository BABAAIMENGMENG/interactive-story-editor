import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 获取公开的系统设置
 * 用于前台页面读取联系方式等配置
 */
export async function GET() {
  // 默认设置
  const defaultSettings = {
    contactWechat: 'CS_Service',
    contactWechatQrcode: '',
    contactEmail: 'support@cs-interactive.com',
    contactOnlineTime: '工作日 9:00 - 18:00',
    siteName: '全景互动',
    siteDescription: '创建沉浸式互动短剧和全景体验',
  };

  try {
    const supabase = getSupabaseClient();

    // 获取所有公开设置
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'contactWechat',
        'contactWechatQrcode',
        'contactEmail', 
        'contactOnlineTime',
        'siteName',
        'siteDescription'
      ]);

    if (error) {
      console.error('获取系统设置失败:', error);
      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      });
    }

    // 合并数据库设置和默认值
    const settings = { ...defaultSettings };
    (data || []).forEach((item: any) => {
      try {
        settings[item.key as keyof typeof settings] = JSON.parse(item.value);
      } catch {
        settings[item.key as keyof typeof settings] = item.value;
      }
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    return NextResponse.json({
      success: true,
      settings: defaultSettings,
    });
  }
}
