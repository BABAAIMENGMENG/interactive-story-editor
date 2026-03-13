/**
 * 云端存储工具
 * 支持 Supabase Storage 和 S3 兼容存储
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 存储类型
export type StorageProvider = 'supabase' | 's3' | 'local';

// 文件信息
export interface CloudFile {
  key: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  provider: StorageProvider;
}

// 上传选项
export interface UploadOptions {
  projectId: string;
  type: 'video' | 'image' | 'audio' | 'panorama' | 'panoramaVideo';
  onProgress?: (progress: number) => void;
}

/**
 * Supabase Storage 客户端
 */
class SupabaseStorageClient {
  private client: SupabaseClient | null = null;
  private bucketName = 'media';

  private async getClient(): Promise<SupabaseClient> {
    if (this.client) {
      return this.client;
    }

    const url = process.env.COZE_SUPABASE_URL;
    const anonKey = process.env.COZE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error('Supabase 配置缺失');
    }

    this.client = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    return this.client;
  }

  /**
   * 上传文件到 Supabase Storage
   */
  async upload(
    file: File | Buffer,
    options: UploadOptions,
    userId?: string
  ): Promise<CloudFile> {
    const client = await this.getClient();

    // 生成文件路径
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file instanceof File ? file.name.split('.').pop() : 'bin';
    const fileName = file instanceof File ? file.name : `file_${timestamp}`;
    const folder = this.getFolder(options.type);
    const key = userId 
      ? `${userId}/${options.projectId}/${folder}/${timestamp}_${randomStr}.${ext}`
      : `public/${options.projectId}/${folder}/${timestamp}_${randomStr}.${ext}`;

    // 转换为 Buffer
    const buffer = file instanceof File 
      ? Buffer.from(await file.arrayBuffer())
      : file;

    const mimeType = file instanceof File 
      ? file.type 
      : this.getMimeType(options.type);

    options.onProgress?.(30);

    // 上传到 Supabase Storage
    const { data, error } = await client.storage
      .from(this.bucketName)
      .upload(key, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase 上传失败: ${error.message}`);
    }

    options.onProgress?.(80);

    // 获取公开 URL
    const { data: urlData } = client.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    options.onProgress?.(100);

    return {
      key: data.path,
      url: urlData.publicUrl,
      name: fileName,
      size: buffer.length,
      mimeType,
      provider: 'supabase',
    };
  }

  /**
   * 删除文件
   */
  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    const { error } = await client.storage
      .from(this.bucketName)
      .remove([key]);

    if (error) {
      throw new Error(`删除失败: ${error.message}`);
    }
  }

  /**
   * 获取签名 URL（私有文件）
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const client = await this.getClient();
    const { data, error } = await client.storage
      .from(this.bucketName)
      .createSignedUrl(key, expiresIn);

    if (error) {
      throw new Error(`获取签名 URL 失败: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * 获取文件夹路径
   */
  private getFolder(type: string): string {
    switch (type) {
      case 'video':
      case 'panoramaVideo':
        return 'videos';
      case 'audio':
        return 'audio';
      case 'panorama':
        return 'panoramas';
      default:
        return 'images';
    }
  }

  /**
   * 获取 MIME 类型
   */
  private getMimeType(type: string): string {
    switch (type) {
      case 'video':
      case 'panoramaVideo':
        return 'video/mp4';
      case 'audio':
        return 'audio/mpeg';
      default:
        return 'image/jpeg';
    }
  }
}

/**
 * S3 兼容存储客户端（已集成）
 */
class S3StorageClient {
  private endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
  private bucketName = process.env.COZE_BUCKET_NAME;

  async upload(
    file: File | Buffer,
    options: UploadOptions
  ): Promise<CloudFile> {
    // 动态导入，避免编译错误
    const { S3Storage } = await import('coze-coding-dev-sdk');
    
    const storage = new S3Storage({
      endpointUrl: this.endpointUrl,
      accessKey: '',
      secretKey: '',
      bucketName: this.bucketName,
      region: 'cn-beijing',
    });

    const buffer = file instanceof File 
      ? Buffer.from(await file.arrayBuffer())
      : file;

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file instanceof File ? file.name.split('.').pop() : 'bin';
    const fileName = file instanceof File ? file.name : `file_${timestamp}`;
    const folder = options.type === 'video' || options.type === 'panoramaVideo' ? 'videos' : 'images';
    const key = `${folder}/${timestamp}_${randomStr}.${ext}`;
    const mimeType = file instanceof File 
      ? file.type 
      : (options.type.includes('video') ? 'video/mp4' : 'image/jpeg');

    options.onProgress?.(30);

    const uploadedKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: key,
      contentType: mimeType,
    });

    options.onProgress?.(80);

    const url = await storage.generatePresignedUrl({
      key: uploadedKey,
      expireTime: 2592000, // 30 天
    });

    options.onProgress?.(100);

    return {
      key: uploadedKey,
      url,
      name: fileName,
      size: buffer.length,
      mimeType,
      provider: 's3',
    };
  }

  async delete(key: string): Promise<void> {
    // S3 删除逻辑
    console.log('S3 delete:', key);
  }
}

// 导出单例
export const supabaseStorage = new SupabaseStorageClient();
export const s3Storage = new S3StorageClient();

/**
 * 统一上传接口
 * 根据用户登录状态选择存储方式
 */
export async function uploadFile(
  file: File | Buffer,
  options: UploadOptions,
  userId?: string
): Promise<CloudFile> {
  if (userId) {
    // 已登录用户使用云端存储
    try {
      // 优先尝试 Supabase
      if (process.env.COZE_SUPABASE_URL) {
        return await supabaseStorage.upload(file, options, userId);
      }
      // 降级到 S3
      return await s3Storage.upload(file, options);
    } catch (error) {
      console.error('云端上传失败，降级到本地:', error);
      throw error;
    }
  } else {
    // 未登录用户无法使用云端存储
    throw new Error('请登录后上传文件到云端');
  }
}
