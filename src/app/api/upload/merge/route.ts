import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

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
 * 合并分片
 * POST /api/upload/merge
 * 
 * 参数：
 * - taskId: string (上传任务ID)
 * - fileHash: string (文件哈希)
 * - fileName: string (原始文件名)
 * - fileType: string (文件类型)
 * - fileSize: number (文件大小)
 * - totalChunks: number (总分片数)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, fileHash, fileName, fileType, fileSize, totalChunks } = body;

    if (!fileHash || !fileName || !totalChunks) {
      return NextResponse.json({ 
        error: '参数不完整',
        code: 'MISSING_PARAMS'
      }, { status: 400 });
    }

    const storage = getStorage();

    console.log('[MergeUpload] 开始合并分片:', fileName, 
      `总分片: ${totalChunks}, 大小: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);

    // 先检查完整文件是否已存在（防止重复合并）
    const finalFileKey = `files/${fileHash}`;
    const existingFile = await storage.fileExists({ fileKey: finalFileKey });
    
    if (existingFile) {
      console.log('[MergeUpload] 文件已存在，直接返回:', fileHash);
      
      const fileUrl = await storage.generatePresignedUrl({
        key: finalFileKey,
        expireTime: 2592000,
      });
      
      return NextResponse.json({
        success: true,
        fileKey: finalFileKey,
        fileUrl,
        fileName,
        fileSize,
        cached: true,
      });
    }

    // 验证所有分片是否都已上传（使用 listFiles 查找，因为 SDK 会添加 UUID 后缀）
    const listResult = await storage.listFiles({ 
      prefix: `chunks/${fileHash}/`, 
      maxKeys: totalChunks + 10 
    });
    
    // 提取分片索引，并保存实际的 key
    const chunkKeyMap = new Map<number, string>(); // index -> actual key
    for (const key of listResult.keys) {
      // 解析索引：chunks/{fileHash}/{index}_uuid -> {index}
      const match = key.match(/chunks\/[^\/]+\/(\d+)/);
      if (match) {
        const index = parseInt(match[1], 10);
        chunkKeyMap.set(index, key);
      }
    }
    
    // 检查缺失的分片
    const missingChunks: number[] = [];
    for (let i = 0; i < totalChunks; i++) {
      if (!chunkKeyMap.has(i)) {
        missingChunks.push(i);
      }
    }

    if (missingChunks.length > 0) {
      return NextResponse.json({
        error: `缺少分片: ${missingChunks.slice(0, 10).join(', ')}${missingChunks.length > 10 ? '...' : ''}`,
        code: 'MISSING_CHUNKS',
        missingChunks: missingChunks.slice(0, 50), // 最多返回50个
        missingCount: missingChunks.length,
      }, { status: 400 });
    }

    // 创建分片数据生成器（使用实际的 key）
    async function* chunkGenerator() {
      for (let i = 0; i < totalChunks; i++) {
        const actualKey = chunkKeyMap.get(i);
        if (!actualKey) {
          throw new Error(`分片 ${i} 的 key 不存在`);
        }
        try {
          const chunkData = await storage.readFile({ fileKey: actualKey });
          yield chunkData;
        } catch (err) {
          console.error('[MergeUpload] 读取分片失败:', actualKey, err);
          throw err;
        }
      }
    }

    // 使用哈希作为文件名（支持秒传检测）
    const ext = fileName.split('.').pop() || 'bin';
    const finalFileName = `files/${fileHash}.${ext}`;

    // 使用分块流式上传合并文件
    const fileKey = await storage.chunkUploadFile({
      chunks: chunkGenerator(),
      fileName: finalFileName,
      contentType: fileType || 'application/octet-stream',
    });

    console.log('[MergeUpload] 合并成功:', fileKey);

    // 生成签名 URL（有效期 30 天）
    const fileUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 2592000, // 30 天
    });

    // 清理分片（异步执行，不阻塞响应）
    cleanupChunks(fileHash).catch(err => {
      console.warn('[MergeUpload] 清理分片失败:', err);
    });

    return NextResponse.json({
      success: true,
      fileKey,
      fileUrl,
      fileName,
      fileSize,
    });
  } catch (error) {
    console.error('[MergeUpload] 合并分片失败:', error);
    return NextResponse.json(
      { 
        error: '合并失败: ' + (error instanceof Error ? error.message : '未知错误'),
        code: 'MERGE_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * 清理已合并的分片（使用 listFiles 获取实际的 key）
 */
async function cleanupChunks(fileHash: string): Promise<void> {
  const storage = getStorage();
  
  try {
    // 使用 listFiles 获取所有分片的实际 key
    const listResult = await storage.listFiles({ 
      prefix: `chunks/${fileHash}/`,
      maxKeys: 1000
    });
    
    const deletePromises = listResult.keys.map(key => 
      storage.deleteFile({ fileKey: key }).catch(() => {
        // 忽略删除失败
      })
    );
    
    await Promise.all(deletePromises);
    console.log('[MergeUpload] 分片清理完成:', fileHash, `删除 ${listResult.keys.length} 个分片`);
  } catch (err) {
    console.warn('[MergeUpload] 清理分片失败:', err);
  }
}
