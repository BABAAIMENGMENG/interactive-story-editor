import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

/**
 * 获取公开的系统设置
 * GET /api/settings
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // 获取所有公开设置
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('key, value');
    
    if (error) {
      console.error('获取系统设置失败:', error);
      // 返回默认设置
      return NextResponse.json({
        paymentMode: 'review',
        inviteRewardEnabled: true,
        inviterReward: 50,
        inviteeReward: 50,
        newUserBonus: 100,
        publishRewardBeans: 50,
      });
    }
    
    // 转换为对象格式
    const settingsMap: Record<string, any> = {};
    settings?.forEach((item: any) => {
      settingsMap[item.key] = item.value;
    });
    
    return NextResponse.json({
      paymentMode: settingsMap.paymentMode || 'review',
      inviteRewardEnabled: settingsMap.inviteRewardEnabled !== false,
      inviterReward: settingsMap.inviterReward || 50,
      inviteeReward: settingsMap.inviteeReward || 50,
      newUserBonus: settingsMap.newUserBonus || 100,
      publishRewardBeans: settingsMap.publishRewardBeans || 50,
      siteName: settingsMap.siteName || '全景互动',
      siteDescription: settingsMap.siteDescription || '',
    });
    
  } catch (error) {
    console.error('获取系统设置失败:', error);
    return NextResponse.json({
      paymentMode: 'review',
      inviteRewardEnabled: true,
      inviterReward: 50,
      inviteeReward: 50,
      newUserBonus: 100,
      publishRewardBeans: 50,
    });
  }
}
