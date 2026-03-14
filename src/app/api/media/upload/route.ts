import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, s3Storage } from '@/lib/cloud-storage';
import { indexedDBStorage, fileToBlob } from '@/lib/storage';

// 配置 API 路由 - 支持大文件上传
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 分钟超时，支持大文件上传
export const dynamic = 'force-dynamic';

/**
 * 媒体文件上传 API
 * 
 * POST /api/media/upload
 * 
 * 支持两种存储模式：
 * - 云端存储（已登录用户）：Supabase Storage 或 S3
 * - 本地存储（未登录用户）：返回 Base64 或提示用户登录
 */
export async function POST(request: NextRequest) {
  console.log('[Media Upload] 收到上传请求');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'image';
    const projectId = formData.get('projectId') as string;
    const userId = formData.get('userId') as string | null;
    const storage = formData.get('storage') as string || 'auto'; // auto, cloud, local
    
    console.log('[Media Upload] 参数:', { 
      fileName: file?.name, 
      fileSize: file?.size,
      fileSizeMB: file ? (file.size / 1024 / 1024).toFixed(2) : 0,
      type,
      projectId,
      userId: userId ? '已登录' : '未登录',
      storage,
    });
    
    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 检查文件大小（500MB 限制）
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: '文件过大', 
        details: `文件超过 500MB 限制，当前文件 ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        code: 'FILE_TOO_LARGE'
      }, { status: 413 });
    }

    // 云端存储
    if ((storage === 'cloud' || storage === 'auto') && userId) {
      console.log('[Media Upload] 使用云端存储');
      
      try {
        const result = await uploadFile(file, {
          projectId,
          type: type as any,
          onProgress: (progress) => {
            console.log(`[Media Upload] 进度: ${progress}%`);
          },
        }, userId);

        console.log('[Media Upload] 云端上传成功:', result.url);
        
        return NextResponse.json({
          success: true,
          url: result.url,
          key: result.key,
          name: result.name,
          size: result.size,
          provider: result.provider,
          storage: 'cloud',
        });
      } catch (error) {
        console.error('[Media Upload] 云端上传失败:', error);
        return NextResponse.json({ 
          error: '云端上传失败', 
          details: error instanceof Error ? error.message : '未知错误',
          code: 'CLOUD_UPLOAD_FAILED'
        }, { status: 500 });
      }
    }

    // S3 存储（无需登录，使用平台存储）
    if (storage === 'auto' && !userId) {
      console.log('[Media Upload] 使用平台 S3 存储');
      
      try {
        const result = await s3Storage.upload(file, {
          projectId,
          type: type as any,
        });

        console.log('[Media Upload] S3 上传成功:', result.url);
        
        return NextResponse.json({
          success: true,
          url: result.url,
          key: result.key,
          name: result.name,
          size: result.size,
          provider: 's3',
          storage: 'cloud',
        });
      } catch (error) {
        console.error('[Media Upload] S3 上传失败:', error);
        return NextResponse.json({ 
          error: '上传失败', 
          details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
      }
    }

    // 本地存储（返回 Base64 数据 URL）
    if (storage === 'local') {
      console.log('[Media Upload] 使用本地存储');
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      // 检查文件大小是否适合 Base64（建议小于 10MB）
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ 
          error: '本地存储限制', 
          details: '大文件建议登录后使用云端存储',
          code: 'LOCAL_STORAGE_LIMIT'
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        url: dataUrl,
        name: file.name,
        size: file.size,
        provider: 'local',
        storage: 'local',
      });
    }

    return NextResponse.json({ 
      error: '存储方式不可用', 
      details: '请选择有效的存储方式',
      code: 'INVALID_STORAGE'
    }, { status: 400 });

  } catch (error) {
    console.error('[Media Upload] 上传失败:', error);
    return NextResponse.json({ 
      error: '上传失败', 
      details: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

/**
 * 删除媒体文件
 */
export async function DELETE(request: NextRequest) {
  try {
    const { key, provider } = await request.json();

    if (provider === 'supabase') {
      const { supabaseStorage } = await import('@/lib/cloud-storage');
      await supabaseStorage.delete(key);
    } else if (provider === 's3') {
      // S3 删除逻辑
      console.log('S3 delete:', key);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除文件失败:', error);
    return NextResponse.json({ 
      error: '删除失败', 
      details: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
