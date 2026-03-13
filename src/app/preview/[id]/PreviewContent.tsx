'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import TransparentVideo from '@/components/ui/transparent-video';

// 辅助函数：将十六进制颜色转换为 rgba
function hexToRgba(hex: string, alpha: number): string {
  let r = 0, g = 0, b = 0;
  
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }
  
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 视频元素组件（支持可见性控制和拖拽）
function VideoElement({ 
  element, 
  style, 
  onClick, 
  onMouseEnter 
}: { 
  element: any; 
  style: React.CSSProperties; 
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // 可见性控制
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const video = container.querySelector('video');
    if (!video) return;

    const playOnVisible = element.playOnVisible !== false;
    const pauseOnHidden = element.pauseOnHidden !== false;

    if (!playOnVisible && !pauseOnHidden) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (playOnVisible && video.paused) {
              video.play().catch(() => {});
            }
          } else {
            if (pauseOnHidden && !video.paused) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [element.playOnVisible, element.pauseOnHidden]);

  // 拖拽功能
  useEffect(() => {
    if (!element.draggable) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [element.draggable, isDragging, position]);

  const draggableStyle: React.CSSProperties = element.draggable ? {
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: isDragging ? 'grabbing' : 'grab',
  } : {};

  return (
    <div 
      ref={containerRef} 
      style={{ ...style, ...draggableStyle }}
    >
      <TransparentVideo
        src={element.src}
        style={{ objectFit: element.objectFit || 'cover', width: '100%', height: '100%' }}
        loop={element.loop ?? false}
        muted={element.muted ?? true}
        autoplay={element.autoplay ?? false}
        controls={element.controls ?? true}
        playsInline
        enableTransparency={element.enableTransparency !== false}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
      />
    </div>
  );
}

// 动态导入全景组件
const PanoramaViewer = dynamic(() => import('@/components/panorama/PanoramaViewer'), {
  loading: () => <div className="w-full h-full bg-zinc-800" />,
  ssr: false,
});

const PanoramaVideoViewer = dynamic(() => import('@/components/panorama/PanoramaVideoViewer'), {
  loading: () => <div className="w-full h-full bg-zinc-800" />,
  ssr: false,
});

// URL 验证函数
function validateVideoUrl(url: string | undefined | null): { isValid: boolean } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: false };
  }
  
  const trimmedUrl = url.trim();
  
  // 检查是否是有效的 URL 格式
  try {
    const urlObj = new URL(trimmedUrl);
    const validProtocols = ['http:', 'https:', 'data:', 'blob:'];
    if (!validProtocols.includes(urlObj.protocol)) {
      return { isValid: false };
    }
    return { isValid: true };
  } catch {
    // 可能是相对路径
    if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./')) {
      return { isValid: true };
    }
    return { isValid: false };
  }
}

// 元素类型定义
interface Element {
  id: string;
  type: string;
  subtype?: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  visible?: boolean;
  text?: string;
  content?: string;  // 文本内容（与 text 兼容）
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  shadow?: string;
  // 锚点位置
  anchorX?: number;
  anchorY?: number;
  anchorPoint?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  // 文字阴影
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  // 文字描边
  textStrokeSize?: number;
  textStrokeColor?: string;
  src?: string;
  alt?: string;
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  controls?: boolean;
  href?: string;
  target?: string;
  events?: Array<{
    trigger: string;
    actions: Array<{
      type: string;
      config: any;
    }>;
  }>;
  parentId?: string | null;
  children?: string[];
  // 热点3D属性
  sphericalPosition?: { phi: number; theta: number };
  // 热点样式
  icon?: string;
  iconColor?: string;
  iconSize?: number;
  scale?: number;
  // 视频透明通道
  enableTransparency?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

// 场景类型定义
interface Scene {
  id: string;
  name: string;
  backgroundColor?: string;
  panoramaImage?: string;
  panoramaVideo?: string;
  elements: Element[];
  transition?: string;
  previewEnabled?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
}

// 事件执行器
const executeActions = async (
  actions: Array<{ type: string; config: any }>,
  context: {
    setCurrentSceneId: (id: string) => void;
    scenes: Scene[];
    elements: Element[];
    updateElements: (elements: Element[]) => void;
    sceneContainerRef: React.RefObject<HTMLDivElement | null>;
  }
) => {
  for (const action of actions) {
    switch (action.type) {
      case 'jumpScene':
        context.setCurrentSceneId(action.config.sceneId);
        break;
      case 'showElement':
        context.updateElements(
          context.elements.map(el =>
            el.id === action.config.elementId ? { ...el, visible: true } : el
          )
        );
        break;
      case 'hideElement':
        context.updateElements(
          context.elements.map(el =>
            el.id === action.config.elementId ? { ...el, visible: false } : el
          )
        );
        break;
      case 'toggleElement':
        context.updateElements(
          context.elements.map(el =>
            el.id === action.config.elementId ? { ...el, visible: !el.visible } : el
          )
        );
        break;
      case 'playAudio':
      case 'playVideo':
        const mediaEl = context.sceneContainerRef.current?.querySelector(
          `#element-${action.config.elementId} audio, #element-${action.config.elementId} video`
        ) as HTMLMediaElement;
        if (mediaEl) {
          try { await mediaEl.play(); } catch (e) { console.error('播放失败:', e); }
        }
        break;
      case 'pauseAudio':
      case 'pauseVideo':
        const pauseMediaEl = context.sceneContainerRef.current?.querySelector(
          `#element-${action.config.elementId} audio, #element-${action.config.elementId} video`
        ) as HTMLMediaElement;
        if (pauseMediaEl) {
          pauseMediaEl.pause();
        }
        break;
      case 'stopMedia':
        const stopMediaEl = context.sceneContainerRef.current?.querySelector(
          `#element-${action.config.elementId} audio, #element-${action.config.elementId} video`
        ) as HTMLMediaElement;
        if (stopMediaEl) {
          stopMediaEl.pause();
          stopMediaEl.currentTime = 0;
        }
        break;
      case 'setVolume':
        const volumeMediaEl = context.sceneContainerRef.current?.querySelector(
          `#element-${action.config.elementId} audio, #element-${action.config.elementId} video`
        ) as HTMLMediaElement;
        if (volumeMediaEl) {
          volumeMediaEl.volume = action.config.volume ?? 1;
        }
        break;
      case 'delay':
        await new Promise(resolve => setTimeout(resolve, action.config.duration || 1000));
        break;
      case 'setOpacity':
        context.updateElements(
          context.elements.map(el =>
            el.id === action.config.elementId ? { ...el, opacity: action.config.opacity } : el
          )
        );
        break;
      default:
        console.log('未知动作类型:', action.type);
    }
  }
};

const handleElementEvent = async (
  event: React.MouseEvent | React.TouchEvent,
  element: Element,
  trigger: string,
  context: {
    setCurrentSceneId: (id: string) => void;
    scenes: Scene[];
    elements: Element[];
    updateElements: (elements: Element[]) => void;
    sceneContainerRef: React.RefObject<HTMLDivElement | null>;
  }
) => {
  const eventConfig = element.events?.find(e => e.trigger === trigger);
  if (eventConfig && eventConfig.actions.length > 0) {
    await executeActions(eventConfig.actions, context);
  }
};

export default function PreviewContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = useParams();
  const projectId = resolvedParams.id as string;
  
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('互动体验');
  
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // 当前场景
  const currentScene = scenes.find(s => s.id === currentSceneId);

  // 加载项目数据
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/public`);
        
        if (!response.ok) {
          throw new Error('项目不存在或未公开');
        }
        
        const data = await response.json();
        const projectData = data.project.projectData;
        
        setProjectName(data.project.name || '互动体验');
        
        if (projectData?.scenes && projectData.scenes.length > 0) {
          // 过滤无效URL
          const cleanedScenes = projectData.scenes.map((scene: Scene) => ({
            ...scene,
            panoramaImage: validateVideoUrl(scene.panoramaImage || '').isValid ? scene.panoramaImage : '',
            panoramaVideo: validateVideoUrl(scene.panoramaVideo || '').isValid ? scene.panoramaVideo : '',
            elements: scene.elements?.map((el: Element) => ({
              ...el,
              src: validateVideoUrl(el.src || '').isValid ? el.src : '',
            })) || [],
          }));
          setScenes(cleanedScenes);
          setCurrentSceneId(cleanedScenes[0].id);
        }
      } catch (err) {
        console.error('加载项目失败:', err);
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // 更新元素
  const updateElements = useCallback((newElements: Element[]) => {
    setScenes(prev => prev.map(scene => 
      scene.id === currentSceneId 
        ? { ...scene, elements: newElements }
        : scene
    ));
  }, [currentSceneId]);

  // 事件上下文
  const eventContext = {
    setCurrentSceneId,
    scenes,
    elements: currentScene?.elements || [],
    updateElements,
    sceneContainerRef,
  };

  // 渲染元素
  const renderElement = (element: Element) => {
    if (element.visible === false) return null;

    // 获取画布尺寸
    const canvasW = currentScene?.canvasWidth || 1920;
    const canvasH = currentScene?.canvasHeight || 1080;

    // 计算锚点偏移（像素）
    let offsetX = 0;
    let offsetY = 0;
    let transformOrigin = '50% 50%';
    
    if (element.anchorX !== undefined && element.anchorY !== undefined) {
      // 新的百分比锚点
      offsetX = (element.anchorX / 100) * element.width;
      offsetY = (element.anchorY / 100) * element.height;
      transformOrigin = `${element.anchorX}% ${element.anchorY}%`;
    } else if (element.anchorPoint) {
      // 旧的预设锚点
      const anchorOffsets: Record<string, { x: number; y: number }> = {
        'top-left': { x: 0, y: 0 },
        'top-center': { x: element.width / 2, y: 0 },
        'top-right': { x: element.width, y: 0 },
        'center-left': { x: 0, y: element.height / 2 },
        'center': { x: element.width / 2, y: element.height / 2 },
        'center-right': { x: element.width, y: element.height / 2 },
        'bottom-left': { x: 0, y: element.height },
        'bottom-center': { x: element.width / 2, y: element.height },
        'bottom-right': { x: element.width, y: element.height },
      };
      const offset = anchorOffsets[element.anchorPoint] || { x: 0, y: 0 };
      offsetX = offset.x;
      offsetY = offset.y;
      // 计算对应的 transformOrigin
      const anchorToOrigin: Record<string, string> = {
        'top-left': '0% 0%',
        'top-center': '50% 0%',
        'top-right': '100% 0%',
        'center-left': '0% 50%',
        'center': '50% 50%',
        'center-right': '100% 50%',
        'bottom-left': '0% 100%',
        'bottom-center': '50% 100%',
        'bottom-right': '100% 100%',
      };
      transformOrigin = anchorToOrigin[element.anchorPoint] || '50% 50%';
    }

    // 将像素值转换为百分比（减去锚点偏移）
    const xPercent = ((element.x - offsetX) / canvasW) * 100;
    const yPercent = ((element.y - offsetY) / canvasH) * 100;
    const widthPercent = (element.width / canvasW) * 100;
    const heightPercent = (element.height / canvasH) * 100;

    // 图片和透明视频需要透明背景
    const needsTransparentBg = element.type === 'image' || 
      (element.type === 'video' && element.enableTransparency !== false);

    // 计算背景颜色（带透明度）
    const getBackgroundColor = () => {
      if (needsTransparentBg) return 'transparent';
      const bgColor = element.backgroundColor || 'transparent';
      const bgOpacity = element.backgroundOpacity ?? 1;
      if (bgColor === 'transparent' || bgOpacity === 0) return 'transparent';
      if (bgOpacity === 1) return bgColor;
      return hexToRgba(bgColor, bgOpacity);
    };

    // 计算文字阴影
    const textShadow = element.shadowColor && element.shadowColor !== 'transparent' 
      ? `${element.shadowOffsetX || 0}px ${element.shadowOffsetY || 0}px ${element.shadowBlur || 0}px ${element.shadowColor}`
      : undefined;

    // 计算文字描边
    const textStroke = element.textStrokeSize && element.textStrokeSize > 0
      ? `${element.textStrokeSize}px ${element.textStrokeColor || '#000000'}`
      : undefined;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${xPercent}%`,
      top: `${yPercent}%`,
      width: `${widthPercent}%`,
      height: `${heightPercent}%`,
      transform: `rotate(${element.rotation || 0}deg) scale(${element.scale || 1})`,
      transformOrigin: transformOrigin,
      opacity: element.opacity ?? 1,
      zIndex: element.zIndex || 1,
      fontSize: `${element.fontSize || 16}px`,
      fontWeight: element.fontWeight || '500',
      fontFamily: element.fontFamily || 'inherit',
      color: element.color || '#ffffff',
      backgroundColor: getBackgroundColor(),
      borderColor: element.borderColor || 'transparent',
      borderRadius: element.borderRadius || 0,
      borderWidth: element.borderWidth || 0,
      borderStyle: element.borderWidth ? (element.borderStyle || 'solid') : 'none',
      boxShadow: element.shadow || 'none',
      overflow: 'hidden',
      cursor: element.events && element.events.length > 0 ? 'pointer' : 'default',
      lineHeight: element.lineHeight || 1.5,
      textAlign: element.textAlign || 'center',
      padding: element.type === 'text' ? '8px' : undefined,
      textShadow: textShadow,
      WebkitTextStroke: textStroke,
    };

    const handleClick = (e: React.MouseEvent) => {
      handleElementEvent(e, element, 'click', eventContext);
    };

    const handleMouseEnter = (e: React.MouseEvent) => {
      handleElementEvent(e, element, 'hover', eventContext);
    };

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            id={`element-${element.id}`}
            style={{
              ...style,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign === 'left' ? 'flex-start' : element.textAlign === 'right' ? 'flex-end' : 'center',
            }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
          >
            <span style={{ width: '100%', textAlign: element.textAlign || 'center' }}>
              {element.content || element.text || ''}
            </span>
          </div>
        );

      case 'button':
        return (
          <button
            key={element.id}
            id={`element-${element.id}`}
            style={{ ...style, cursor: 'pointer' }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
          >
            {element.content || element.text || '按钮'}
          </button>
        );

      case 'image':
        return element.src ? (
          <img
            key={element.id}
            id={`element-${element.id}`}
            src={element.src}
            alt={element.alt || ''}
            style={{ ...style, objectFit: element.objectFit || 'cover', backgroundColor: 'transparent' }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
          />
        ) : null;

      case 'video':
        return element.src ? (
          <VideoElement
            key={element.id}
            element={element}
            style={style}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
          />
        ) : null;

      case 'audio':
        return element.src ? (
          <audio
            key={element.id}
            id={`element-${element.id}`}
            src={element.src}
            loop={element.loop ?? false}
            autoPlay={element.autoplay ?? false}
            style={{ display: 'none' }}
          />
        ) : null;

      case 'shape':
        return (
          <div
            key={element.id}
            id={`element-${element.id}`}
            style={style}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
          />
        );

      case 'hotspot':
        // 热点在2D预览中显示
        const hotspotBgColor = element.backgroundColor || 'rgba(139, 92, 246, 0.8)';
        const hotspotBgOpacity = element.backgroundOpacity ?? 1;
        const hotspotFinalBg = hotspotBgOpacity === 1 ? hotspotBgColor : 
          (hotspotBgColor.startsWith('rgba') ? hotspotBgColor : hexToRgba(hotspotBgColor, hotspotBgOpacity));
        return (
          <div
            key={element.id}
            id={`element-${element.id}`}
            style={{
              ...style,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: hotspotFinalBg,
              borderRadius: '50%',
              cursor: 'pointer',
            }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
          >
            {element.icon ? (
              <span style={{ fontSize: `${element.iconSize || 24}px` }}>
                {element.icon}
              </span>
            ) : (
              <span style={{ color: element.iconColor || '#fff', fontSize: `${element.iconSize || 14}px` }}>
                {element.text || '▶'}
              </span>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">加载项目中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <p className="text-zinc-500">该项目可能未公开或已被删除</p>
        </div>
      </div>
    );
  }

  // 空状态
  if (scenes.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-400">暂无内容</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* 项目标题 */}
      <div className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur px-4 py-2 rounded-lg">
        <h1 className="text-white font-medium">{projectName}</h1>
      </div>

      {/* 场景容器 */}
      <div
        ref={sceneContainerRef}
        className="relative w-full h-full"
        style={{
          backgroundColor: currentScene?.backgroundColor || '#1a1a2e',
          aspectRatio: `${currentScene?.canvasWidth || 1920} / ${currentScene?.canvasHeight || 1080}`,
        }}
      >
        {/* 全景背景 */}
        {currentScene?.panoramaVideo ? (
          <PanoramaVideoViewer
            videoUrl={currentScene.panoramaVideo}
          />
        ) : currentScene?.panoramaImage ? (
          <PanoramaViewer
            imageUrl={currentScene.panoramaImage}
            autoRotate={true}
          />
        ) : null}

        {/* 2D元素层 */}
        <div className="absolute inset-0 pointer-events-none">
          {currentScene?.elements.map(element => (
            <div key={element.id} className="pointer-events-auto">
              {renderElement(element)}
            </div>
          ))}
        </div>
      </div>

      {/* 场景切换指示器 */}
      {scenes.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
          {scenes.map(scene => (
            <button
              key={scene.id}
              onClick={() => setCurrentSceneId(scene.id)}
              className={`w-3 h-3 rounded-full transition-all ${
                scene.id === currentSceneId
                  ? 'bg-purple-500 scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
