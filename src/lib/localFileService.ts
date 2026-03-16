/**
 * 本地文件服务
 * 
 * 自动检测运行环境：
 * - Electron 环境：直接读取本地文件，秒级导入
 * - 浏览器环境：使用分片上传到服务器
 */

// 类型定义
export interface LocalFile {
  path: string;
  name: string;
  size: number;
  ext: string;
  type: 'video' | 'image' | 'audio' | 'file';
}

export interface ImportResult {
  success: boolean;
  url: string;
  name: string;
  size: number;
  type: 'video' | 'image' | 'audio';
  isLocal?: boolean; // 是否是本地文件（Electron 环境）
  error?: string;
}

// 检测是否在 Electron 环境中
export function isElectron(): boolean {
  return typeof window !== 'undefined' && 
         typeof (window as any).electronAPI !== 'undefined';
}

/**
 * 选择本地文件
 * 
 * 在 Electron 中：打开系统文件选择器
 * 在浏览器中：触发 input[type=file]
 */
export async function selectLocalFiles(options?: {
  accept?: string;
  multiple?: boolean;
}): Promise<LocalFile[]> {
  const { accept, multiple } = options || {};

  if (isElectron()) {
    // Electron 环境：使用系统文件选择器
    const result = await (window as any).electronAPI.selectFile({
      multiple,
    });

    if (result.canceled) {
      return [];
    }

    return result.files;
  } else {
    // 浏览器环境：使用 input[type=file]
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple || false;
      if (accept) {
        input.accept = accept;
      }

      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files) {
          resolve([]);
          return;
        }

        const localFiles: LocalFile[] = Array.from(files).map(file => ({
          path: (file as any).path || file.name, // 浏览器中 path 不可用
          name: file.name,
          size: file.size,
          ext: '.' + file.name.split('.').pop()?.toLowerCase(),
          type: getMediaType(file.type),
        }));

        resolve(localFiles);
      };

      input.click();
    });
  }
}

/**
 * 导入文件
 * 
 * Electron：直接返回本地文件 URL（秒级）
 * 浏览器：上传到服务器
 */
export async function importFile(
  file: LocalFile | File,
  onProgress?: (progress: number) => void
): Promise<ImportResult> {
  // Electron 环境
  if (isElectron() && 'path' in file && file.path) {
    return importLocalFile(file as LocalFile);
  }

  // 浏览器环境：上传
  return uploadFile(file as File, onProgress);
}

/**
 * 导入本地文件（Electron 专用）
 * 秒级导入，无需上传
 */
async function importLocalFile(file: LocalFile): Promise<ImportResult> {
  try {
    // 获取本地文件 URL
    const result = await (window as any).electronAPI.readFile(file.path, {
      asUrl: true,
    });

    if (!result.success) {
      return {
        success: false,
        url: '',
        name: file.name,
        size: file.size,
        type: file.type as any,
        error: result.error,
      };
    }

    return {
      success: true,
      url: result.url,
      name: file.name,
      size: file.size,
      type: file.type as any,
      isLocal: true, // 标记为本地文件
    };
  } catch (error: any) {
    return {
      success: false,
      url: '',
      name: file.name,
      size: file.size,
      type: file.type as any,
      error: error.message,
    };
  }
}

/**
 * 上传文件到服务器（浏览器环境）
 */
async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImportResult> {
  try {
    // 使用分片上传
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    // 监听进度
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    const result = await new Promise<any>((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.ontimeout = () => reject(new Error('上传超时'));

      xhr.open('POST', '/api/upload');
      xhr.timeout = 10 * 60 * 1000;
      xhr.send(formData);
    });

    if (result.success && result.url) {
      return {
        success: true,
        url: result.url,
        name: file.name,
        size: file.size,
        type: getMediaType(file.type) as any,
        isLocal: false,
      };
    } else {
      return {
        success: false,
        url: '',
        name: file.name,
        size: file.size,
        type: getMediaType(file.type) as any,
        error: result.error || '上传失败',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      url: '',
      name: file.name,
      size: file.size,
      type: getMediaType(file.type) as any,
      error: error.message,
    };
  }
}

/**
 * 批量导入文件
 */
export async function importFiles(
  files: (LocalFile | File)[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await importFile(files[i], (progress) => {
      onProgress?.(i, progress);
    });
    results.push(result);
  }

  return results;
}

/**
 * 检查文件是否可访问（仅 Electron）
 */
export async function checkFileAccessible(filePath: string): Promise<boolean> {
  if (!isElectron()) return false;

  try {
    const result = await (window as any).electronAPI.readFile(filePath, { asUrl: true });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * 获取媒体类型
 */
function getMediaType(mimeType: string): 'video' | 'image' | 'audio' | 'file' {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

// 导出环境检测 Hook
export function useEnvironment() {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    setIsDesktop(isElectron());
  }, []);

  return {
    isDesktop,      // Electron 桌面应用
    isBrowser: !isDesktop, // 在线浏览器
  };
}

// 需要导入 React
import React from 'react';
