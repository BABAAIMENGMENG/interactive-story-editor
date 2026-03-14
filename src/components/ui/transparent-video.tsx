'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface TransparentVideoProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  enableTransparency?: boolean; // 是否启用透明通道
}

/**
 * 透明视频渲染组件
 * 
 * 支持的透明视频格式：
 * 1. WebM (VP8/VP9 with alpha) - Chrome, Firefox, Edge 支持
 * 2. MOV (ProRes 4444) - Safari 支持，其他浏览器需要转码
 * 
 * 工作原理：
 * - 对于支持透明 WebM 的浏览器，直接使用 <video> 标签
 * - 对于需要特殊处理的视频，使用 Canvas 渲染
 */
export function TransparentVideo({
  src,
  className = '',
  style = {},
  loop = true,
  muted = true,
  autoplay = true,
  controls = false,
  playsInline = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
  objectFit = 'contain',
  enableTransparency = true,
}: TransparentVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const [useCanvas, setUseCanvas] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检测是否需要使用 Canvas 渲染
  const checkTransparencySupport = useCallback(() => {
    if (!enableTransparency) return false;
    
    // 检测视频格式
    const lowerSrc = src.toLowerCase();
    
    // WebM 透明视频 - 大多数现代浏览器支持
    if (lowerSrc.includes('.webm')) {
      // Chrome, Firefox, Edge 原生支持 WebM 透明
      // Safari 14+ 也支持
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        // Safari 需要检查版本
        const version = parseFloat(
          navigator.userAgent.match(/version\/(\d+\.?\d*)/i)?.[1] || '0'
        );
        if (version < 14) {
          return true; // 旧版 Safari 需要降级处理
        }
      }
      return false; // 原生支持
    }
    
    // MOV 透明视频 - Safari 支持，其他浏览器需要转码
    if (lowerSrc.includes('.mov') || lowerSrc.includes('.mp4')) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        return false; // Safari 原生支持 MOV 透明
      }
      // 其他浏览器可能需要 Canvas 处理
      // 但实际上大多数浏览器不支持 MOV 透明，建议转码为 WebM
      return true;
    }
    
    return false;
  }, [src, enableTransparency]);

  // Canvas 渲染循环
  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.paused || video.ended) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清除画布（保持透明）
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制视频帧
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 继续渲染
    animationRef.current = requestAnimationFrame(renderFrame);
  }, []);

  // 初始化
  useEffect(() => {
    const needsCanvas = checkTransparencySupport();
    setUseCanvas(needsCanvas);
  }, [checkTransparencySupport]);

  // 视频加载处理
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video) return;
    
    // 设置 Canvas 尺寸
    if (canvas && useCanvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    setIsLoaded(true);
  }, [useCanvas]);

  // 视频播放处理
  const handlePlay = useCallback(() => {
    if (useCanvas) {
      renderFrame();
    }
  }, [useCanvas, renderFrame]);

  // 视频暂停/结束处理
  const handlePauseOrEnd = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // 错误处理
  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const errorCode = video?.error?.code;
    const errorMessage = video?.error?.message;
    console.error('[TransparentVideo] 视频加载失败:', { 
      src: src?.substring(0, 100), 
      errorCode, 
      errorMessage 
    });
    setError('视频加载失败: ' + (errorMessage || '未知错误'));
  }, [src]);

  // 清理
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 容器样式
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    ...style,
  };

  // 视频样式（用于 Canvas 模式时隐藏视频）
  const videoStyle: React.CSSProperties = {
    position: useCanvas ? 'absolute' : 'relative',
    width: '100%',
    height: '100%',
    objectFit,
    opacity: useCanvas ? 0 : 1,
    pointerEvents: useCanvas ? 'none' : 'auto',
    backgroundColor: 'transparent',
  };

  // Canvas 样式
  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit,
    pointerEvents: 'none',
    backgroundColor: 'transparent',
  };

  if (error) {
    return (
      <div className={className} style={containerStyle}>
        <div className="w-full h-full flex items-center justify-center bg-zinc-800/50 text-zinc-400 text-sm">
          视频加载失败
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={className} 
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 视频元素 */}
      <video
        ref={videoRef}
        src={src}
        style={videoStyle}
        loop={loop}
        muted={muted}
        autoPlay={autoplay}
        playsInline={playsInline}
        controls={!useCanvas && controls}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePauseOrEnd}
        onEnded={handlePauseOrEnd}
        onError={handleError}
      />
      
      {/* Canvas 叠加层（仅 Canvas 模式使用） */}
      {useCanvas && (
        <canvas
          ref={canvasRef}
          style={canvasStyle}
        />
      )}
      
      {/* 加载状态 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default TransparentVideo;
