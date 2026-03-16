import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

// 初始化 S3Storage
const getStorage = () => new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

/**
 * 检查文件是否存在（秒传检测）+ 检查已上传分片（断点续传）
 * POST /api/upload/check
 * 
 * 参数：
 * - fileHash: string (文件哈希)
 * - fileSize: number (文件大小)
 * - totalChunks: number (总分片数)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileHash, fileSize, totalChunks } = body;

    if (!fileHash || !totalChunks) {
      return NextResponse.json({ 
        error: '参数不完整',
        code: 'MISSING_PARAMS'
      }, { status: 400 });
    }

    const storage = getStorage();

    // 1. 检查完整文件是否已存在（秒传）
    const finalFileKey = `files/${fileHash}`;
    const fileExists = await storage.fileExists({ fileKey: finalFileKey });
    
    if (fileExists) {
      console.log('[UploadCheck] 秒传命中:', fileHash);
      
      // 生成签名 URL
      const fileUrl = await storage.generatePresignedUrl({
        key: finalFileKey,
        expireTime: 2592000, // 30 天
      });
      
      return NextResponse.json({
        success: true,
        instantUpload: true, // 秒传
        fileUrl,
        fileKey: finalFileKey,
        message: '文件已存在，秒传成功',
      });
    }

    // 2. 检查已上传的分片（断点续传）- 使用 listFiles 因为 SDK 会添加 UUID 后缀
    const listResult = await storage.listFiles({ 
      prefix: `chunks/${fileHash}/`,
      maxKeys: totalChunks + 10
    });
    
    // 解析分片索引
    const uploadedChunks: number[] = [];
    for (const key of listResult.keys) {
      // 解析索引：chunks/{fileHash}/{index}_uuid -> {index}
      const match = key.match(/chunks\/[^\/]+\/(\d+)/);
      if (match) {
        uploadedChunks.push(parseInt(match[1], 10));
      }
    }
    uploadedChunks.sort((a, b) => a - b);

    console.log('[UploadCheck] 断点续传检查:', fileHash, 
      `已上传 ${uploadedChunks.length}/${totalChunks} 分片`);

    return NextResponse.json({
      success: true,
      instantUpload: false,
      uploadedChunks,
      uploadedCount: uploadedChunks.length,
      totalChunks,
    });
  } catch (error) {
    console.error('[UploadCheck] 检查失败:', error);
    return NextResponse.json(
      { 
        error: '检查失败: ' + (error instanceof Error ? error.message : '未知错误'),
        code: 'CHECK_ERROR'
      },
      { status: 500 }
    );
  }
}
