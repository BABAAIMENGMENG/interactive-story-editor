import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

/**
 * 获取 Supabase 凭据
 * 
 * 支持两种方式：
 * 1. 服务端：使用 COZE_SUPABASE_URL 和 COZE_SUPABASE_ANON_KEY
 * 2. 客户端：使用 NEXT_PUBLIC_COZE_SUPABASE_URL 和 NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY
 */
function getSupabaseCredentials(): SupabaseCredentials {
  // 优先使用环境变量
  const url = 
    process.env.COZE_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_COZE_SUPABASE_URL;
    
  const anonKey = 
    process.env.COZE_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // 如果在服务端且没有环境变量，尝试从全局配置获取
    if (typeof window === 'undefined') {
      try {
        // 服务端可能有全局配置
        const globalConfig = (globalThis as any).__COZE_CONFIG__;
        if (globalConfig?.supabase) {
          return {
            url: globalConfig.supabase.url,
            anonKey: globalConfig.supabase.anonKey,
          };
        }
      } catch {
        // Ignore
      }
    }

    throw new Error(
      'Supabase 配置未找到。请确保以下环境变量已设置：\n' +
      '- 服务端：COZE_SUPABASE_URL, COZE_SUPABASE_ANON_KEY\n' +
      '- 客户端：NEXT_PUBLIC_COZE_SUPABASE_URL, NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY'
    );
  }

  return { url, anonKey };
}

/**
 * 获取 Supabase 客户端
 * @param token 可选的用户认证令牌
 */
function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  if (token) {
    return createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient(url, anonKey, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { getSupabaseCredentials, getSupabaseClient };
