/**
 * 分享功能工具
 * 
 * 支持作品分享和邀请好友
 */

import { config, getApiBaseUrl } from './api-config';

/**
 * 获取在线版基础 URL
 */
export function getWebBaseUrl(): string {
  // 1. 桌面版：使用 Electron 注入的配置
  if (typeof window !== 'undefined' && (window as any).electronConfig) {
    return (window as any).electronConfig.webUrl || '';
  }
  
  // 2. 环境变量
  if (process.env.NEXT_PUBLIC_WEB_URL) {
    return process.env.NEXT_PUBLIC_WEB_URL;
  }
  
  // 3. 在线版：使用当前域名
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return '';
}

/**
 * 生成作品分享链接
 * @param shareCode 作品分享码
 * @returns 分享链接
 */
export function getShareLink(shareCode: string): string {
  const baseUrl = getWebBaseUrl();
  return `${baseUrl}/share/${shareCode}`;
}

/**
 * 生成邀请链接
 * @param inviteCode 邀请码
 * @returns 邀请链接
 */
export function getInviteLink(inviteCode: string): string {
  const baseUrl = getWebBaseUrl();
  return `${baseUrl}/invite/${inviteCode}`;
}

/**
 * 分享到微信（复制链接）
 */
export async function shareToWechat(title: string, link: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(`${title}\n${link}`);
    return true;
  } catch (e) {
    console.error('复制失败:', e);
    return false;
  }
}

/**
 * 分享到微博
 */
export function shareToWeibo(title: string, link: string, image?: string): string {
  const url = new URL('https://service.weibo.com/share/share.php');
  url.searchParams.set('title', title);
  url.searchParams.set('url', link);
  if (image) {
    url.searchParams.set('pic', image);
  }
  return url.toString();
}

/**
 * 分享到 QQ
 */
export function shareToQQ(title: string, link: string, description: string, image?: string): string {
  const url = new URL('https://connect.qq.com/widget/shareqq/index.html');
  url.searchParams.set('title', title);
  url.searchParams.set('url', link);
  url.searchParams.set('desc', description);
  if (image) {
    url.searchParams.set('pics', image);
  }
  return url.toString();
}

/**
 * 原生分享（移动端）
 */
export async function nativeShare(data: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (e) {
      // 用户取消或分享失败
      return false;
    }
  }
  return false;
}

/**
 * 下载二维码
 */
export async function downloadQRCode(link: string, filename: string): Promise<void> {
  // 使用 QRCode 库生成二维码
  const QRCode = (await import('qrcode')).default;
  const dataUrl = await QRCode.toDataURL(link, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
  
  // 下载
  const link_el = document.createElement('a');
  link_el.href = dataUrl;
  link_el.download = `${filename}.png`;
  link_el.click();
}

/**
 * 分享信息
 */
export interface ShareInfo {
  title: string;
  description: string;
  coverImage?: string;
  shareCode: string;
}

/**
 * 格式化分享信息
 */
export function formatShareMessage(info: ShareInfo): string {
  return `【${info.title}】\n${info.description}\n\n体验地址：${getShareLink(info.shareCode)}`;
}
