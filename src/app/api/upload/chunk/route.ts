import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// 配置路由以支持大文件上传
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 分钟超时

// 初始化 S3Storage
const getStorage = () => new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

/**
 * 上传单个分片
 * POST /api/upload/chunk
 * 
 * 参数：
 * - chunk: File (分片文件)
 * - taskId: string (上传任务ID)
 * - chunkIndex: number (分片索引)
 * - totalChunks: number (总分片数)
 * - fileHash: string (文件哈希，用于断点续传)
 * - fileName: string (原始文件名)
 * - fileType: string (文件类型)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunk = formData.get('chunk') as File;
    const taskId = formData.get('taskId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const fileHash = formData.get('fileHash') as string;
    const fileName = formData.get('fileName') as string;
    const fileType = formData.get('fileType') as string || 'application/octet-stream';

    if (!chunk || !taskId || isNaN(chunkIndex) || isNaN(totalChunks) || !fileHash) {
      return NextResponse.json({ 
        error: '参数不完整',
        code: 'MISSING_PARAMS'
      }, { status: 400 });
    }

    const storage = getStorage();

    // 读取分片内容
    const arrayBuffer = await chunk.arrayBuffer();
    const chunkBuffer = Buffer.from(arrayBuffer);

    // 分片存储路径：chunks/{fileHash}/{chunkIndex}
    const chunkKey = `chunks/${fileHash}/${chunkIndex.toString().padStart(6, '0')}`;

    console.log('[ChunkUpload] 上传分片:', chunkKey, 
      `(${chunkIndex + 1}/${totalChunks})`, 
      `大小: ${(chunkBuffer.length / 1024).toFixed(2)}KB`);

    // 上传分片到对象存储
    const uploadedKey = await storage.uploadFile({
      fileContent: chunkBuffer,
      fileName: chunkKey,
      contentType: fileType,
    });

    console.log('[ChunkUpload] 分片上传成功:', uploadedKey);

    return NextResponse.json({
      success: true,
      chunkKey: uploadedKey,
      chunkIndex,
      totalChunks,
    });
  } catch (error) {
    console.error('[ChunkUpload] 上传分片失败:', error);
    return NextResponse.json(
      { 
        error: '分片上传失败: ' + (error instanceof Error ? error.message : '未知错误'),
        code: 'CHUNK_UPLOAD_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * 检查分片是否存在
 * GET /api/upload/chunk?fileHash=xxx&chunkIndex=0
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileHash = searchParams.get('fileHash');
    const chunkIndex = searchParams.get('chunkIndex');

    if (!fileHash || chunkIndex === null) {
      return NextResponse.json({ 
        error: '参数不完整',
        code: 'MISSING_PARAMS'
      }, { status: 400 });
    }

    const storage = getStorage();
    const chunkKey = `chunks/${fileHash}/${chunkIndex.toString().padStart(6, '0')}`;

    const exists = await storage.fileExists({ fileKey: chunkKey });

    return NextResponse.json({
      success: true,
      exists,
      chunkKey,
    });
  } catch (error) {
    console.error('[ChunkUpload] 检查分片失败:', error);
    return NextResponse.json(
      { 
        error: '检查分片失败: ' + (error instanceof Error ? error.message : '未知错误'),
        code: 'CHECK_ERROR'
      },
      { status: 500 }
    );
  }
}
