import { NextRequest, NextResponse } from 'next/server';

// 临时使用内存存储，生产环境应使用数据库
let paymentConfig = {
  wechat: {
    enabled: true,
    qrCodeUrl: '/payment/wechat-qr.png',
    name: '微信支付',
  },
  alipay: {
    enabled: true,
    qrCodeUrl: '/payment/alipay-qr.png',
    name: '支付宝',
  },
};

export async function GET() {
  return NextResponse.json(paymentConfig);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    if (!body.wechat || !body.alipay) {
      return NextResponse.json(
        { error: '缺少支付配置' },
        { status: 400 }
      );
    }

    // 更新配置
    paymentConfig = {
      wechat: {
        enabled: body.wechat.enabled ?? true,
        qrCodeUrl: body.wechat.qrCodeUrl || '',
        name: body.wechat.name || '微信支付',
      },
      alipay: {
        enabled: body.alipay.enabled ?? true,
        qrCodeUrl: body.alipay.qrCodeUrl || '',
        name: body.alipay.name || '支付宝',
      },
    };

    // 生产环境应保存到数据库
    // await db.paymentConfig.upsert({...})

    return NextResponse.json({ success: true, config: paymentConfig });
  } catch (error) {
    console.error('保存支付配置失败:', error);
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500 }
    );
  }
}
