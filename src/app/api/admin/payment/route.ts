import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 获取收款配置
 * GET /api/admin/payment
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['paymentWechatQrcode', 'paymentAlipayQrcode']);

    if (error) {
      console.error('获取收款配置失败:', error);
      return NextResponse.json({
        success: true,
        config: {
          wechat: { enabled: true, qrCodeUrl: '', name: '微信支付' },
          alipay: { enabled: true, qrCodeUrl: '', name: '支付宝' },
        },
      });
    }

    // 解析配置
    const config: Record<string, string> = {};
    (data || []).forEach((item: any) => {
      try {
        config[item.key] = JSON.parse(item.value);
      } catch {
        config[item.key] = item.value;
      }
    });

    return NextResponse.json({
      success: true,
      config: {
        wechat: {
          enabled: true,
          qrCodeUrl: config.paymentWechatQrcode || '',
          name: '微信支付',
        },
        alipay: {
          enabled: true,
          qrCodeUrl: config.paymentAlipayQrcode || '',
          name: '支付宝',
        },
      },
    });
  } catch (error) {
    console.error('获取收款配置失败:', error);
    return NextResponse.json({
      success: true,
      config: {
        wechat: { enabled: true, qrCodeUrl: '', name: '微信支付' },
        alipay: { enabled: true, qrCodeUrl: '', name: '支付宝' },
      },
    });
  }
}

/**
 * 保存收款配置
 * POST /api/admin/payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wechat, alipay } = body;

    const supabase = getSupabaseClient();

    // 保存微信收款码
    if (wechat?.qrCodeUrl !== undefined) {
      await supabase
        .from('system_settings')
        .upsert({
          key: 'paymentWechatQrcode',
          value: JSON.stringify(wechat.qrCodeUrl),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
    }

    // 保存支付宝收款码
    if (alipay?.qrCodeUrl !== undefined) {
      await supabase
        .from('system_settings')
        .upsert({
          key: 'paymentAlipayQrcode',
          value: JSON.stringify(alipay.qrCodeUrl),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存收款配置失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
