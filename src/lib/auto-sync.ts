/**
 * 自动云同步服务
 * 登录后自动将本地项目同步到云端
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { indexedDBStorage, ProjectData } from './storage';

// 同步状态
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
  pendingCount: number;
}

// 同步事件监听器
type SyncListener = (status: SyncStatus) => void;
const listeners: Set<SyncListener> = new Set();

// 当前同步状态
let currentStatus: SyncStatus = {
  isSyncing: false,
  lastSyncTime: null,
  error: null,
  pendingCount: 0,
};

/**
 * 获取同步状态
 */
export function getSyncStatus(): SyncStatus {
  return { ...currentStatus };
}

/**
 * 订阅同步状态变化
 */
export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * 更新状态并通知监听器
 */
function updateStatus(updates: Partial<SyncStatus>): void {
  currentStatus = { ...currentStatus, ...updates };
  listeners.forEach(listener => listener(currentStatus));
}

/**
 * 检查用户是否已登录
 */
export async function isLoggedIn(): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  try {
    const supabase = getSupabaseClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * 自动同步单个项目到云端
 * 登录后调用此函数自动上传本地项目
 */
export async function syncProjectToCloud(project: ProjectData): Promise<{ success: boolean; cloudId?: string; error?: string }> {
  try {
    updateStatus({ isSyncing: true, error: null });

    const token = localStorage.getItem('auth_token');
    if (!token) {
      updateStatus({ isSyncing: false, error: '未登录' });
      return { success: false, error: '未登录' };
    }

    const supabase = getSupabaseClient(token);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      updateStatus({ isSyncing: false, error: '未登录' });
      return { success: false, error: '未登录' };
    }

    // 检查云端是否已有此项目（通过本地ID匹配）
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .contains('project_data', { localId: project.id })
      .single();

    const projectData = {
      ...project,
      localId: project.id, // 保存本地ID用于匹配
    };

    if (existingProject) {
      // 更新现有项目
      const { error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          description: project.description,
          project_data: projectData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProject.id);

      if (error) {
        throw new Error(error.message);
      }

      updateStatus({ isSyncing: false, lastSyncTime: Date.now() });
      return { success: true, cloudId: existingProject.id };
    } else {
      // 创建新项目
      const shareCode = Math.random().toString(36).substring(2, 10).toLowerCase();

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: project.name,
          description: '',
          project_data: projectData,
          is_public: false,
          share_code: shareCode,
          view_count: 0,
          like_count: 0,
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      updateStatus({ isSyncing: false, lastSyncTime: Date.now() });
      return { success: true, cloudId: newProject.id };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '同步失败';
    updateStatus({ isSyncing: false, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * 同步所有本地项目到云端
 */
export async function syncAllProjects(): Promise<{ success: number; failed: number; errors: string[] }> {
  const result = { success: 0, failed: 0, errors: [] as string[] };

  try {
    updateStatus({ isSyncing: true, error: null });

    // 获取所有本地项目
    const projects = await indexedDBStorage.getAllProjects();
    updateStatus({ pendingCount: projects.length });

    // 逐个同步
    for (const project of projects) {
      const syncResult = await syncProjectToCloud(project);
      if (syncResult.success) {
        result.success++;
      } else {
        result.failed++;
        result.errors.push(`${project.name}: ${syncResult.error}`);
      }
      updateStatus({ pendingCount: projects.length - result.success - result.failed });
    }

    updateStatus({ 
      isSyncing: false, 
      lastSyncTime: Date.now(),
      pendingCount: 0,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '同步失败';
    updateStatus({ isSyncing: false, error: errorMessage });
    result.errors.push(errorMessage);
    return result;
  }
}

/**
 * 自动同步钩子
 * 在保存项目时调用，自动判断是否需要同步到云端
 */
export async function autoSyncOnSave(project: ProjectData): Promise<void> {
  const loggedIn = await isLoggedIn();
  
  if (loggedIn) {
    // 后台静默同步，不阻塞保存
    syncProjectToCloud(project).catch(err => {
      console.error('自动云同步失败:', err);
    });
  }
}

/**
 * 从云端拉取项目到本地
 */
export async function pullFromCloud(): Promise<{ success: number; failed: number }> {
  const result = { success: 0, failed: 0 };

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return result;

    const supabase = getSupabaseClient(token);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return result;

    // 获取云端项目
    const { data: cloudProjects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id);

    if (error || !cloudProjects) return result;

    // 同步到本地
    for (const cloudProject of cloudProjects) {
      try {
        const localProject: ProjectData = {
          id: cloudProject.project_data?.localId || cloudProject.id,
          name: cloudProject.name,
          description: cloudProject.description || '',
          canvasWidth: cloudProject.project_data?.canvasWidth || 1920,
          canvasHeight: cloudProject.project_data?.canvasHeight || 1080,
          scenes: cloudProject.project_data?.scenes || [],
          globalVariables: cloudProject.project_data?.globalVariables || [],
          createdAt: new Date(cloudProject.created_at).getTime(),
          updatedAt: new Date(cloudProject.updated_at || cloudProject.created_at).getTime(),
        };

        // 检查本地是否已存在
        const existingLocal = await indexedDBStorage.getProject(localProject.id);
        
        // 如果云端更新时间更晚，则更新本地
        if (!existingLocal || localProject.updatedAt > existingLocal.updatedAt) {
          await indexedDBStorage.saveProject(localProject);
          result.success++;
        }
      } catch {
        result.failed++;
      }
    }

    return result;
  } catch {
    return result;
  }
}
