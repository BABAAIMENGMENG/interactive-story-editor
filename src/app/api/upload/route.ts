import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * 上传文件到对象存储
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 });
    }

    // 检查文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 });
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG、PNG、GIF、WebP 格式的图片' }, { status: 400 });
    }

    // 检查环境变量
    if (!process.env.COZE_BUCKET_ENDPOINT_URL || !process.env.COZE_BUCKET_NAME) {
      console.error('对象存储环境变量未配置');
      // 返回一个临时 URL 格式（开发环境）
      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'jpg';
      // 使用 Data URL 返回（开发环境）
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      return NextResponse.json({
        success: true,
        url: dataUrl,
        key: `qrcodes/${timestamp}_${file.name}`,
      });
    }

    // 初始化对象存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer);

    // 生成文件名（使用时间戳避免重复）
    const timestamp = Date.now();
    const fileName = `qrcodes/${timestamp}_${file.name}`;

    // 上传到对象存储
    const key = await storage.uploadFile({
      fileContent,
      fileName,
      contentType: file.type,
    });

    // 生成签名 URL（有效期 30 天）
    const url = await storage.generatePresignedUrl({
      key,
      expireTime: 30 * 24 * 60 * 60, // 30 天
    });

    return NextResponse.json({
      success: true,
      url,
      key,
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    );
  }
}
