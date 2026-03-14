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

// 路径点
interface PathPoint {
  id: string;
  x: number;
  y: number;
  controlIn?: { x: number; y: number };
  controlOut?: { x: number; y: number };
}

// 路径动画
interface PathAnimation {
  id: string;
  name: string;
  pathPoints: PathPoint[];
  duration: number;
  easing: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut';
  loopMode: 'none' | 'loop' | 'alternate';
  loopCount?: number;
  autoPlay: boolean;
  delay: number;
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
  // 血条属性
  healthValue?: number;
  maxHealth?: number;
  healthBarColor?: string;
  healthBarBgColor?: string;
  lowHealthThreshold?: number;
  lowHealthColor?: string;
  showHealthText?: boolean;
  healthTriggers?: HealthTrigger[]; // 血量阈值触发器
  // 选择项属性
  isSelected?: boolean;       // 选中状态
  clickActions?: any[]; // 点击时触发的动作序列
  // 路径动画
  pathAnimations?: PathAnimation[];
}

// 血量阈值触发器
interface HealthTrigger {
  id: string;
  threshold: number;    // 血量阈值（百分比，0-100）
  triggerType: 'below' | 'above' | 'equals'; // 触发条件
  actions: any[];
  description?: string;
  triggered?: boolean;  // 是否已触发（运行时状态）
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

// 检测血量触发器的辅助函数
const checkHealthTriggersForElement = (element: Element, newHealth: number, context: any) => {
  const triggers = element.healthTriggers;
  if (!triggers || triggers.length === 0) return;
  
  const maxHealth = element.maxHealth ?? 100;
  const healthPercent = (newHealth / maxHealth) * 100;
  
  triggers.forEach(trigger => {
    // 如果已经触发过，跳过
    if (trigger.triggered) return;
    
    let shouldTrigger = false;
    switch (trigger.triggerType) {
      case 'below':
        shouldTrigger = healthPercent < trigger.threshold;
        break;
      case 'above':
        shouldTrigger = healthPercent > trigger.threshold;
        break;
      case 'equals':
        shouldTrigger = Math.abs(healthPercent - trigger.threshold) < 0.5; // 允许小误差
        break;
    }
    
    if (shouldTrigger && trigger.actions && trigger.actions.length > 0) {
      console.log(`血量触发器触发: ${trigger.triggerType} ${trigger.threshold}%`);
      // 标记为已触发
      if (context.setScenes) {
        context.setScenes((prev: Scene[]) => prev.map(scene => ({
          ...scene,
          elements: scene.elements.map((el: Element) => {
            if (el.id !== element.id) return el;
            const updatedTriggers = (el.healthTriggers || []).map((t: HealthTrigger) =>
              t.id === trigger.id ? { ...t, triggered: true } : t
            );
            return { ...el, healthTriggers: updatedTriggers };
          })
        })));
      }
      // 执行动作（延迟执行避免状态更新冲突）
      setTimeout(() => {
        executeActions(trigger.actions, context);
      }, 10);
    }
  });
};

// 事件执行器
const executeActions = async (
  actions: Array<any>,
  context: {
    setCurrentSceneId: (id: string) => void;
    scenes: Scene[];
    elements: Element[];
    updateElements: (elements: Element[]) => void;
    sceneContainerRef: React.RefObject<HTMLDivElement | null>;
    setScenes?: React.Dispatch<React.SetStateAction<Scene[]>>;
  }
) => {
  for (const action of actions) {
    // 支持两种格式：{ type, config } 和 { type, targetSceneId, ... }
    const actionType = action.type;
    const config = action.config || action;
    
    switch (actionType) {
      case 'addHealth':
        // 加血
        if (config.targetElementId && config.value) {
          const targetEl = context.elements.find(el => el.id === config.targetElementId);
          if (targetEl) {
            const currentHealth = targetEl.healthValue ?? 100;
            const maxHealth = targetEl.maxHealth ?? 100;
            const newHealth = Math.min(maxHealth, currentHealth + config.value);
            context.updateElements(
              context.elements.map(el =>
                el.id === config.targetElementId ? { ...el, healthValue: newHealth } : el
              )
            );
          }
        }
        break;
      case 'reduceHealth':
        // 减血
        if (config.targetElementId && config.value) {
          const targetEl = context.elements.find(el => el.id === config.targetElementId);
          if (targetEl) {
            const currentHealth = targetEl.healthValue ?? 100;
            const newHealth = Math.max(0, currentHealth - config.value);
            context.updateElements(
              context.elements.map(el =>
                el.id === config.targetElementId ? { ...el, healthValue: newHealth } : el
              )
            );
          }
        }
        break;
      case 'setHealth':
        // 设置血量
        if (config.targetElementId && config.value !== undefined) {
          const targetEl = context.elements.find(el => el.id === config.targetElementId);
          if (targetEl) {
            const maxHealth = targetEl.maxHealth ?? 100;
            const newHealth = Math.max(0, Math.min(maxHealth, config.value));
            context.updateElements(
              context.elements.map(el =>
                el.id === config.targetElementId ? { ...el, healthValue: newHealth } : el
              )
            );
          }
        }
        break;
      case 'jumpScene':
        context.setCurrentSceneId(config.targetSceneId || config.sceneId);
        break;
      case 'showElement':
        context.updateElements(
          context.elements.map(el =>
            el.id === config.targetElementId || el.id === config.elementId ? { ...el, visible: true } : el
          )
        );
        break;
      case 'hideElement':
        context.updateElements(
          context.elements.map(el =>
            el.id === config.targetElementId || el.id === config.elementId ? { ...el, visible: false } : el
          )
        );
        break;
      case 'toggleElement':
        context.updateElements(
          context.elements.map(el =>
            el.id === config.targetElementId || el.id === config.elementId ? { ...el, visible: !el.visible } : el
          )
        );
        break;
      case 'playAudio':
      case 'playVideo':
        const mediaEl = context.sceneContainerRef.current?.querySelector(
          `#element-${config.targetElementId || config.elementId} audio, #element-${config.targetElementId || config.elementId} video`
        ) as HTMLMediaElement;
        if (mediaEl) {
          try { await mediaEl.play(); } catch (e) { console.error('播放失败:', e); }
        }
        break;
      case 'pauseAudio':
      case 'pauseVideo':
        const pauseMediaEl = context.sceneContainerRef.current?.querySelector(
          `#element-${config.targetElementId || config.elementId} audio, #element-${config.targetElementId || config.elementId} video`
        ) as HTMLMediaElement;
        if (pauseMediaEl) {
          pauseMediaEl.pause();
        }
        break;
      case 'stopMedia':
        const stopMediaEl = context.sceneContainerRef.current?.querySelector(
          `#element-${config.targetElementId || config.elementId} audio, #element-${config.targetElementId || config.elementId} video`
        ) as HTMLMediaElement;
        if (stopMediaEl) {
          stopMediaEl.pause();
          stopMediaEl.currentTime = 0;
        }
        break;
      case 'setVolume':
        const volumeMediaEl = context.sceneContainerRef.current?.querySelector(
          `#element-${config.targetElementId || config.elementId} audio, #element-${config.targetElementId || config.elementId} video`
        ) as HTMLMediaElement;
        if (volumeMediaEl) {
          volumeMediaEl.volume = (config.value ?? config.volume ?? 100) / 100;
        }
        break;
      case 'delay':
        await new Promise(resolve => setTimeout(resolve, config.delay || config.duration || 1000));
        break;
      case 'setOpacity':
        context.updateElements(
          context.elements.map(el =>
            el.id === config.targetElementId || el.id === config.elementId ? { ...el, opacity: config.value ?? config.opacity ?? 1 } : el
          )
        );
        break;
      case 'addHealth':
        // 加血
        if (context.setScenes) {
          context.setScenes(prev => prev.map(scene => ({
            ...scene,
            elements: scene.elements.map(el => {
              if (el.id === config.targetElementId) {
                const newHealth = Math.min(el.maxHealth ?? 100, (el.healthValue ?? 100) + (config.value ?? 10));
                // 检测血量触发器
                checkHealthTriggersForElement(el, newHealth, context);
                return { ...el, healthValue: newHealth };
              }
              return el;
            })
          })));
        }
        break;
      case 'reduceHealth':
        // 减血
        if (context.setScenes) {
          context.setScenes(prev => prev.map(scene => ({
            ...scene,
            elements: scene.elements.map(el => {
              if (el.id === config.targetElementId) {
                const newHealth = Math.max(0, (el.healthValue ?? 100) - (config.value ?? 10));
                // 检测血量触发器
                checkHealthTriggersForElement(el, newHealth, context);
                return { ...el, healthValue: newHealth };
              }
              return el;
            })
          })));
        }
        break;
      case 'setHealth':
        // 设置血量
        if (context.setScenes) {
          context.setScenes(prev => prev.map(scene => ({
            ...scene,
            elements: scene.elements.map(el => {
              if (el.id === config.targetElementId) {
                const newHealth = config.value || 0;
                // 检测血量触发器
                checkHealthTriggersForElement(el, newHealth, context);
                return { ...el, healthValue: newHealth };
              }
              return el;
            })
          })));
        }
        break;
      case 'startPathAnimation':
        // 执行路径动画
        const pathElement = context.elements.find(el => el.id === config.targetElementId || el.id === config.elementId);
        const animation = pathElement?.pathAnimations?.find(a => a.id === config.pathAnimationId);
        if (pathElement && animation && animation.pathPoints.length >= 2) {
          // 使用 requestAnimationFrame 实现路径动画
          const startTime = Date.now() + animation.delay;
          const duration = animation.duration;
          const points = animation.pathPoints;
          
          // 缓动函数
          const easingFunctions = {
            linear: (t: number) => t,
            ease: (t: number) => t * t * (3 - 2 * t),
            easeIn: (t: number) => t * t,
            easeOut: (t: number) => t * (2 - t),
            easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
          };
          const easingFn = easingFunctions[animation.easing] || easingFunctions.linear;
          
          // 计算路径上某点的位置（线性插值）
          const getPointOnPath = (progress: number): { x: number; y: number } => {
            if (points.length === 0) return { x: pathElement.x, y: pathElement.y };
            if (points.length === 1) return { x: points[0].x, y: points[0].y };
            
            // 计算总路径长度
            let totalLength = 0;
            const segments: { length: number; start: PathPoint; end: PathPoint }[] = [];
            for (let i = 0; i < points.length - 1; i++) {
              const dx = points[i + 1].x - points[i].x;
              const dy = points[i + 1].y - points[i].y;
              const length = Math.sqrt(dx * dx + dy * dy);
              segments.push({ length, start: points[i], end: points[i + 1] });
              totalLength += length;
            }
            
            if (totalLength === 0) return { x: points[0].x, y: points[0].y };
            
            // 找到当前进度对应的线段
            const targetLength = progress * totalLength;
            let currentLength = 0;
            
            for (const segment of segments) {
              if (currentLength + segment.length >= targetLength) {
                const segmentProgress = (targetLength - currentLength) / segment.length;
                return {
                  x: segment.start.x + (segment.end.x - segment.start.x) * segmentProgress,
                  y: segment.start.y + (segment.end.y - segment.start.y) * segmentProgress,
                };
              }
              currentLength += segment.length;
            }
            
            return { x: points[points.length - 1].x, y: points[points.length - 1].y };
          };
          
          let animationFrame: number;
          let direction = 1; // 1 正向，-1 反向（用于往返模式）
          let iterations = 0;
          const maxIterations = animation.loopCount ?? (animation.loopMode === 'none' ? 1 : -1);
          
          const animate = () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed < 0) {
              animationFrame = requestAnimationFrame(animate);
              return;
            }
            
            let progress = elapsed / duration;
            
            // 处理循环模式
            if (animation.loopMode === 'none') {
              if (progress >= 1) {
                progress = 1;
                // 动画结束，设置到终点
                const finalPoint = points[points.length - 1];
                if (context.setScenes) {
                  context.setScenes(prev => prev.map(scene => ({
                    ...scene,
                    elements: scene.elements.map(el => 
                      el.id === pathElement.id ? { ...el, x: finalPoint.x, y: finalPoint.y } : el
                    )
                  })));
                }
                return;
              }
            } else if (animation.loopMode === 'loop') {
              progress = progress % 1;
              if (maxIterations > 0 && Math.floor(elapsed / duration) >= maxIterations) {
                return;
              }
            } else if (animation.loopMode === 'alternate') {
              const cycle = Math.floor(progress);
              progress = progress % 1;
              if (cycle % 2 === 1) {
                progress = 1 - progress; // 反向
              }
              if (maxIterations > 0 && cycle >= maxIterations) {
                return;
              }
            }
            
            // 应用缓动
            const easedProgress = easingFn(progress);
            
            // 计算当前位置
            const pos = getPointOnPath(easedProgress);
            
            // 更新元素位置
            if (context.setScenes) {
              context.setScenes(prev => prev.map(scene => ({
                ...scene,
                elements: scene.elements.map(el => 
                  el.id === pathElement.id ? { ...el, x: pos.x, y: pos.y } : el
                )
              })));
            }
            
            animationFrame = requestAnimationFrame(animate);
          };
          
          animationFrame = requestAnimationFrame(animate);
        }
        break;
      default:
        console.log('未知动作类型:', actionType, action);
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
    setScenes?: React.Dispatch<React.SetStateAction<Scene[]>>;
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
  const [selectedChoices, setSelectedChoices] = useState<Set<string>>(new Set());
  // 已执行过动作的选择项（每个选择项只执行一次）
  const [executedChoices, setExecutedChoices] = useState<Set<string>>(new Set());
  
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
          
          // 初始化选中状态：找出所有 isSelected: true 的选择项
          const initiallySelected = new Set<string>();
          cleanedScenes.forEach((scene: Scene) => {
            scene.elements?.forEach((el: Element) => {
              if (el.type === 'choiceItem' && el.isSelected) {
                initiallySelected.add(el.id);
              }
            });
          });
          setSelectedChoices(initiallySelected);
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
    setScenes,
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

      case 'healthBar':
        const healthPercent = ((element.healthValue ?? 100) / (element.maxHealth ?? 100)) * 100;
        const isLowHealth = healthPercent <= (element.lowHealthThreshold || 30);
        const barColor = isLowHealth ? (element.lowHealthColor || '#EF4444') : (element.healthBarColor || '#22C55E');
        
        return (
          <div
            key={element.id}
            id={`element-${element.id}`}
            style={{
              ...style,
              backgroundColor: 'transparent', // 血条背景由内部元素控制
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0 4px',
            }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
          >
            {/* 血条背景层 */}
            <div 
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: element.healthBarBgColor || '#374151',
                borderRadius: style.borderRadius || 4,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* 血量填充 */}
              <div
                style={{
                  width: `${healthPercent}%`,
                  height: '100%',
                  backgroundColor: barColor,
                  transition: 'width 0.3s ease, background-color 0.3s ease',
                }}
              />
            </div>
            
            {/* 血量文字 */}
            {element.showHealthText !== false && (
              <span
                style={{
                  color: element.color || '#FFFFFF',
                  fontSize: `${element.fontSize || 12}px`,
                  fontWeight: element.fontWeight || 'bold',
                  minWidth: '40px',
                  textAlign: 'right',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  flexShrink: 0,
                }}
              >
                {element.healthValue ?? 100}/{element.maxHealth ?? 100}
              </span>
            )}
          </div>
        );

      case 'choiceItem':
        const isSelected = selectedChoices.has(element.id);
        return (
          <div
            key={element.id}
            id={`element-${element.id}`}
            style={{
              ...style,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.3)' : (style.backgroundColor || 'rgba(255,255,255,0.1)'),
              borderRadius: style.borderRadius || 8,
              cursor: 'pointer',
              transition: 'background-color 0.2s, border-color 0.2s',
              border: isSelected ? '2px solid #8B5CF6' : '2px solid rgba(255,255,255,0.3)',
            }}
            onClick={async (e) => {
              handleClick(e);
              
              // 切换选中状态
              setSelectedChoices(prev => {
                const newSet = new Set(prev);
                if (newSet.has(element.id)) {
                  newSet.delete(element.id);
                } else {
                  newSet.add(element.id);
                }
                return newSet;
              });
              
              // 只有首次点击时才执行动作
              if (!executedChoices.has(element.id)) {
                const actions = element.clickActions || [];
                if (actions.length > 0) {
                  await executeActions(actions, {
                    ...eventContext,
                    setScenes,
                  });
                  // 标记为已执行
                  setExecutedChoices(prev => new Set(prev).add(element.id));
                }
              }
            }}
            onMouseEnter={handleMouseEnter}
          >
            {/* 选择框 */}
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: isSelected ? '2px solid #8B5CF6' : '2px solid rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {isSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            {/* 选项文字 */}
            <span style={{ flex: 1, color: isSelected ? '#fff' : 'inherit' }}>
              {element.content || element.text || '选项'}
            </span>
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
