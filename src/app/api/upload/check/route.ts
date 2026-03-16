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

    // 2. 检查已上传的分片（断点续传）
    const uploadedChunks: number[] = [];
    
    // 并行检查所有分片（提高速度）
    const checkPromises = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkKey = `chunks/${fileHash}/${i.toString().padStart(6, '0')}`;
      checkPromises.push(
        storage.fileExists({ fileKey: chunkKey }).then(exists => {
          if (exists) uploadedChunks.push(i);
        })
      );
    }
    
    await Promise.all(checkPromises);
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
