/**
 * 统一文件上传 Hook
 * 支持云端存储和本地存储
 * 自动根据登录状态选择存储方式
 */

import { useState, useCallback } from 'react';

export interface UploadResult {
  url: string;
  key?: string;
  name: string;
  size: number;
  provider: 'supabase' | 's3' | 'local';
  storage: 'cloud' | 'local';
}

export interface UploadOptions {
  projectId: string;
  type: 'video' | 'image' | 'audio' | 'panorama' | 'panoramaVideo';
  userId?: string;
  storage?: 'auto' | 'cloud' | 'local';
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * 上传单个文件
   */
  const upload = useCallback(async (
    file: File,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', options.type);
      formData.append('projectId', options.projectId);
      formData.append('storage', options.storage || 'auto');
      if (options.userId) {
        formData.append('userId', options.userId);
      }

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || '上传失败');
      }

      setProgress(100);
      
      return {
        url: data.url,
        key: data.key,
        name: data.name,
        size: data.size,
        provider: data.provider,
        storage: data.storage,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '上传失败';
      setError(message);
      console.error('上传失败:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  /**
   * 上传多个文件
   */
  const uploadMultiple = useCallback(async (
    files: FileList | File[],
    options: UploadOptions,
    onFileComplete?: (result: UploadResult, index: number) => void
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const result = await upload(file, options);
      
      if (result) {
        results.push(result);
        onFileComplete?.(result, i);
      }
    }

    return results;
  }, [upload]);

  /**
   * 从 URL 上传（下载后转存）
   */
  const uploadFromUrl = useCallback(async (
    url: string,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 下载文件
      setProgress(20);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }

      setProgress(40);
      const blob = await response.blob();
      
      // 从 URL 提取文件名
      const fileName = url.split('/').pop() || `file-${Date.now()}`;
      const file = new File([blob], fileName, { type: blob.type });

      setProgress(60);
      
      // 上传
      const result = await upload(file, options);
      
      setProgress(100);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'URL 上传失败';
      setError(message);
      console.error('URL 上传失败:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [upload]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isUploading,
    progress,
    error,
    upload,
    uploadMultiple,
    uploadFromUrl,
    clearError,
  };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查文件类型
 */
export function getFileType(file: File): 'video' | 'image' | 'audio' | 'unknown' {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'unknown';
}

/**
 * 检查文件是否为全景图/视频
 */
export function isPanoramaFile(file: File): boolean {
  // 简单判断：如果文件名包含 panorama 或 equirectangular
  const name = file.name.toLowerCase();
  return name.includes('panorama') || name.includes('equirectangular') || name.includes('360');
}
