'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'canceled' | 'expired';
  projectsCount: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 用于存储 session token
let sessionToken: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 恢复 session
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      sessionToken = storedToken;
    }
  }, []);

  const fetchUser = async () => {
    try {
      const headers: HeadersInit = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      
      const response = await fetch('/api/auth/me', { headers });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        sessionToken = null;
        localStorage.removeItem('auth_token');
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    console.log('signUp called', { email, name });
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      console.log('signUp response:', data);

      if (!response.ok) {
        return { error: data.error || '注册失败' };
      }

      // 存储 session token
      if (data.session?.access_token) {
        sessionToken = data.session.access_token;
        localStorage.setItem('auth_token', data.session.access_token);
      }

      setUser(data.user);
      return {};
    } catch (err) {
      console.error('signUp error:', err);
      return { error: '网络错误，请重试' };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('signIn called', { email });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('signIn response:', data);

      if (!response.ok) {
        return { error: data.error || '登录失败' };
      }

      // 存储 session token
      if (data.session?.access_token) {
        const token = data.session.access_token;
        sessionToken = token;
        localStorage.setItem('auth_token', token);
      }

      setUser(data.user);
      return {};
    } catch (err) {
      console.error('signIn error:', err);
      return { error: '网络错误，请重试' };
    }
  };

  const signOut = async () => {
    try {
      const headers: HeadersInit = {};
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers 
      });
    } finally {
      setUser(null);
      sessionToken = null;
      localStorage.removeItem('auth_token');
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 导出获取 token 的函数，供 API 调用使用
export function getAuthToken() {
  return sessionToken;
}
