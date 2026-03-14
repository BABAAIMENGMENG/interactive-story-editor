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

    // 检查文件大小（最大 100MB）
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过 100MB' }, { status: 400 });
    }

    // 初始化 S3Storage
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: "cn-beijing",
    });

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 生成文件名（使用时间戳避免重复）
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'bin';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `uploads/${timestamp}_${safeName}`;

    console.log('[Upload] 开始上传文件:', fileName, '大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    // 上传到对象存储（使用返回的 key）
    const fileKey = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName: fileName,
      contentType: file.type || 'application/octet-stream',
    });

    console.log('[Upload] 上传成功, key:', fileKey);

    // 生成签名 URL（有效期 30 天）
    const url = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 2592000, // 30 天
    });

    console.log('[Upload] 生成访问 URL 成功');

    return NextResponse.json({
      success: true,
      url: url,
      key: fileKey,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error('[Upload] 上传文件失败:', error);
    return NextResponse.json(
      { error: '上传失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
