/**
 * API 配置
 * 
 * 在线版：API 在同一服务器，使用相对路径
 * 桌面版：API 在远程服务器，需要配置完整 URL
 */

// 检测是否在 Electron 环境
export function isElectron(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).electronAPI !== 'undefined';
}

// 获取 API 基础 URL
export function getApiBaseUrl(): string {
  // 1. 桌面版：使用 Electron 注入的配置
  if (typeof window !== 'undefined' && (window as any).electronConfig) {
    return (window as any).electronConfig.apiUrl || '';
  }
  
  // 2. 环境变量配置
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 3. 在线版使用相对路径
  return '';
}

// 获取完整 API URL
export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

// 配置信息
export const config = {
  // API 基础 URL
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
  
  // 是否是桌面版
  get isDesktop() {
    return isElectron();
  },
  
  // 在线版 URL（用于桌面版跳转等）
  get webUrl() {
    if (typeof window !== 'undefined' && (window as any).electronConfig) {
      return (window as any).electronConfig.webUrl || '';
    }
    return process.env.NEXT_PUBLIC_WEB_URL || '';
  },
  
  // 是否支持离线模式
  get offlineMode() {
    return isElectron();
  },
};

// 导出便捷方法
export const api = {
  get: async <T>(path: string, options?: RequestInit): Promise<T> => {
    const url = getApiUrl(path);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    
    // 添加认证 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers,
    });
    return response.json();
  },
  
  post: async <T>(path: string, body?: any, options?: RequestInit): Promise<T> => {
    const url = getApiUrl(path);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    
    // 添加认证 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
  },
  
  put: async <T>(path: string, body?: any, options?: RequestInit): Promise<T> => {
    const url = getApiUrl(path);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    
    // 添加认证 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
  },
  
  delete: async <T>(path: string, options?: RequestInit): Promise<T> => {
    const url = getApiUrl(path);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    
    // 添加认证 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      headers,
    });
    return response.json();
  },
};

// 客户端日志
if (typeof window !== 'undefined') {
  console.log('[API Config]', {
    apiBaseUrl: getApiBaseUrl() || '(relative)',
    isDesktop: isElectron(),
  });
}
