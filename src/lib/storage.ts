/**
 * IndexedDB 存储工具类
 * 用于存储项目和媒体文件，容量可达几百MB到几GB
 * 类似剪映的本地存储体验
 */

import { autoSyncOnSave } from './auto-sync';

const DB_NAME = 'cs-storage';
const DB_VERSION = 1;

// 存储的数据类型
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  canvasWidth: number;
  canvasHeight: number;
  scenes: any[];
  globalVariables: any[];
  createdAt: number;
  updatedAt: number;
}

export interface MediaFile {
  id: string;
  projectId: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  blob: Blob;
  size: number;
  mimeType: string;
  createdAt: number;
}

export interface ThumbnailData {
  projectId: string;
  thumbnail: Blob;
  createdAt: number;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<IDBDatabase> {
    // 如果已经在初始化中，返回同一个 Promise
    if (this.initPromise) {
      return this.initPromise;
    }

    // 如果已经初始化完成
    if (this.db) {
      return this.db;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB 初始化失败:', request.error);
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建项目存储
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // 创建媒体文件存储
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('projectId', 'projectId', { unique: false });
          mediaStore.createIndex('type', 'type', { unique: false });
        }

        // 创建缩略图存储
        if (!db.objectStoreNames.contains('thumbnails')) {
          const thumbnailStore = db.createObjectStore('thumbnails', { keyPath: 'projectId' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 保存项目
   */
  async saveProject(project: ProjectData): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.put(project);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // 保存成功后，自动触发云同步（后台执行，不阻塞）
        autoSyncOnSave(project).catch(err => {
          console.warn('自动云同步失败:', err);
        });
        resolve();
      };
    });
  }

  /**
   * 获取所有项目
   */
  async getAllProjects(): Promise<ProjectData[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const index = store.index('updatedAt');
      const request = index.openCursor(null, 'prev'); // 按更新时间倒序

      const projects: ProjectData[] = [];

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          projects.push(cursor.value);
          cursor.continue();
        } else {
          resolve(projects);
        }
      };
    });
  }

  /**
   * 获取单个项目
   */
  async getProject(id: string): Promise<ProjectData | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 删除项目
   */
  async deleteProject(id: string): Promise<void> {
    const db = await this.init();
    
    // 先删除关联的媒体文件
    await this.deleteMediaByProject(id);
    
    // 删除缩略图
    await this.deleteThumbnail(id);

    // 删除项目
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 保存媒体文件
   */
  async saveMedia(media: MediaFile): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');
      const request = store.put(media);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 获取项目的所有媒体文件
   */
  async getMediaByProject(projectId: string): Promise<MediaFile[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * 获取单个媒体文件
   */
  async getMedia(id: string): Promise<MediaFile | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 删除媒体文件
   */
  async deleteMedia(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 删除项目的所有媒体文件
   */
  async deleteMediaByProject(projectId: string): Promise<void> {
    const db = await this.init();
    const mediaFiles = await this.getMediaByProject(projectId);
    
    for (const media of mediaFiles) {
      await this.deleteMedia(media.id);
    }
  }

  /**
   * 保存缩略图
   */
  async saveThumbnail(projectId: string, thumbnail: Blob): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['thumbnails'], 'readwrite');
      const store = transaction.objectStore('thumbnails');
      const request = store.put({
        projectId,
        thumbnail,
        createdAt: Date.now()
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 获取缩略图
   */
  async getThumbnail(projectId: string): Promise<Blob | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['thumbnails'], 'readonly');
      const store = transaction.objectStore('thumbnails');
      const request = store.get(projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.thumbnail);
      };
    });
  }

  /**
   * 删除缩略图
   */
  async deleteThumbnail(projectId: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['thumbnails'], 'readwrite');
      const store = transaction.objectStore('thumbnails');
      const request = store.delete(projectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 获取存储使用情况
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { usage: 0, quota: 0 };
  }

  /**
   * 格式化存储大小
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['projects', 'media', 'thumbnails'], 'readwrite');
      
      const projectsStore = transaction.objectStore('projects');
      const mediaStore = transaction.objectStore('media');
      const thumbnailsStore = transaction.objectStore('thumbnails');
      
      projectsStore.clear();
      mediaStore.clear();
      thumbnailsStore.clear();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }
}

// 导出单例
export const indexedDBStorage = new IndexedDBStorage();

/**
 * 从文件创建媒体对象URL
 * 从 IndexedDB 加载的 Blob 需要创建 URL 才能在页面中使用
 */
export function createMediaURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * 释放媒体对象URL
 * 当不再使用时释放内存
 */
export function revokeMediaURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * 从输入文件转换为 Blob
 */
export async function fileToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const blob = new Blob([reader.result as ArrayBuffer], { type: file.type });
      resolve(blob);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
