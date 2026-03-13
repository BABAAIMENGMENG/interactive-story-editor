import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '仅支持图片文件' }, { status: 400 });
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过5MB' }, { status: 400 });
    }

    // 生成文件名
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${type || 'upload'}/${Date.now()}.${ext}`;

    // 生产环境应使用对象存储
    // const url = await uploadToStorage(file, fileName);
    
    // 开发环境返回模拟URL
    const url = `/uploads/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url,
      fileName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: '上传失败' },
      { status: 500 }
    );
  }
}
