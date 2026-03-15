/**
 * 短信验证码存储和验证工具
 * 生产环境应使用 Redis 等持久化存储
 */

// 验证码存储结构
interface CodeData {
  code: string;
  expires: number;
}

// 内存存储（生产环境应使用 Redis）
const codeStore = new Map<string, CodeData>();

// 开发模式固定验证码
const DEV_MODE = process.env.NODE_ENV === 'development';
const DEV_CODE = '123456';

/**
 * 存储验证码
 */
export function storeCode(phone: string, code?: string): string {
  const actualCode = code || (DEV_MODE ? DEV_CODE : generateCode());
  
  codeStore.set(phone, {
    code: actualCode,
    expires: Date.now() + 5 * 60 * 1000, // 5分钟有效期
  });
  
  return actualCode;
}

/**
 * 验证验证码
 */
export function verifyStoredCode(phone: string, code: string): boolean {
  const stored = codeStore.get(phone);
  
  if (!stored) {
    // 开发模式下允许固定验证码
    if (DEV_MODE && code === DEV_CODE) {
      return true;
    }
    return false;
  }
  
  // 检查是否过期
  if (Date.now() > stored.expires) {
    codeStore.delete(phone);
    return false;
  }
  
  // 验证成功后删除
  if (stored.code === code) {
    codeStore.delete(phone);
    return true;
  }
  
  return false;
}

/**
 * 生成随机6位验证码
 */
function generateCode(): string {
  return Math.random().toString().slice(2, 8);
}

/**
 * 清理过期验证码
 */
export function cleanupExpiredCodes(): void {
  const now = Date.now();
  for (const [phone, data] of codeStore.entries()) {
    if (now > data.expires) {
      codeStore.delete(phone);
    }
  }
}

/**
 * 是否为开发模式
 */
export function isDevMode(): boolean {
  return DEV_MODE;
}

/**
 * 获取开发模式验证码
 */
export function getDevCode(): string {
  return DEV_CODE;
}
