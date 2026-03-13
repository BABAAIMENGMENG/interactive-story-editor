/**
 * 媒体文件存储 Hook
 * 支持将视频、图片、音频存储到 IndexedDB
 * 类似剪映的本地文件管理体验
 */

import { useState, useCallback, useEffect } from 'react';
import { indexedDBStorage, type MediaFile, fileToBlob, createMediaURL, revokeMediaURL } from '@/lib/storage';

// 生成简单唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string; // Object URL for display
  size: number;
  mimeType: string;
  source: 'local' | 'cloud'; // 来源标识
}

export function useMediaStorage(projectId: string) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  /**
   * 加载项目的所有媒体文件
   */
  const loadMedia = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const mediaFiles = await indexedDBStorage.getMediaByProject(projectId);
      const items: MediaItem[] = mediaFiles.map((media) => ({
        id: media.id,
        name: media.name,
        type: media.type,
        url: createMediaURL(media.blob),
        size: media.size,
        mimeType: media.mimeType,
        source: 'local' as const,
      }));
      setMediaItems(items);
    } catch (error) {
      console.error('加载媒体文件失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  /**
   * 上传文件到 IndexedDB
   */
  const uploadFile = useCallback(async (file: File, onProgress?: (progress: number) => void): Promise<MediaItem> => {
    const mediaId = generateId();
    
    // 设置初始进度
    setUploadProgress((prev) => ({ ...prev, [mediaId]: 0 }));
    
    try {
      // 模拟进度（IndexedDB 不支持实际进度）
      onProgress?.(10);
      setUploadProgress((prev) => ({ ...prev, [mediaId]: 10 }));

      // 转换文件为 Blob
      const blob = await fileToBlob(file);
      onProgress?.(50);
      setUploadProgress((prev) => ({ ...prev, [mediaId]: 50 }));

      // 确定媒体类型
      let mediaType: 'video' | 'image' | 'audio' = 'image';
      if (file.type.startsWith('video/')) {
        mediaType = 'video';
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'audio';
      }

      // 保存到 IndexedDB
      const mediaFile: MediaFile = {
        id: mediaId,
        projectId,
        name: file.name,
        type: mediaType,
        blob,
        size: file.size,
        mimeType: file.type,
        createdAt: Date.now(),
      };

      await indexedDBStorage.saveMedia(mediaFile);
      onProgress?.(100);
      setUploadProgress((prev) => ({ ...prev, [mediaId]: 100 }));

      // 创建显示用的 URL
      const url = createMediaURL(blob);
      const item: MediaItem = {
        id: mediaId,
        name: file.name,
        type: mediaType,
        url,
        size: file.size,
        mimeType: file.type,
        source: 'local',
      };

      // 更新列表
      setMediaItems((prev) => [...prev, item]);

      return item;
    } catch (error) {
      console.error('上传文件失败:', error);
      throw error;
    } finally {
      // 清除进度
      setTimeout(() => {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[mediaId];
          return next;
        });
      }, 500);
    }
  }, [projectId]);

  /**
   * 批量上传文件
   */
  const uploadFiles = useCallback(async (files: FileList | File[]): Promise<MediaItem[]> => {
    const items: MediaItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const item = await uploadFile(file);
        items.push(item);
      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error);
      }
    }
    return items;
  }, [uploadFile]);

  /**
   * 删除媒体文件
   */
  const deleteMedia = useCallback(async (mediaId: string) => {
    try {
      await indexedDBStorage.deleteMedia(mediaId);
      
      // 释放 URL
      const item = mediaItems.find((m) => m.id === mediaId);
      if (item) {
        revokeMediaURL(item.url);
      }
      
      // 更新列表
      setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (error) {
      console.error('删除媒体文件失败:', error);
      throw error;
    }
  }, [mediaItems]);

  /**
   * 获取媒体 URL（从 IndexedDB 加载）
   */
  const getMediaUrl = useCallback(async (mediaId: string): Promise<string | null> => {
    const existing = mediaItems.find((m) => m.id === mediaId);
    if (existing) {
      return existing.url;
    }

    const media = await indexedDBStorage.getMedia(mediaId);
    if (media) {
      const url = createMediaURL(media.blob);
      return url;
    }

    return null;
  }, [mediaItems]);

  /**
   * 获取存储使用情况
   */
  const getStorageUsage = useCallback(async () => {
    return indexedDBStorage.getStorageEstimate();
  }, []);

  // 初始加载
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // 清理 URL（组件卸载时）
  useEffect(() => {
    return () => {
      mediaItems.forEach((item) => {
        revokeMediaURL(item.url);
      });
    };
  }, []);

  return {
    mediaItems,
    isLoading,
    uploadProgress,
    uploadFile,
    uploadFiles,
    deleteMedia,
    getMediaUrl,
    getStorageUsage,
    reload: loadMedia,
  };
}

/**
 * 从 URL 加载媒体到 IndexedDB
 * 用于将网络视频/图片下载到本地存储
 */
export async function downloadMediaToIndexedDB(
  projectId: string,
  url: string,
  type: 'video' | 'image' | 'audio',
  name?: string
): Promise<MediaItem> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载失败: ${response.status}`);
  }

  const blob = await response.blob();
  const mediaId = generateId();
  const fileName = name || url.split('/').pop() || `media-${Date.now()}`;

  const mediaFile: MediaFile = {
    id: mediaId,
    projectId,
    name: fileName,
    type,
    blob,
    size: blob.size,
    mimeType: blob.type,
    createdAt: Date.now(),
  };

  await indexedDBStorage.saveMedia(mediaFile);

  return {
    id: mediaId,
    name: fileName,
    type,
    url: createMediaURL(blob),
    size: blob.size,
    mimeType: blob.type,
    source: 'local',
  };
}
