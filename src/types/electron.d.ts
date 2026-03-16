/**
 * Electron API 类型声明
 */

interface ElectronAPI {
  isElectron: () => Promise<boolean>;
  selectFile: (options?: {
    filters?: Array<{ name: string; extensions: string[] }>;
    multiple?: boolean;
  }) => Promise<{
    canceled: boolean;
    files: Array<{
      path: string;
      name: string;
      size: number;
      ext: string;
      type: 'video' | 'image' | 'audio' | 'file';
    }>;
  }>;
  readFile: (filePath: string, options?: {
    asUrl?: boolean;
    maxSize?: number;
  }) => Promise<{
    success: boolean;
    url?: string;
    data?: string;
    name?: string;
    size?: number;
    error?: string;
  }>;
  hashFile: (filePath: string) => Promise<{
    success: boolean;
    hash?: string;
    size?: number;
    error?: string;
  }>;
  getThumbnail: (filePath: string, timestamp?: number) => Promise<{
    success: boolean;
    thumbnail?: string;
    error?: string;
  }>;
  saveProject: (projectData: any, defaultPath?: string) => Promise<{
    canceled: boolean;
    path?: string;
    error?: string;
  }>;
  openProject: () => Promise<{
    canceled: boolean;
    path?: string;
    data?: any;
    error?: string;
  }>;
  onMenuNewProject: (callback: () => void) => () => void;
  onMenuOpenProject: (callback: (filePath: string) => void) => () => void;
  onMenuSaveProject: (callback: () => void) => () => void;
  onMenuExportProject: (callback: () => void) => () => void;
}

interface Platform {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  version: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    platform: Platform;
  }
}

export {};
