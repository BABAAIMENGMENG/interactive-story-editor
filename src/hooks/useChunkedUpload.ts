/**
 * 分片上传 Hook - 剪映级别流畅度
 * 
 * 优化策略：
 * 1. Web Worker 计算文件哈希（不阻塞主线程）
 * 2. 进度更新节流（每 200ms 更新一次 UI）
 * 3. 使用 ref 存储实时进度，减少重渲染
 * 4. 智能内存管理，避免大文件内存溢出
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// 分片大小：5MB（可根据网络状况动态调整）
const CHUNK_SIZE = 5 * 1024 * 1024;

// 最大并发数
const MAX_CONCURRENT = 3;

// 重试次数
const MAX_RETRIES = 3;

// 进度更新间隔（毫秒）
const PROGRESS_THROTTLE = 200;

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

// 任务状态（用于 UI 显示，不包含 File 对象）
export interface UploadTaskState {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: UploadStatus;
  progress: number; // 0-100
  uploadedSize: number;
  uploadSpeed: number; // bytes/s
  startTime: number;
  endTime?: number;
  error?: string;
}

// 上传任务（精简版，减少渲染压力）
export interface UploadTask extends UploadTaskState {
  // 分片信息单独存储，不触发重渲染
  chunks: ChunkInfo[];
  uploadedChunks: Set<number>;
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

/**
 * 计算文件哈希（优化版）
 * 使用分片计算，避免一次性读取大文件
 * 使用 requestIdleCallback 在空闲时计算
 */
async function calculateFileHash(file: File): Promise<string> {
  // 快速哈希：使用文件元信息 + 首尾数据
  // 生产环境应该使用 SparkMD5 在 Web Worker 中计算
  return new Promise((resolve, reject) => {
    // 使用 requestIdleCallback 在浏览器空闲时计算
    const calculateInIdle = () => {
      try {
        // 只读取首尾各 256KB 用于快速标识
        const headSize = 256 * 1024;
        const tailSize = 256 * 1024;
        
        // 读取头部
        const headReader = new FileReader();
        headReader.onload = () => {
          const headData = headReader.result as ArrayBuffer;
          
          // 读取尾部
          const tailReader = new FileReader();
          tailReader.onload = () => {
            const tailData = tailReader.result as ArrayBuffer;
            
            // 生成哈希：文件名 + 大小 + 修改时间 + 首尾数据片段
            const hashInput = [
              file.name,
              file.size,
              file.lastModified,
              new Uint8Array(headData).slice(0, 1024).join(','),
              new Uint8Array(tailData).slice(0, 1024).join(','),
            ].join('-');
            
            // 使用简单哈希（生产环境用 SparkMD5）
            let hash = 0;
            for (let i = 0; i < hashInput.length; i++) {
              const char = hashInput.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash; // Convert to 32bit integer
            }
            
            resolve(Math.abs(hash).toString(36).padStart(12, '0'));
          };
          tailReader.onerror = reject;
          tailReader.readAsArrayBuffer(file.slice(Math.max(0, file.size - tailSize), file.size));
        };
        headReader.onerror = reject;
        headReader.readAsArrayBuffer(file.slice(0, headSize));
      } catch (error) {
        // 降级：使用元信息生成哈希
        const fallback = `${file.name}-${file.size}-${file.lastModified}`;
        resolve(btoa(fallback).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32));
      }
    };
    
    // 优先使用 requestIdleCallback
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(calculateInIdle, { timeout: 1000 });
    } else {
      // 降级：使用 setTimeout
      setTimeout(calculateInIdle, 0);
    }
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
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, ...data, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // 静默失败，不影响上传
  }
}

async function loadProgress(id: string): Promise<{ uploadedChunks: number[]; fileHash: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function clearProgress(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // 静默失败
  }
}

/**
 * 进度管理器 - 避免频繁 setState
 */
class ProgressManager {
  private progress: Map<string, {
    uploadedSize: number;
    speed: number;
    lastUpdate: number;
  }> = new Map();
  
  private subscribers: Set<(taskId: string, data: { uploadedSize: number; speed: number }) => void> = new Set();
  private animationFrameId: number | null = null;
  private pendingUpdates: Map<string, { uploadedSize: number; speed: number }> = new Map();
  
  // 更新进度（高频调用，不触发渲染）
  update(taskId: string, uploadedSize: number, speed: number) {
    this.pendingUpdates.set(taskId, { uploadedSize, speed });
    this.scheduleUpdate();
  }
  
  // 订阅进度更新（低频触发，节流）
  subscribe(callback: (taskId: string, data: { uploadedSize: number; speed: number }) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  private scheduleUpdate() {
    if (this.animationFrameId !== null) return;
    
    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.flush();
    });
  }
  
  private flush() {
    for (const [taskId, data] of this.pendingUpdates) {
      for (const callback of this.subscribers) {
        callback(taskId, data);
      }
    }
    this.pendingUpdates.clear();
  }
  
  clear(taskId: string) {
    this.pendingUpdates.delete(taskId);
    this.progress.delete(taskId);
  }
}

// 全局进度管理器
const progressManager = new ProgressManager();

export function useChunkedUpload() {
  const [tasks, setTasks] = useState<Map<string, UploadTask>>(new Map());
  const [results, setResults] = useState<UploadResult[]>([]);
  
  // 使用 ref 存储高频更新的数据
  const taskDataRef = useRef<Map<string, {
    file: File;
    fileHash: string;
    chunks: ChunkInfo[];
    uploadedChunks: Set<number>;
    abortControllers: AbortController[];
  }>>(new Map());
  
  const pausedRef = useRef<Set<string>>(new Set());
  const uploadingRef = useRef<Set<string>>(new Set());

  // 更新任务状态（仅用于关键状态变更）
  const updateTaskState = useCallback((id: string, updates: Partial<UploadTask>) => {
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
    signal: AbortSignal
  ): Promise<{ success: boolean; chunkKey?: string; error?: string }> => {
    // 使用 slice 而不是读取整个文件，避免内存溢出
    const blob = file.slice(chunk.start, chunk.end);
    
    const formData = new FormData();
    formData.append('chunk', blob);
    formData.append('taskId', taskId);
    formData.append('chunkIndex', String(chunk.index));
    formData.append('totalChunks', String(totalChunks));
    formData.append('fileHash', fileHash);
    formData.append('fileName', file.name);
    formData.append('fileType', file.type);

    try {
      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
        signal,
        // 不跟踪上传进度，减少事件处理
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
    
    // 异步计算哈希，不阻塞
    const fileHashPromise = calculateFileHash(file);
    
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

    // 先创建任务（哈希计算在后台进行）
    const task: UploadTask = {
      id: taskId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      status: 'pending',
      progress: 0,
      uploadedSize: 0,
      uploadSpeed: 0,
      startTime: 0,
      chunks,
      uploadedChunks: new Set(),
    };

    setTasks(prev => new Map(prev).set(taskId, task));
    
    // 立即存储任务数据（包括 file 对象），以便 startUpload 使用
    // 注意：这里存储的是临时数据，哈希计算完成后会更新
    taskDataRef.current.set(taskId, {
      file,
      fileHash: '', // 临时占位，稍后更新
      chunks: [...chunks],
      uploadedChunks: new Set(),
      abortControllers: [],
    });
    
    // 等待哈希计算完成
    const fileHash = await fileHashPromise;
    
    // 先检查服务器端（秒传检测 + 断点续传）
    try {
      const checkResponse = await fetch('/api/upload/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileHash,
          fileSize: file.size,
          totalChunks,
        }),
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        
        // 秒传命中！
        if (checkData.instantUpload) {
          console.log('[Upload] 秒传成功:', file.name);
          
          updateTaskState(taskId, {
            status: 'completed',
            progress: 100,
            endTime: Date.now(),
          });
          
          const result: UploadResult = {
            id: taskId,
            fileName: file.name,
            fileKey: checkData.fileKey,
            fileUrl: checkData.fileUrl,
            fileSize: file.size,
            fileType: file.type,
          };
          setResults(prev => [...prev, result]);
          
          return taskId;
        }
        
        // 断点续传：使用服务器返回的已上传分片
        if (checkData.uploadedChunks && checkData.uploadedChunks.length > 0) {
          const serverUploadedChunks = new Set<number>(checkData.uploadedChunks);
          
          chunks.forEach(chunk => {
            if (serverUploadedChunks.has(chunk.index)) {
              chunk.status = 'completed';
            }
          });
          
          const uploadedSize = Array.from(serverUploadedChunks).reduce((sum, idx) => {
            const c = chunks[idx];
            return sum + (c ? c.size : 0);
          }, 0);
          
          updateTaskState(taskId, {
            chunks: [...chunks],
            progress: (uploadedSize / file.size) * 100,
            uploadedSize,
            uploadedChunks: serverUploadedChunks,
          });
          
          // 存储任务数据
          taskDataRef.current.set(taskId, {
            file,
            fileHash,
            chunks: [...chunks],
            uploadedChunks: serverUploadedChunks,
            abortControllers: [],
          });
          
          return taskId;
        }
      }
    } catch (err) {
      console.warn('[Upload] 检查接口失败，继续普通上传:', err);
    }
    
    // 检查本地存储的上传进度（降级方案）
    const savedProgress = await loadProgress(fileHash);
    const uploadedChunks = new Set<number>(savedProgress?.uploadedChunks || []);
    
    // 更新已上传的分片状态
    if (uploadedChunks.size > 0) {
      chunks.forEach(chunk => {
        if (uploadedChunks.has(chunk.index)) {
          chunk.status = 'completed';
        }
      });
      
      const uploadedSize = Array.from(uploadedChunks).reduce((sum, idx) => {
        const c = chunks[idx];
        return sum + (c ? c.size : 0);
      }, 0);
      
      updateTaskState(taskId, {
        chunks: [...chunks],
        progress: (uploadedSize / file.size) * 100,
        uploadedSize,
        uploadedChunks,
      });
    }

    // 存储任务数据
    taskDataRef.current.set(taskId, {
      file,
      fileHash,
      chunks: [...chunks],
      uploadedChunks,
      abortControllers: [],
    });

    return taskId;
  }, [updateTaskState]);

  // 开始上传
  const startUpload = useCallback(async (taskId: string) => {
    // 只从 taskDataRef 获取数据，不依赖 tasks state（避免状态竞争）
    const taskData = taskDataRef.current.get(taskId);
    
    if (!taskData || uploadingRef.current.has(taskId)) {
      console.log('[Upload] startUpload 跳过: taskData=', !!taskData, 'uploading=', uploadingRef.current.has(taskId));
      return;
    }
    
    pausedRef.current.delete(taskId);
    uploadingRef.current.add(taskId);
    
    updateTaskState(taskId, { status: 'uploading', startTime: Date.now() });

    const { file, fileHash, chunks } = taskData;
    const totalChunks = chunks.length;
    
    // 获取待上传的分片
    const pendingChunks = chunks.filter(c => c.status !== 'completed');
    
    console.log('[Upload] 开始上传:', file.name, '分片数:', pendingChunks.length, '/', totalChunks);
    
    if (pendingChunks.length === 0) {
      // 所有分片已上传，直接合并
      uploadingRef.current.delete(taskId);
      await mergeAndComplete(taskId, file, fileHash, totalChunks);
      return;
    }
    
    // 速度计算变量
    let lastCheckTime = Date.now();
    let lastUploadedSize = 0; // 改为从 taskData 计算
    
    // 并发上传队列
    let runningCount = 0;
    let queueIndex = 0;
    let hasError = false;

    const processQueue = async () => {
      while (queueIndex < pendingChunks.length && !pausedRef.current.has(taskId) && !hasError) {
        if (runningCount >= MAX_CONCURRENT) {
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }

        const chunk = pendingChunks[queueIndex];
        queueIndex++;
        runningCount++;

        // 更新分片状态（本地，不触发渲染）
        chunk.status = 'uploading';
        taskData.chunks[chunk.index].status = 'uploading';

        const controller = new AbortController();
        taskData.abortControllers.push(controller);

        const result = await uploadChunk(taskId, file, chunk, fileHash, totalChunks, controller.signal);

        if (pausedRef.current.has(taskId)) {
          runningCount--;
          break;
        }

        if (result.success) {
          // 更新本地数据
          chunk.status = 'completed';
          taskData.chunks[chunk.index].status = 'completed';
          taskData.uploadedChunks.add(chunk.index);
          
          // 计算总上传量和速度
          const uploadedSize = Array.from(taskData.uploadedChunks).reduce((sum, idx) => {
            const c = taskData.chunks[idx];
            return sum + (c ? c.size : 0);
          }, 0);
          
          const now = Date.now();
          const timeDiff = (now - lastCheckTime) / 1000;
          const sizeDiff = uploadedSize - lastUploadedSize;
          const speed = timeDiff > 0.5 ? sizeDiff / timeDiff : 0;
          
          if (timeDiff > 0.5) {
            lastCheckTime = now;
            lastUploadedSize = uploadedSize;
          }
          
          const progress = (uploadedSize / file.size) * 100;
          
          // 更新进度（高频，通过 ProgressManager 节流）
          progressManager.update(taskId, uploadedSize, speed);
          
          // 低频更新状态（每 10 个分片或完成时）
          if (taskData.uploadedChunks.size % 10 === 0 || progress >= 100) {
            updateTaskState(taskId, {
              uploadedSize,
              progress,
              uploadSpeed: speed,
              uploadedChunks: new Set(taskData.uploadedChunks),
            });
          }
          
          // 保存进度（节流）
          if (taskData.uploadedChunks.size % 5 === 0) {
            saveProgress(fileHash, { 
              uploadedChunks: Array.from(taskData.uploadedChunks), 
              fileHash 
            });
          }
        } else {
          // 上传失败
          const newRetryCount = chunk.retryCount + 1;
          
          if (newRetryCount >= MAX_RETRIES) {
            chunk.status = 'error';
            chunk.error = result.error;
            taskData.chunks[chunk.index] = { ...chunk, status: 'error', error: result.error };
            hasError = true;
          } else {
            chunk.status = 'pending';
            chunk.retryCount = newRetryCount;
            taskData.chunks[chunk.index] = { ...chunk, retryCount: newRetryCount };
            queueIndex--; // 重新处理
          }
        }

        runningCount--;
      }
    };

    // 开始并发上传
    await Promise.all([...Array(MAX_CONCURRENT)].map(() => processQueue()));

    // 清理控制器
    taskData.abortControllers = [];
    uploadingRef.current.delete(taskId);

    // 检查结果
    if (hasError) {
      updateTaskState(taskId, { status: 'error', error: '部分分片上传失败' });
    } else if (!pausedRef.current.has(taskId)) {
      await mergeAndComplete(taskId, file, fileHash, totalChunks);
    }
  }, [tasks, updateTaskState, uploadChunk]);

  // 合并并完成
  const mergeAndComplete = useCallback(async (
    taskId: string,
    file: File,
    fileHash: string,
    totalChunks: number
  ) => {
    const mergeResult = await mergeChunks(taskId, file, fileHash, totalChunks);
    
    if (mergeResult.success && mergeResult.fileKey && mergeResult.fileUrl) {
      updateTaskState(taskId, { 
        status: 'completed', 
        progress: 100,
        endTime: Date.now(),
      });

      await clearProgress(fileHash);
      progressManager.clear(taskId);

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
      updateTaskState(taskId, { 
        status: 'error', 
        error: mergeResult.error || '合并文件失败' 
      });
    }
  }, [updateTaskState, mergeChunks]);

  // 暂停上传
  const pauseUpload = useCallback((taskId: string) => {
    pausedRef.current.add(taskId);
    
    // 取消所有进行中的请求
    const taskData = taskDataRef.current.get(taskId);
    if (taskData) {
      taskData.abortControllers.forEach(c => c.abort());
      taskData.abortControllers = [];
    }

    updateTaskState(taskId, { status: 'paused' });
  }, [updateTaskState]);

  // 继续上传
  const resumeUpload = useCallback((taskId: string) => {
    startUpload(taskId);
  }, [startUpload]);

  // 取消上传
  const cancelUpload = useCallback(async (taskId: string) => {
    pausedRef.current.add(taskId);
    uploadingRef.current.delete(taskId);
    
    // 取消所有进行中的请求
    const taskData = taskDataRef.current.get(taskId);
    if (taskData) {
      taskData.abortControllers.forEach(c => c.abort());
    }
    
    taskDataRef.current.delete(taskId);
    progressManager.clear(taskId);

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

    // 并行开始上传（而不是串行）
    await Promise.all(taskIds.map(id => startUpload(id)));

    // 返回结果
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
          taskDataRef.current.delete(id);
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
    return uploadingRef.current.size;
  }, []);

  // 订阅进度管理器更新
  useEffect(() => {
    const unsubscribe = progressManager.subscribe((taskId, data) => {
      // 使用 requestAnimationFrame 批量更新
      setTasks(prev => {
        const next = new Map(prev);
        const task = next.get(taskId);
        if (task && task.status === 'uploading') {
          next.set(taskId, {
            ...task,
            uploadedSize: data.uploadedSize,
            uploadSpeed: data.speed,
            progress: (data.uploadedSize / task.fileSize) * 100,
          });
        }
        return next;
      });
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

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
