/**
 * 分片上传 Hook
 * 支持大文件分片上传、断点续传、暂停/继续
 * 类似剪映的上传体验
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// 分片大小：5MB
const CHUNK_SIZE = 5 * 1024 * 1024;

// 最大并发数
const MAX_CONCURRENT = 3;

// 重试次数
const MAX_RETRIES = 3;

// 上传状态
export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'error';

// 分片信息
export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  retryCount: number;
  error?: string;
}

// 上传任务
export interface UploadTask {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  chunks: ChunkInfo[];
  status: UploadStatus;
  progress: number; // 0-100
  uploadedSize: number;
  uploadSpeed: number; // bytes/s
  startTime: number;
  endTime?: number;
  error?: string;
  uploadedChunks: Set<number>; // 已完成的分片索引
}

// 上传结果
export interface UploadResult {
  id: string;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 计算文件 Hash（用于断点续传和秒传）
async function calculateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // 使用文件名+大小+修改时间作为简单标识（实际生产环境应使用 SparkMD5）
      const hash = `${file.name}-${file.size}-${file.lastModified}`;
      resolve(btoa(hash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file.slice(0, 1024 * 1024)); // 只读取前 1MB 用于快速计算
  });
}

// IndexedDB 存储上传进度
const DB_NAME = 'ChunkUploadDB';
const STORE_NAME = 'upload_progress';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
  });
}

async function saveProgress(id: string, data: { uploadedChunks: number[]; fileHash: string }): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, ...data, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadProgress(id: string): Promise<{ uploadedChunks: number[]; fileHash: string } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function clearProgress(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function useChunkedUpload() {
  const [tasks, setTasks] = useState<Map<string, UploadTask>>(new Map());
  const [results, setResults] = useState<UploadResult[]>([]);
  
  // 使用 ref 存储暂停标志和上传控制器
  const abortControllersRef = useRef<Map<string, AbortController[]>>(new Map());
  const pausedRef = useRef<Set<string>>(new Set());

  // 更新任务状态
  const updateTask = useCallback((id: string, updates: Partial<UploadTask>) => {
    setTasks(prev => {
      const next = new Map(prev);
      const task = next.get(id);
      if (task) {
        next.set(id, { ...task, ...updates });
      }
      return next;
    });
  }, []);

  // 上传单个分片
  const uploadChunk = useCallback(async (
    taskId: string,
    file: File,
    chunk: ChunkInfo,
    fileHash: string,
    totalChunks: number,
    onProgress?: (uploadedSize: number) => void
  ): Promise<{ success: boolean; chunkKey?: string; error?: string }> => {
    const blob = file.slice(chunk.start, chunk.end);
    
    const formData = new FormData();
    formData.append('chunk', blob);
    formData.append('taskId', taskId);
    formData.append('chunkIndex', String(chunk.index));
    formData.append('totalChunks', String(totalChunks));
    formData.append('fileHash', fileHash);
    formData.append('fileName', file.name);
    formData.append('fileType', file.type);

    const controller = new AbortController();
    if (!abortControllersRef.current.has(taskId)) {
      abortControllersRef.current.set(taskId, []);
    }
    abortControllersRef.current.get(taskId)!.push(controller);

    try {
      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const data = await response.json();
      return { success: true, chunkKey: data.chunkKey };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: '上传已取消' };
      }
      return { success: false, error: error.message || '上传失败' };
    }
  }, []);

  // 合并分片
  const mergeChunks = useCallback(async (
    taskId: string,
    file: File,
    fileHash: string,
    totalChunks: number
  ): Promise<{ success: boolean; fileKey?: string; fileUrl?: string; error?: string }> => {
    try {
      const response = await fetch('/api/upload/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          fileHash,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          totalChunks,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const data = await response.json();
      return { success: true, fileKey: data.fileKey, fileUrl: data.fileUrl };
    } catch (error: any) {
      return { success: false, error: error.message || '合并失败' };
    }
  }, []);

  // 添加上传任务
  const addTask = useCallback(async (file: File): Promise<string> => {
    const taskId = generateId();
    const fileHash = await calculateFileHash(file);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // 创建分片信息
    const chunks: ChunkInfo[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      chunks.push({
        index: i,
        start,
        end,
        size: end - start,
        status: 'pending',
        retryCount: 0,
      });
    }

    // 检查是否有已上传的进度
    const savedProgress = await loadProgress(fileHash);
    const uploadedChunks = new Set<number>(savedProgress?.uploadedChunks || []);
    
    // 更新已上传的分片状态
    if (uploadedChunks.size > 0) {
      chunks.forEach(chunk => {
        if (uploadedChunks.has(chunk.index)) {
          chunk.status = 'completed';
        }
      });
    }

    const task: UploadTask = {
      id: taskId,
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      chunks,
      status: 'pending',
      progress: (uploadedChunks.size / totalChunks) * 100,
      uploadedSize: uploadedChunks.size * CHUNK_SIZE,
      uploadSpeed: 0,
      startTime: 0,
      uploadedChunks,
    };

    setTasks(prev => new Map(prev).set(taskId, task));
    return taskId;
  }, []);

  // 开始上传
  const startUpload = useCallback(async (taskId: string) => {
    const task = tasks.get(taskId);
    if (!task || task.status === 'uploading' || task.status === 'completed') {
      return;
    }

    pausedRef.current.delete(taskId);
    updateTask(taskId, { status: 'uploading', startTime: Date.now() });

    const file = task.file;
    const fileHash = await calculateFileHash(file);
    const totalChunks = task.chunks.length;
    
    // 获取待上传的分片
    const pendingChunks = task.chunks.filter(c => c.status !== 'completed');
    
    // 并发上传队列
    let runningCount = 0;
    let queueIndex = 0;
    let lastProgressTime = Date.now();
    let lastUploadedSize = task.uploadedSize;

    const processQueue = async () => {
      while (queueIndex < pendingChunks.length && !pausedRef.current.has(taskId)) {
        if (runningCount >= MAX_CONCURRENT) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const chunk = pendingChunks[queueIndex];
        queueIndex++;
        runningCount++;

        // 更新分片状态
        updateTask(taskId, {
          chunks: task.chunks.map(c => 
            c.index === chunk.index ? { ...c, status: 'uploading' as const } : c
          ),
        });

        const result = await uploadChunk(taskId, file, chunk, fileHash, totalChunks);

        if (pausedRef.current.has(taskId)) {
          runningCount--;
          break;
        }

        if (result.success) {
          // 更新进度
          const currentTask = tasks.get(taskId);
          if (currentTask) {
            const newUploadedChunks = new Set(currentTask.uploadedChunks);
            newUploadedChunks.add(chunk.index);
            
            const uploadedSize = Array.from(newUploadedChunks).reduce((sum, idx) => {
              const c = currentTask.chunks[idx];
              return sum + (c ? c.size : 0);
            }, 0);

            const progress = (uploadedSize / file.size) * 100;
            
            // 计算上传速度
            const now = Date.now();
            const timeDiff = (now - lastProgressTime) / 1000;
            const sizeDiff = uploadedSize - lastUploadedSize;
            const speed = timeDiff > 0 ? sizeDiff / timeDiff : 0;
            lastProgressTime = now;
            lastUploadedSize = uploadedSize;

            updateTask(taskId, {
              chunks: currentTask.chunks.map(c => 
                c.index === chunk.index ? { ...c, status: 'completed' as const } : c
              ),
              uploadedChunks: newUploadedChunks,
              uploadedSize,
              progress,
              uploadSpeed: speed,
            });

            // 保存进度
            await saveProgress(fileHash, { 
              uploadedChunks: Array.from(newUploadedChunks), 
              fileHash 
            });
          }
        } else {
          // 上传失败，重试
          const currentTask = tasks.get(taskId);
          if (currentTask) {
            const updatedChunks = currentTask.chunks.map(c => {
              if (c.index === chunk.index) {
                const newRetryCount = c.retryCount + 1;
                if (newRetryCount >= MAX_RETRIES) {
                  return { ...c, status: 'error' as const, error: result.error, retryCount: newRetryCount };
                }
                return { ...c, status: 'pending' as const, retryCount: newRetryCount };
              }
              return c;
            });
            
            updateTask(taskId, { chunks: updatedChunks });

            // 如果还有重试机会，重新加入队列
            const chunkInfo = updatedChunks.find(c => c.index === chunk.index);
            if (chunkInfo && chunkInfo.status === 'pending') {
              queueIndex--; // 重新处理这个分片
            }
          }
        }

        runningCount--;
      }
    };

    // 开始并发上传
    await Promise.all([...Array(MAX_CONCURRENT)].map(() => processQueue()));

    // 检查是否全部完成
    const currentTask = tasks.get(taskId);
    if (currentTask && !pausedRef.current.has(taskId)) {
      const allCompleted = currentTask.chunks.every(c => c.status === 'completed');
      const hasError = currentTask.chunks.some(c => c.status === 'error');

      if (allCompleted) {
        // 合并分片
        const mergeResult = await mergeChunks(taskId, file, fileHash, totalChunks);
        
        if (mergeResult.success && mergeResult.fileKey && mergeResult.fileUrl) {
          const endTime = Date.now();
          updateTask(taskId, { 
            status: 'completed', 
            progress: 100, 
            endTime,
          });

          // 清除进度缓存
          await clearProgress(fileHash);

          // 添加结果
          const result: UploadResult = {
            id: taskId,
            fileName: file.name,
            fileKey: mergeResult.fileKey,
            fileUrl: mergeResult.fileUrl,
            fileSize: file.size,
            fileType: file.type,
          };
          setResults(prev => [...prev, result]);
        } else {
          updateTask(taskId, { 
            status: 'error', 
            error: mergeResult.error || '合并文件失败' 
          });
        }
      } else if (hasError) {
        updateTask(taskId, { status: 'error', error: '部分分片上传失败' });
      }
    }
  }, [tasks, updateTask, uploadChunk, mergeChunks]);

  // 暂停上传
  const pauseUpload = useCallback((taskId: string) => {
    pausedRef.current.add(taskId);
    
    // 取消所有进行中的请求
    const controllers = abortControllersRef.current.get(taskId);
    if (controllers) {
      controllers.forEach(c => c.abort());
      controllers.length = 0;
    }

    updateTask(taskId, { status: 'paused' });
  }, [updateTask]);

  // 继续上传
  const resumeUpload = useCallback((taskId: string) => {
    startUpload(taskId);
  }, [startUpload]);

  // 取消上传
  const cancelUpload = useCallback(async (taskId: string) => {
    pausedRef.current.add(taskId);
    
    // 取消所有进行中的请求
    const controllers = abortControllersRef.current.get(taskId);
    if (controllers) {
      controllers.forEach(c => c.abort());
    }
    abortControllersRef.current.delete(taskId);

    // 删除任务
    setTasks(prev => {
      const next = new Map(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  // 添加文件并开始上传
  const uploadFiles = useCallback(async (files: FileList | File[]): Promise<UploadResult[]> => {
    const fileArray = Array.from(files);
    const taskIds: string[] = [];

    for (const file of fileArray) {
      const taskId = await addTask(file);
      taskIds.push(taskId);
    }

    // 开始所有任务的上传
    for (const taskId of taskIds) {
      startUpload(taskId);
    }

    // 返回结果（异步，需要等待完成）
    return new Promise(resolve => {
      const checkComplete = () => {
        const allCompleted = taskIds.every(id => {
          const task = tasks.get(id);
          return task?.status === 'completed' || task?.status === 'error';
        });

        if (allCompleted) {
          const taskResults = taskIds
            .map(id => results.find(r => r.id === id))
            .filter((r): r is UploadResult => r !== undefined);
          resolve(taskResults);
        } else {
          setTimeout(checkComplete, 500);
        }
      };
      checkComplete();
    });
  }, [addTask, startUpload, tasks, results]);

  // 清理已完成的任务
  const clearCompleted = useCallback(() => {
    setTasks(prev => {
      const next = new Map(prev);
      for (const [id, task] of next) {
        if (task.status === 'completed' || task.status === 'error') {
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  // 获取所有任务
  const getAllTasks = useCallback(() => {
    return Array.from(tasks.values());
  }, [tasks]);

  // 获取进行中的任务数
  const getActiveTaskCount = useCallback(() => {
    return Array.from(tasks.values()).filter(
      t => t.status === 'uploading' || t.status === 'pending'
    ).length;
  }, [tasks]);

  return {
    tasks: getAllTasks(),
    results,
    addTask,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    uploadFiles,
    clearCompleted,
    getActiveTaskCount,
  };
}
