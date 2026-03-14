'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PanoramaViewer from '@/components/panorama/PanoramaViewer';
import PanoramaVideoViewer from '@/components/panorama/PanoramaVideoViewer';
import DialogueBox from '@/components/interaction/DialogueBox';
import ChoicePanel from '@/components/interaction/ChoicePanel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  Home,
  Settings,
  Volume2,
  VolumeX,
  ChevronRight,
  Check,
  Star,
  Heart,
  ThumbsUp,
  Sun,
  Moon,
  Tag,
  MessageCircle,
} from 'lucide-react';

// 流媒体网站域名列表（这些网站的链接不能直接作为视频源）
const STREAMING_SITE_DOMAINS = [
  'bilibili.com', 'www.bilibili.com',
  'youtube.com', 'www.youtube.com', 'youtu.be',
  'youku.com', 'www.youku.com',
  'iqiyi.com', 'www.iqiyi.com',
  'v.qq.com', 'qq.com',
  'vimeo.com', 'www.vimeo.com',
  'douyin.com', 'www.douyin.com',
  'kuaishou.com', 'www.kuaishou.com',
  'acfun.cn', 'www.acfun.cn',
];

// 验证视频URL是否有效
function validateVideoUrl(url: string | undefined | null): { isValid: boolean; errorType?: string } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: false, errorType: 'empty' };
  }
  
  if (url.startsWith('blob:')) {
    return { isValid: false, errorType: 'blob' };
  }
  
  const isValidFormat = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  if (!isValidFormat) {
    return { isValid: false, errorType: 'invalid_format' };
  }
  
  // 流媒体网站检查
  try {
    const urlObj = new URL(url, url.startsWith('/') ? 'http://localhost' : undefined);
    const hostname = urlObj.hostname.toLowerCase();
    
    for (const domain of STREAMING_SITE_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return { isValid: false, errorType: 'streaming_site' };
      }
    }
  } catch {
    // URL解析失败，继续验证
  }
  
  return { isValid: true };
}

// 编辑器元素类型
type ElementType = 
  | 'button' | 'text' | 'image' | 'hotspot' | 'panel' | 'video' | 'audio'
  | 'divider' | 'tooltip' | 'label' | 'healthBar' | 'choiceItem';

// 标签子类型
type LabelSubType = 
  | 'icon'      // 图标标签
  | 'hotspot'   // 热点标签
  | 'text'      // 文字标签
  | 'text2d'    // 2D文字
  | 'ui'        // UI标签
  | 'uiAnnotation' // UI标注
  | 'panel'     // 面板标签
  | 'hud'       // HUD面板标签
  | 'number'    // 数字标注
  | 'summary'   // 概注
  | 'style'     // 样式注记
  | 'bubble'    // 气泡注记
  | 'dialog';   // 对话框注记

// 路径动画点
interface PathPoint {
  x: number;
  y: number;
  controlIn?: { x: number; y: number };
  controlOut?: { x: number; y: number };
}

// 路径动画（旧版，向后兼容）
interface PathAnimation {
  id: string;
  pathPoints: PathPoint[];
  duration: number;
  delay?: number;
  easing?: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut';
  loop?: boolean;
}

// 路径动画（新版）
interface ElementPath {
  enabled: boolean;
  autoPlay: boolean;
  points: PathPoint[];
  duration: number;
  delay?: number;
  easing?: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut';
  loopMode?: 'none' | 'loop' | 'alternate';
}

interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  backgroundColor: string;
  color: string;
  fontSize: number;
  borderRadius: number;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  boxShadow: string;
  hoverBackgroundColor?: string;
  hoverColor?: string;
  hoverScale?: number;
  iconName?: string;
  iconPosition?: 'left' | 'right';
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  // 图片/视频特有属性
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  // 视频特有属性
  playOnVisible?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  // 热点特有属性 - 3D空间位置
  hotspotPosition?: { x: number; y: number; z: number };
  // 变换属性
  rotation?: number;
  scale?: number;
  transformOrigin?: string; // 变换原点
  // 锚点位置 - 元素内部的变换中心点（0-100%）
  anchorX?: number; // 锚点水平位置，0=左边，50=中心，100=右边
  anchorY?: number; // 锚点垂直位置，0=上边，50=中心，100=下边
  // 旧的锚点预设（保留兼容）
  anchorPoint?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  // 标签子类型
  labelSubType?: LabelSubType;
  // 点击音效
  clickAudio?: string;
  // 点击动画效果
  clickEffect?: 'none' | 'ripple' | 'pulse' | 'bounce' | 'shake' | 'flash';
  effectDuration?: number;
  // 视频时间触发器
  timeTriggers?: VideoTimeTrigger[];
  content: string;
  src?: string;
  events: any[];
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
  clickActions?: any[];
  // 路径动画
  pathAnimations?: PathAnimation[];
  // 路径动画（新版）
  path?: ElementPath;
}

// 编辑器场景类型
interface EditorScene {
  id: string;
  name: string;
  backgroundColor: string;
  panoramaImage: string;
  panoramaVideo: string;
  elements: CanvasElement[];
  transition: 'fade' | 'slide' | 'zoom' | 'none';
  canvasWidth?: number;
  canvasHeight?: number;
}

// 获取图标组件
const getIconComponent = (iconName: string, size: number = 16) => {
  const sizeStyle = { width: `${size}px`, height: `${size}px` };
  const icons: Record<string, React.ReactNode> = {
    '箭头': <ChevronRight style={sizeStyle} />,
    '外部链接': <ChevronRight style={sizeStyle} />,
    '对勾': <Check style={sizeStyle} />,
    '星星': <Star style={sizeStyle} />,
    '爱心': <Heart style={sizeStyle} />,
    '点赞': <ThumbsUp style={sizeStyle} />,
    '太阳': <Sun style={sizeStyle} />,
    '月亮': <Moon style={sizeStyle} />,
  };
  return icons[iconName] || null;
};

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image: string;
}

interface Scene {
  id: string;
  story_id: string;
  title: string;
  panorama_image: string;
  background_audio?: string;
  initial_rotation: number;
}

interface Character {
  id: string;
  name: string;
  avatar?: string;
}

interface StoryNode {
  id: string;
  scene_id: string;
  title: string;
  content: string;
  node_type: 'start' | 'dialogue' | 'choice' | 'end';
  character_id?: string;
  position_x: number;
  position_y: number;
  position_z: number;
  order_index: number;
}

interface Choice {
  id: string;
  node_id: string;
  choice_text: string;
  next_node_id?: string;
  condition?: any;
}

interface GameState {
  currentNode: StoryNode | null;
  currentScene: Scene | null;
  choicesMade: string[];
  itemsCollected: string[];
  progress: number;
  showDialogue: boolean;
  showChoices: boolean;
  availableChoices: Choice[];
}

// 视频时间触发器
interface VideoTimeTrigger {
  id: string;
  time: number;
  actions: any[];
  description?: string;
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

// 视频元素组件 - 处理自动播放和时间触发器
function VideoElement({ 
  src, 
  playOnVisible,
  loop, 
  muted, 
  controls, 
  borderRadius,
  objectFit,
  timeTriggers,
  onTimeTrigger
}: { 
  src: string; 
  playOnVisible?: boolean;
  loop?: boolean; 
  muted?: boolean; 
  controls?: boolean;
  borderRadius?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  timeTriggers?: VideoTimeTrigger[];
  onTimeTrigger?: (trigger: VideoTimeTrigger) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggeredRef = useRef<Set<string>>(new Set()); // 记录已触发的触发器
  
  // playOnVisible 默认为 true（显示即播放）
  const shouldAutoplay = playOnVisible !== false;
  const shouldLoop = loop === true;
  // 尊重元素的 muted 设置：
  // - 如果 muted 明确设置为 true，则静音
  // - 如果 muted 明确设置为 false，则不静音
  // - 如果 muted 未设置（undefined），默认静音以符合浏览器自动播放策略
  const shouldMute = muted === true ? true : (muted === false ? false : true);

  // 验证 URL 有效性（包括流媒体网站检测）
  const validation = validateVideoUrl(src);

  // 组件挂载后立即尝试播放视频
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldAutoplay) {
      console.log('VideoElement: 跳过播放 - video存在:', !!video, 'shouldAutoplay:', shouldAutoplay);
      return;
    }
    
    console.log('VideoElement: 开始尝试播放视频');
    console.log('VideoElement: src=', src?.substring(0, 50));
    
    // 确保视频静音（浏览器策略要求）
    video.muted = true;
    
    // 尝试播放的函数
    const tryPlay = () => {
      console.log('VideoElement: 调用 play(), readyState=', video.readyState);
      video.play().then(() => {
        console.log('VideoElement: ✅ 视频自动播放成功');
      }).catch((err) => {
        console.log('VideoElement: ❌ 视频自动播放失败:', err.message);
        // 确保静音后重试
        video.muted = true;
        video.play().catch(() => {});
      });
    };
    
    // 监听视频可以播放
    const handleCanPlay = () => {
      console.log('VideoElement: canplay 事件');
      tryPlay();
    };
    
    // 监听视频加载完成
    const handleLoadedData = () => {
      console.log('VideoElement: loadeddata 事件');
      tryPlay();
    };
    
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    
    // 立即尝试播放（如果视频已经准备好）
    if (video.readyState >= 3) {
      console.log('VideoElement: 视频已准备好 (readyState>=3)');
      tryPlay();
    } else if (video.readyState >= 2) {
      console.log('VideoElement: 视频已加载部分数据 (readyState>=2)');
      tryPlay();
    }
    
    // 延迟重试（解决某些情况下的时序问题）
    const timeoutId = setTimeout(() => {
      if (video.readyState >= 2) {
        console.log('VideoElement: 延迟重试播放');
        tryPlay();
      }
    }, 100);
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      clearTimeout(timeoutId);
    };
  }, [src, shouldAutoplay]);

  // 处理时间触发器
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !timeTriggers || timeTriggers.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      
      timeTriggers.forEach(trigger => {
        // 检查是否到达触发时间（允许0.5秒的误差）
        if (Math.abs(currentTime - trigger.time) < 0.5 && !triggeredRef.current.has(trigger.id)) {
          triggeredRef.current.add(trigger.id);
          if (onTimeTrigger) {
            onTimeTrigger(trigger);
          }
        }
      });
    };

    // 循环播放时重置触发状态
    const handleSeeked = () => {
      // 如果视频重新开始播放，重置触发状态
      if (video.currentTime < 1) {
        triggeredRef.current.clear();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [timeTriggers, onTimeTrigger]);

  // 如果 URL 无效，不渲染任何内容
  if (!validation.isValid) {
    return null;
  }

  return (
    <video 
      ref={videoRef}
      src={src}
      loop={shouldLoop}
      muted={true}
      autoPlay={shouldAutoplay}
      controls={controls}
      playsInline
      preload="auto"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%', 
        height: '100%', 
        objectFit: objectFit || 'cover',
        objectPosition: 'center',
        borderRadius: borderRadius || 0,
        backgroundColor: '#000',
        border: '3px solid red', // 调试：显示红色边框确认渲染
        outline: 'none',
        display: 'block',
        // 如果有控制条，让 video 标签可以响应点击（控制条交互）
        // 如果没有控制条，让点击穿透到下层元素
        pointerEvents: controls ? 'auto' : 'none'
      }}
      onError={(e) => {
        console.log('VideoElement: 视频加载错误', e);
      }}
    />
  );
}

// 视频预加载组件 - 使用隐藏的 video 元素预加载
function VideoPreloader({ videos }: { videos: string[] }) {
  // 过滤有效的视频 URL（使用验证函数）
  const validVideos = videos.filter(src => validateVideoUrl(src).isValid);
  
  return (
    <div style={{ display: 'none' }}>
      {validVideos.map((src, index) => (
        <video
          key={index}
          src={src}
          preload="auto"
          muted
          crossOrigin="anonymous"
          onError={() => {}} // 静默处理错误
        />
      ))}
    </div>
  );
}

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 用于追踪当前播放的点击音效，防止多次点击叠加播放
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // 路径动画状态
  const pathAnimationRefs = useRef<Map<string, { animationFrame: number; startTime: number }>>(new Map());
  
  // 状态管理
  const [storyId, setStoryId] = useState('demo');
  const [initialSceneId, setInitialSceneId] = useState<string | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Set<string>>(new Set());
  // 已执行过动作的选择项（每个选择项只执行一次）
  const [executedChoices, setExecutedChoices] = useState<Set<string>>(new Set());
  
  // 从 URL 参数初始化
  useEffect(() => {
    const story = searchParams.get('story');
    const scene = searchParams.get('scene');
    if (story) setStoryId(story);
    if (scene) setInitialSceneId(scene);
  }, [searchParams]);
  
  // 用于追踪已被时间触发器显示的元素（初始为空，触发后才显示）
  const [triggeredShownElements, setTriggeredShownElements] = useState<Set<string>>(new Set());
  
  // 标记元素为已被触发器显示
  const markElementAsTriggered = useCallback((elementId: string) => {
    setTriggeredShownElements(prev => {
      const newSet = new Set(prev);
      newSet.add(elementId);
      return newSet;
    });
  }, []);

  // 播放点击音效（停止之前的音效）
  const playClickAudio = useCallback((audioUrl: string) => {
    // 停止并清理之前的音效
    if (clickAudioRef.current) {
      clickAudioRef.current.pause();
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current = null;
    }
    
    try {
      const audio = new Audio(audioUrl);
      audio.volume = 0.5;
      clickAudioRef.current = audio;
      audio.play().catch(() => {
        // 静默处理播放失败
      });
      // 播放结束后清理引用
      audio.onended = () => {
        if (clickAudioRef.current === audio) {
          clickAudioRef.current = null;
        }
      };
    } catch (e) {
      // 忽略音频播放错误
    }
  }, []);

  // 播放点击动画效果
  const playClickEffect = useCallback((elementId: string, effectType: string, duration: number = 0.4) => {
    const element = document.querySelector(`[data-element-id="${elementId}"]`);
    if (!element || effectType === 'none') return;

    // 映射动画类型到 CSS 类名
    const animationClassMap: Record<string, string> = {
      'ripple': 'animate-ripple',
      'pulse': 'animate-pulse-click',
      'bounce': 'animate-bounce-click',
      'shake': 'animate-shake-click',
      'flash': 'animate-flash-click',
    };

    const animationClass = animationClassMap[effectType];
    if (!animationClass) return;

    // 添加动画类
    element.classList.add(animationClass);

    // 设置动画持续时间
    const htmlElement = element as HTMLElement;
    htmlElement.style.animationDuration = `${duration}s`;

    // 动画结束后移除动画类
    const handleAnimationEnd = () => {
      element.classList.remove(animationClass);
      htmlElement.style.animationDuration = '';
      element.removeEventListener('animationend', handleAnimationEnd);
    };

    element.addEventListener('animationend', handleAnimationEnd);
  }, []);

  const [story, setStory] = useState<Story | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  // 画布缩放比例
  const [canvasScale, setCanvasScale] = useState(1);
  
  // 窗口尺寸（用于调试）
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  // 编辑器场景数据
  const [editorScenes, setEditorScenes] = useState<EditorScene[]>([]);
  const [currentEditorSceneId, setCurrentEditorSceneId] = useState<string | null>(null);
  const currentEditorScene = editorScenes.find(s => s.id === currentEditorSceneId);
  
  // 更新窗口尺寸
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);
  
  // 计算画布缩放比例
  useEffect(() => {
    const updateScale = () => {
      if (!currentEditorScene) return;
      
      const canvasW = currentEditorScene.canvasWidth || 1920;
      const canvasH = currentEditorScene.canvasHeight || 1080;
      const topBarHeight = 64; // 顶部UI高度
      
      const scaleX = window.innerWidth / canvasW;
      const scaleY = (window.innerHeight - topBarHeight) / canvasH;
      const scale = Math.min(scaleX, scaleY);
      
      console.log('=== 计算缩放 ===');
      console.log('window.innerWidth:', window.innerWidth);
      console.log('window.innerHeight:', window.innerHeight);
      console.log('canvasW:', canvasW, 'canvasH:', canvasH);
      console.log('scaleX:', scaleX, 'scaleY:', scaleY);
      console.log('最终 scale:', scale);
      
      setCanvasScale(scale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [currentEditorScene]);

  // 自动播放路径动画
  useEffect(() => {
    if (!currentEditorScene) return;
    
    const cleanupFns: (() => void)[] = [];
    
    currentEditorScene.elements.forEach((element: any) => {
      const path = element.path;
      if (!path || !path.enabled || !path.autoPlay || path.points.length < 2) return;
      
      const delay = path.delay || 0;
      const duration = path.duration || 3000;
      const easing = path.easing || 'easeInOut';
      const loopMode = path.loopMode || 'none';
      
      // 缓动函数
      const easingFunctions: Record<string, (t: number) => number> = {
        linear: (t) => t,
        ease: (t) => t * t * (3 - 2 * t),
        easeIn: (t) => t * t,
        easeOut: (t) => t * (2 - t),
        easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      };
      const easingFn = easingFunctions[easing] || easingFunctions.linear;
      
      // 三次贝塞尔曲线计算
      const cubicBezier = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
        const mt = 1 - t;
        return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
      };
      
      const getPointOnPath = (progress: number): { x: number; y: number } => {
        const points = path.points;
        if (points.length === 0) return { x: element.x, y: element.y };
        if (points.length === 1) return { x: points[0].x, y: points[0].y };
        
        const totalSegments = points.length - 1;
        const segmentProgress = progress * totalSegments;
        const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
        const t = segmentProgress - segmentIndex;
        
        const p0 = points[segmentIndex];
        const p3 = points[segmentIndex + 1];
        
        // 自动计算控制点（如果未定义）
        const autoControlOffset = 50;
        const p1 = p0.controlOut 
          ? { x: p0.x + p0.controlOut.x, y: p0.y + p0.controlOut.y }
          : { x: p0.x + autoControlOffset, y: p0.y };
        const p2 = p3.controlIn 
          ? { x: p3.x + p3.controlIn.x, y: p3.y + p3.controlIn.y }
          : { x: p3.x - autoControlOffset, y: p3.y };
        
        return {
          x: cubicBezier(p0.x, p1.x, p2.x, p3.x, t),
          y: cubicBezier(p0.y, p1.y, p2.y, p3.y, t),
        };
      };
      
      // 获取所有子元素
      const allChildren = getAllChildren(element.id, currentEditorScene.elements);
      const initialPositions = new Map<string, { x: number; y: number }>();
      initialPositions.set(element.id, { x: element.x, y: element.y });
      allChildren.forEach((child: any) => {
        initialPositions.set(child.id, { x: child.x, y: child.y });
      });
      
      const elementCenterX = element.x + element.width / 2;
      const elementCenterY = element.y + element.height / 2;
      
      let animationStarted = false;
      let animationId = 0;
      
      const animate = () => {
        const now = Date.now();
        
        if (!animationStarted) {
          animationStarted = true;
          pathAnimationRefs.current.set(element.id, { animationFrame: animationId, startTime: now });
        }
        
        const ref = pathAnimationRefs.current.get(element.id);
        if (!ref) return;
        
        const elapsed = now - ref.startTime - delay;
        
        if (elapsed < 0) {
          animationId = requestAnimationFrame(animate);
          return;
        }
        
        let progress = elapsed / duration;
        let finished = false;
        
        if (progress >= 1) {
          if (loopMode === 'loop') {
            progress = progress % 1;
          } else if (loopMode === 'alternate') {
            const loopCount = Math.floor(progress);
            progress = loopCount % 2 === 0 ? progress % 1 : 1 - (progress % 1);
          } else {
            progress = 1;
            finished = true;
          }
        }
        
        const easedProgress = easingFn(progress);
        const pos = getPointOnPath(easedProgress);
        
        // 计算位移
        const deltaX = pos.x - elementCenterX;
        const deltaY = pos.y - elementCenterY;
        
        // 更新元素位置
        setEditorScenes(prevScenes => prevScenes.map(scene => {
          if (scene.id !== currentEditorSceneId) return scene;
          return {
            ...scene,
            elements: scene.elements.map((el: any) => {
              if (el.id === element.id) {
                const initial = initialPositions.get(el.id);
                if (!initial) return el;
                return { ...el, x: initial.x + deltaX, y: initial.y + deltaY };
              }
              // 移动子元素
              if (allChildren.some((c: any) => c.id === el.id)) {
                const initial = initialPositions.get(el.id);
                if (!initial) return el;
                return { ...el, x: initial.x + deltaX, y: initial.y + deltaY };
              }
              return el;
            })
          };
        }));
        
        if (!finished) {
          animationId = requestAnimationFrame(animate);
        }
      };
      
      animationId = requestAnimationFrame(animate);
      
      cleanupFns.push(() => {
        cancelAnimationFrame(animationId);
        pathAnimationRefs.current.delete(element.id);
      });
    });
    
    return () => {
      cleanupFns.forEach(fn => fn());
    };
  }, [currentEditorSceneId, currentEditorScene?.id]);

  const [gameState, setGameState] = useState<GameState>({
    currentNode: null,
    currentScene: null,
    choicesMade: [],
    itemsCollected: [],
    progress: 0,
    showDialogue: false,
    showChoices: false,
    availableChoices: [],
  });

  // 加载剧本数据
  useEffect(() => {
    let isMounted = true;
    let dataLoaded = false;
    
    const fetchStory = async () => {
      try {
        console.log('=== 预览页面开始加载数据 ===');
        console.log('预览 - storyId:', storyId);
        console.log('预览 - initialSceneId:', initialSceneId);
        console.log('预览 - window.opener 是否存在:', !!window.opener);
        
        // 【方案1】检查是否有 opener（从编辑器打开）
        if (window.opener && !dataLoaded) {
          console.log('预览 - 检测到从编辑器打开，请求数据...');
          
          // 监听来自编辑器的数据
          const handleMessage = (event: MessageEvent) => {
            console.log('预览 - 收到 message:', event.data?.type);
            
            if (event.data?.type === 'PREVIEW_PROJECT_DATA' && !dataLoaded) {
              console.log('预览 - ✅ 收到编辑器数据');
              const projectData = event.data.data;
              
              // 预览页面不应该保存数据到 localStorage，避免覆盖编辑器数据
              // 直接使用数据
              if (isMounted) useProjectData(projectData);
              dataLoaded = true;
              window.removeEventListener('message', handleMessage);
            }
          };
          
          window.addEventListener('message', handleMessage);
          
          // 向编辑器请求数据
          console.log('预览 - 向编辑器发送 PREVIEW_REQUEST_DATA');
          window.opener.postMessage({ type: 'PREVIEW_REQUEST_DATA' }, '*');
          
          // 等待最多 5 秒
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          window.removeEventListener('message', handleMessage);
        }
        
        // 【方案2】从 localStorage 读取
        if (!dataLoaded) {
          console.log('预览 - 尝试从 localStorage 读取...');
          const savedProjects = JSON.parse(localStorage.getItem('interactive-stories') || '{}');
          const projectData = savedProjects[storyId];
          
          if (projectData && projectData.scenes && projectData.scenes.length > 0) {
            console.log('预览 - ✅ 从 localStorage 读取成功');
            if (isMounted) useProjectData(projectData);
            dataLoaded = true;
            return;
          }
        }
        
        // 如果已经加载了数据，不需要继续
        if (dataLoaded) return;
        
        console.log('预览 - ❌ 无法获取项目数据');
        
        // 开发模式：使用演示数据
        if (storyId === 'demo') {
          loadDemoData();
          return;
        }

        // 尝试从 API 加载
        console.log('预览 - 尝试从 API 加载...');
        const response = await fetch(`/api/stories/${storyId}`);
        const data = await response.json();

        if (data.story) {
          setStory(data.story);
          setScenes(data.scenes || []);
          setNodes(data.nodes || []);
          setChoices(data.choices || []);
          setCharacters(data.characters || []);
        }
      } catch (error) {
        console.error('Failed to load story:', error);
        if (!dataLoaded && storyId === 'demo') {
          loadDemoData();
        }
      } finally {
        if (!dataLoaded) {
          setIsLoading(false);
        }
      }
    };
    
    // 使用项目数据的处理函数
    const useProjectData = (projectData: any) => {
      const storyData: Story = {
        id: storyId,
        title: projectData.name || '我的互动短剧',
        description: '',
        cover_image: '',
      };
      setStory(storyData);
      
      const enabledScenes = projectData.scenes || [];
      console.log('预览 - 场景数量:', enabledScenes.length);
      
      // 调试：打印所有视频元素的信息
      enabledScenes.forEach((scene: any, sceneIndex: number) => {
        scene.elements?.forEach((el: any, elIndex: number) => {
          if (el.type === 'video') {
            console.log(`=== 视频元素数据 [场景${sceneIndex}, 元素${elIndex}] ===`);
            console.log('el.id:', el.id);
            console.log('el.visible:', el.visible);
            console.log('el.playOnVisible:', el.playOnVisible);
            console.log('el.muted:', el.muted);
            console.log('el.src:', el.src?.substring(0, 50) + '...');
          }
        });
      });
      
      if (enabledScenes.length > 0) {
        const firstScene = enabledScenes[0];
        console.log('预览 - 第一个场景 canvasWidth:', firstScene.canvasWidth);
        console.log('预览 - 第一个场景 canvasHeight:', firstScene.canvasHeight);
        
        // 立即计算缩放
        const canvasW = firstScene.canvasWidth || 1920;
        const canvasH = firstScene.canvasHeight || 1080;
        const topBarHeight = 64;
        
        const scaleX = window.innerWidth / canvasW;
        const scaleY = (window.innerHeight - topBarHeight) / canvasH;
        const scale = Math.min(scaleX, scaleY);
        
        console.log('=== 立即计算缩放 ===');
        console.log('window.innerWidth:', window.innerWidth);
        console.log('window.innerHeight:', window.innerHeight);
        console.log('canvasW:', canvasW, 'canvasH:', canvasH);
        console.log('scaleX:', scaleX, 'scaleY:', scaleY);
        console.log('最终 scale:', scale);
        
        setCanvasScale(scale);
      }
      
      setEditorScenes(enabledScenes);
      
      // 初始化选中状态：找出所有 isSelected: true 的选择项
      const initiallySelected = new Set<string>();
      enabledScenes.forEach((scene: EditorScene) => {
        scene.elements?.forEach((el: CanvasElement) => {
          if (el.type === 'choiceItem' && el.isSelected) {
            initiallySelected.add(el.id);
          }
        });
      });
      setSelectedChoices(initiallySelected);
      
      const targetSceneId = initialSceneId && enabledScenes.find((s: any) => s.id === initialSceneId)
        ? initialSceneId
        : (enabledScenes.length > 0 ? enabledScenes[0].id : null);
      
      if (targetSceneId) {
        setCurrentEditorSceneId(targetSceneId);
      }
      
      setIsLoading(false);
    };

    fetchStory();
    
    return () => {
      isMounted = false;
    };
  }, [storyId, initialSceneId]);

  // 加载演示数据
  const loadDemoData = () => {
    const demoStory: Story = {
      id: 'demo',
      title: '迷失的时空',
      description: '一个关于时间与空间的冒险故事',
      cover_image: '',
    };

    const demoScenes: Scene[] = [
      {
        id: 'scene-1',
        story_id: 'demo',
        title: '神秘森林',
        panorama_image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=2048',
        initial_rotation: 0,
      },
      {
        id: 'scene-2',
        story_id: 'demo',
        title: '古老城堡',
        panorama_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=2048',
        initial_rotation: 90,
      },
    ];

    const demoCharacters: Character[] = [
      {
        id: 'char-1',
        name: '神秘旅人',
        avatar: '',
      },
    ];

    const demoNodes: StoryNode[] = [
      {
        id: 'node-start',
        scene_id: 'scene-1',
        title: '开始',
        content: '你睁开眼睛，发现自己身处一片神秘的森林中。四周弥漫着薄雾，树木高耸入云。一个穿着长袍的神秘旅人正站在你面前。',
        node_type: 'start',
        character_id: 'char-1',
        position_x: 0,
        position_y: 0,
        position_z: 0,
        order_index: 0,
      },
      {
        id: 'node-2',
        scene_id: 'scene-1',
        title: '旅人的话',
        content: '"欢迎来到迷失的时空，"旅人说道，"你必须做出选择：继续前进，还是寻找回家的路？"',
        node_type: 'dialogue',
        character_id: 'char-1',
        position_x: 0,
        position_y: 0,
        position_z: 0,
        order_index: 1,
      },
      {
        id: 'node-3-forward',
        scene_id: 'scene-1',
        title: '继续前进',
        content: '你决定继续前进。旅人点点头，指向远处的一座古老城堡："那里有你寻找的答案。"',
        node_type: 'dialogue',
        position_x: 0,
        position_y: 0,
        position_z: 0,
        order_index: 2,
      },
      {
        id: 'node-4-castle',
        scene_id: 'scene-2',
        title: '城堡入口',
        content: '你来到了城堡前。大门紧闭，但门上有一个奇怪的符文。旅人的声音在你耳边响起："这是时空之门的钥匙..."',
        node_type: 'end',
        position_x: 0,
        position_y: 0,
        position_z: 0,
        order_index: 3,
      },
      {
        id: 'node-3-home',
        scene_id: 'scene-1',
        title: '寻找回家的路',
        content: '你询问如何回家。旅人叹了口气："回家的路已经消失了，除非你能找到时空裂隙..."',
        node_type: 'end',
        position_x: 0,
        position_y: 0,
        position_z: 0,
        order_index: 4,
      },
    ];

    const demoChoices: Choice[] = [
      {
        id: 'choice-1',
        node_id: 'node-2',
        choice_text: '继续前进，探索这个神秘的世界',
        next_node_id: 'node-3-forward',
      },
      {
        id: 'choice-2',
        node_id: 'node-2',
        choice_text: '寻找回家的路',
        next_node_id: 'node-3-home',
      },
      {
        id: 'choice-3',
        node_id: 'node-3-forward',
        choice_text: '前往城堡',
        next_node_id: 'node-4-castle',
      },
    ];

    setStory(demoStory);
    setScenes(demoScenes);
    setNodes(demoNodes);
    setCharacters(demoCharacters);
    setChoices(demoChoices);

    // 设置初始节点
    const startNode = demoNodes.find(n => n.node_type === 'start');
    if (startNode) {
      const scene = demoScenes.find(s => s.id === startNode.scene_id);
      setGameState({
        currentNode: startNode,
        currentScene: scene || null,
        choicesMade: [],
        itemsCollected: [],
        progress: 0,
        showDialogue: true,
        showChoices: false,
        availableChoices: [],
      });
    }

    setIsLoading(false);
  };

  // 加载用户进度
  const loadProgress = async (storyId: string, nodes: StoryNode[]) => {
    try {
      const response = await fetch(`/api/progress?story_id=${storyId}`, {
        headers: {
          'x-user-id': 'user-1',
        },
      });
      const data = await response.json();

      if (data.progress && data.progress.length > 0) {
        const savedProgress = data.progress[0];
        const currentNode = nodes.find(n => n.id === savedProgress.current_node_id);
        const scene = scenes.find(s => s.id === currentNode?.scene_id);

        setGameState(prev => ({
          ...prev,
          currentNode: currentNode || null,
          currentScene: scene || null,
          choicesMade: savedProgress.choices_made || [],
          itemsCollected: savedProgress.items_collected || [],
          progress: savedProgress.progress || 0,
          showDialogue: true,
        }));
      } else {
        // 没有保存的进度，从头开始
        const startNode = nodes.find(n => n.node_type === 'start');
        if (startNode) {
          const scene = scenes.find(s => s.id === startNode.scene_id);
          setGameState(prev => ({
            ...prev,
            currentNode: startNode,
            currentScene: scene || null,
            showDialogue: true,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  // 保存进度
  const saveProgress = useCallback(async () => {
    if (!story || !gameState.currentNode) return;

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-1',
        },
        body: JSON.stringify({
          storyId: story.id,
          currentNodeId: gameState.currentNode.id,
          choicesMade: gameState.choicesMade,
          itemsCollected: gameState.itemsCollected,
          progress: gameState.progress,
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [story, gameState]);

  // 辅助函数：获取元素的所有子元素（递归）
  const getAllChildren = (elementId: string, elements: any[]): any[] => {
    const directChildren = elements.filter(e => e.parentId === elementId);
    const allChildren: any[] = [...directChildren];
    directChildren.forEach(child => {
      allChildren.push(...getAllChildren(child.id, elements));
    });
    return allChildren;
  };

  // 辅助函数：查找元素内部的媒体元素（video 或 audio）
  // 因为媒体元素的结构是 <div data-element-id="..."><video/audio /></div>
  const getMediaElement = (elementId: string): HTMLMediaElement | null => {
    const container = document.querySelector(`[data-element-id="${elementId}"]`);
    if (!container) return null;
    // 先尝试找 video，再尝试找 audio
    return container.querySelector('video') || container.querySelector('audio');
  };

  // 处理对话完成
  const handleDialogueComplete = () => {
    const currentNode = gameState.currentNode;
    if (!currentNode) return;

    // 查找是否有可选的选择
    const nodeChoices = choices.filter(c => c.node_id === currentNode.id);

    if (nodeChoices.length > 0) {
      setGameState(prev => ({
        ...prev,
        showDialogue: false,
        showChoices: true,
        availableChoices: nodeChoices,
      }));
    } else {
      // 查找下一个节点
      const nextNode = nodes.find(n => n.order_index > currentNode.order_index);
      
      if (nextNode) {
        const scene = scenes.find(s => s.id === nextNode.scene_id);
        setGameState(prev => ({
          ...prev,
          currentNode: nextNode,
          currentScene: scene || prev.currentScene,
          progress: nextNode.node_type === 'end' ? 100 : prev.progress + 10,
        }));
      } else {
        // 故事结束
        setGameState(prev => ({
          ...prev,
          showDialogue: false,
          progress: 100,
        }));
        saveProgress();
      }
    }
  };

  // 事件执行器 - 处理元素的各种交互动作
  const executeEventActions = async (actions: any[], sourceElement?: any) => {
    for (const action of actions) {
      // 如果动作有目标元素ID，先找到目标元素
      const targetElement = action.targetElementId 
        ? currentEditorScene?.elements.find((el: any) => el.id === action.targetElementId)
        : sourceElement;

      switch (action.type) {
        case 'addHealth':
          // 加血
          if (action.targetElementId && action.value !== undefined) {
            const currentHealth = targetElement?.healthValue ?? 100;
            const maxHealth = targetElement?.maxHealth ?? 100;
            const newHealth = Math.min(maxHealth, currentHealth + action.value);
            updateEditorElement(action.targetElementId, { healthValue: newHealth });
          }
          break;

        case 'reduceHealth':
          // 减血
          if (action.targetElementId && action.value !== undefined) {
            const currentHealth = targetElement?.healthValue ?? 100;
            const newHealth = Math.max(0, currentHealth - action.value);
            updateEditorElement(action.targetElementId, { healthValue: newHealth });
          }
          break;

        case 'setHealth':
          // 设置血量
          if (action.targetElementId && action.value !== undefined) {
            const maxHealth = targetElement?.maxHealth ?? 100;
            const newHealth = Math.max(0, Math.min(maxHealth, action.value));
            updateEditorElement(action.targetElementId, { healthValue: newHealth });
          }
          break;

        case 'jumpScene':
          // 跳转场景
          if (action.targetSceneId) {
            const targetScene = editorScenes.find((s: any) => s.id === action.targetSceneId);
            if (targetScene) {
              setCurrentEditorSceneId(action.targetSceneId);
              // 重置时间触发器显示的元素状态
              setTriggeredShownElements(new Set());
              // 场景切换后，等待DOM更新后尝试播放所有视频
              // VideoElement 组件会自动处理播放和静音逻辑
              const tryPlayVideos = (retryCount = 0) => {
                const videos = document.querySelectorAll('video');
                if (videos.length === 0 && retryCount < 5) {
                  // 如果没有视频元素，等待后重试
                  setTimeout(() => tryPlayVideos(retryCount + 1), 100);
                  return;
                }
                videos.forEach((v) => {
                  const video = v as HTMLVideoElement;
                  // 不强制静音，尊重元素本身的 muted 属性
                  // 如果播放失败（浏览器策略），VideoElement 会自动降级为静音播放
                  video.play().catch(() => {
                    // 如果播放失败，稍后重试
                    if (retryCount < 3) {
                      setTimeout(() => {
                        video.play().catch(() => {});
                      }, 200);
                    }
                  });
                });
              };
              // 立即尝试一次，然后延迟重试
              tryPlayVideos();
              setTimeout(() => tryPlayVideos(1), 200);
              setTimeout(() => tryPlayVideos(2), 500);
            }
          }
          break;

        case 'showElement':
          // 显示元素
          if (targetElement) {
            updateEditorElement(action.targetElementId, { visible: true });
          }
          break;

        case 'hideElement':
          // 隐藏元素
          if (targetElement) {
            updateEditorElement(action.targetElementId, { visible: false });
          }
          break;

        case 'toggleElement':
          // 切换元素可见性
          if (targetElement) {
            updateEditorElement(action.targetElementId, { visible: !targetElement.visible });
          }
          break;

        case 'playAudio':
          // 播放音频
          if (action.audioUrl) {
            // 直接播放URL音频
            try {
              const audio = new Audio(action.audioUrl);
              audio.volume = (action.volume ?? 100) / 100;
              audio.loop = action.loop ?? false;
              audio.play().catch((e) => {
                console.log('音频播放失败:', e);
              });
              // 保存引用以便后续控制
              if (typeof window !== 'undefined') {
                (window as any).__audioElements = (window as any).__audioElements || {};
                (window as any).__audioElements[action.id] = audio;
              }
            } catch (e) {
              console.log('音频播放失败:', e);
            }
          } else if (targetElement) {
            // 播放元素音频
            const mediaElement = getMediaElement(action.targetElementId);
            if (mediaElement) {
              try {
                if (action.volume !== undefined) {
                  mediaElement.volume = action.volume / 100;
                }
                if (action.loop !== undefined) {
                  mediaElement.loop = action.loop;
                }
                await mediaElement.play();
              } catch (e) {
                console.log('音频播放失败:', e);
              }
            }
          }
          break;

        case 'playVideo':
          // 播放视频
          if (action.videoUrl) {
            // 直接播放URL视频（创建新的video元素）
            try {
              const video = document.createElement('video');
              video.src = action.videoUrl;
              video.volume = (action.volume ?? 100) / 100;
              video.loop = action.loop ?? false;
              // 静音控制：如果未设置，默认不静音（让用户听到声音）
              video.muted = action.muted === true;
              video.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:9999;';
              document.body.appendChild(video);
              video.play().catch((e) => {
                console.log('视频播放失败:', e);
                // 如果播放失败（可能是因为浏览器策略阻止有声自动播放），尝试静音播放
                video.muted = true;
                video.play().catch(() => {});
              });
              // 点击关闭
              video.onclick = () => {
                video.pause();
                video.remove();
              };
            } catch (e) {
              console.log('视频播放失败:', e);
            }
          } else if (targetElement) {
            // 播放元素视频
            // 注意：视频元素结构是 <div data-element-id="..."><video /></div>
            // 所以需要查找内部的 video 元素
            const containerElement = document.querySelector(`[data-element-id="${action.targetElementId}"]`);
            const mediaElement = containerElement?.querySelector('video') as HTMLMediaElement | null;
            if (mediaElement) {
              try {
                if (action.volume !== undefined) {
                  mediaElement.volume = action.volume / 100;
                }
                if (action.loop !== undefined) {
                  mediaElement.loop = action.loop;
                }
                // 静音控制：如果未设置，默认不静音（让用户听到声音）
                // 注意：视频元素初始化时可能已经静音，这里需要根据动作设置来覆盖
                mediaElement.muted = action.muted === true;
                await mediaElement.play();
              } catch (e) {
                console.log('视频播放失败:', e);
              }
            }
          }
          break;

        case 'pauseAudio':
        case 'pauseVideo':
          // 暂停媒体
          if (targetElement) {
            const mediaElement = getMediaElement(action.targetElementId);
            if (mediaElement) {
              mediaElement.pause();
            }
          }
          break;

        case 'stopMedia':
          // 停止媒体
          if (targetElement) {
            const mediaElement = getMediaElement(action.targetElementId);
            if (mediaElement) {
              mediaElement.pause();
              mediaElement.currentTime = 0;
            }
          }
          break;

        case 'setVolume':
          // 设置音量
          if (targetElement && action.value !== undefined) {
            const mediaElement = getMediaElement(action.targetElementId);
            if (mediaElement) {
              mediaElement.volume = action.value / 100;
            }
          }
          break;

        case 'seekTo':
          // 跳转播放位置
          if (targetElement && action.value !== undefined) {
            const mediaElement = getMediaElement(action.targetElementId);
            if (mediaElement) {
              mediaElement.currentTime = action.value;
            }
          }
          break;

        case 'setOpacity':
          // 设置透明度
          if (targetElement && action.value !== undefined) {
            updateEditorElement(action.targetElementId, { opacity: action.value });
          }
          break;

        case 'moveTo':
          // 移动到位置
          if (targetElement && action.position) {
            updateEditorElement(action.targetElementId, { 
              x: action.position.x, 
              y: action.position.y 
            });
          }
          break;

        case 'scaleTo':
          // 缩放到
          if (targetElement && action.value !== undefined) {
            updateEditorElement(action.targetElementId, { scale: action.value });
          }
          break;

        case 'rotateTo':
          // 旋转到
          if (targetElement && action.value !== undefined) {
            updateEditorElement(action.targetElementId, { rotation: action.value });
          }
          break;

        case 'animate':
          // 执行动画
          if (targetElement) {
            const el = document.querySelector(`[data-element-id="${action.targetElementId}"]`);
            if (el) {
              // 映射动画类型到正确的 CSS 类名
              const animationClassMap: Record<string, string> = {
                'fade': 'animate-fade',
                'slide': 'animate-slide',
                'zoom': 'animate-zoom',
                'bounce': 'animate-bounce-anim',
                'shake': 'animate-shake-anim',
                'pulse': 'animate-pulse-anim',
              };
              const animationClass = animationClassMap[action.animationType || 'fade'] || 'animate-fade';
              el.classList.add(animationClass);
              setTimeout(() => {
                el.classList.remove(animationClass);
              }, action.animationDuration || 500);
            }
          }
          break;

        case 'setProperty':
          // 设置元素属性
          if (targetElement && action.propertyName) {
            updateEditorElement(action.targetElementId, { [action.propertyName]: action.propertyValue });
          }
          break;

        case 'delay':
          // 延迟等待
          if (action.delay) {
            await new Promise(resolve => setTimeout(resolve, action.delay));
          }
          break;

        case 'startPathAnimation':
          // 执行路径动画
          if (currentEditorScene) {
            const pathElement = currentEditorScene.elements.find((el: any) => el.id === action.targetElementId || el.id === action.elementId);
            const animation = pathElement?.pathAnimations?.find((a: any) => a.id === action.pathAnimationId);
            if (pathElement && animation && animation.pathPoints.length >= 2) {
              const points = animation.pathPoints;
              
              // 获取所有子元素
              const allChildren = getAllChildren(pathElement.id, currentEditorScene.elements);
              const initialPositions = new Map<string, { x: number; y: number }>();
              initialPositions.set(pathElement.id, { x: pathElement.x, y: pathElement.y });
              allChildren.forEach((child: any) => {
                initialPositions.set(child.id, { x: child.x, y: child.y });
              });
              
              // 计算父元素的初始中心位置
              const parentCenterX = pathElement.x + pathElement.width / 2;
              const parentCenterY = pathElement.y + pathElement.height / 2;
              
              // 缓动函数
              const easingFunctions: Record<string, (t: number) => number> = {
                linear: (t: number) => t,
                ease: (t: number) => t * t * (3 - 2 * t),
                easeIn: (t: number) => t * t,
                easeOut: (t: number) => t * (2 - t),
                easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
              };
              const easingFn = easingFunctions[animation.easing || 'linear'] || easingFunctions.linear;
              
              // 三次贝塞尔曲线计算
              const cubicBezier = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
                const mt = 1 - t;
                return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
              };
              
              // 计算路径上某点的位置
              const getPointOnPath = (progress: number): { x: number; y: number } => {
                if (points.length === 0) return { x: pathElement.x, y: pathElement.y };
                if (points.length === 1) return { x: points[0].x, y: points[0].y };
                
                const totalSegments = points.length - 1;
                const segmentProgress = progress * totalSegments;
                const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
                const t = segmentProgress - segmentIndex;
                
                const p0 = points[segmentIndex];
                const p3 = points[segmentIndex + 1];
                
                const autoControlOffset = 50;
                const p1 = p0.controlOut 
                  ? { x: p0.x + p0.controlOut.x, y: p0.y + p0.controlOut.y }
                  : { x: p0.x + autoControlOffset, y: p0.y };
                const p2 = p3.controlIn 
                  ? { x: p3.x + p3.controlIn.x, y: p3.y + p3.controlIn.y }
                  : { x: p3.x - autoControlOffset, y: p3.y };
                
                return {
                  x: cubicBezier(p0.x, p1.x, p2.x, p3.x, t),
                  y: cubicBezier(p0.y, p1.y, p2.y, p3.y, t),
                };
              };
              
              const startTime = Date.now() + (animation.delay || 0);
              const duration = animation.duration || 3000;
              let animationId = 0;
              
              const animate = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                
                if (elapsed < 0) {
                  animationId = requestAnimationFrame(animate);
                  return;
                }
                
                let progress = Math.min(elapsed / duration, 1);
                const easedProgress = easingFn(progress);
                const pos = getPointOnPath(easedProgress);
                
                const deltaX = pos.x - parentCenterX;
                const deltaY = pos.y - parentCenterY;
                
                setEditorScenes(prevScenes => prevScenes.map(scene => {
                  if (scene.id !== currentEditorSceneId) return scene;
                  return {
                    ...scene,
                    elements: scene.elements.map((el: any) => {
                      if (el.id === pathElement.id) {
                        const initial = initialPositions.get(el.id);
                        if (!initial) return el;
                        return { ...el, x: initial.x + deltaX, y: initial.y + deltaY };
                      }
                      if (allChildren.some((c: any) => c.id === el.id)) {
                        const initial = initialPositions.get(el.id);
                        if (!initial) return el;
                        return { ...el, x: initial.x + deltaX, y: initial.y + deltaY };
                      }
                      return el;
                    })
                  };
                }));
                
                if (progress < 1) {
                  animationId = requestAnimationFrame(animate);
                } else {
                  pathAnimationRefs.current.delete(pathElement.id);
                }
              };
              
              animationId = requestAnimationFrame(animate);
              pathAnimationRefs.current.set(pathElement.id, { animationFrame: animationId, startTime });
            }
          }
          break;

        default:
          console.log('未知动作类型:', action.type);
      }
    }
  };

  // 检测并触发血量阈值事件
  const checkHealthTriggers = (elementId: string, newHealth: number, maxHealth: number, triggers: HealthTrigger[]) => {
    if (!triggers || triggers.length === 0) return;
    
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
        setEditorScenes(prevScenes => {
          return prevScenes.map(scene => {
            if (scene.id !== currentEditorSceneId) return scene;
            return {
              ...scene,
              elements: scene.elements.map((el: any) => {
                if (el.id !== elementId) return el;
                const updatedTriggers = (el.healthTriggers || []).map((t: HealthTrigger) =>
                  t.id === trigger.id ? { ...t, triggered: true } : t
                );
                return { ...el, healthTriggers: updatedTriggers };
              })
            };
          });
        });
        // 执行动作
        executeEventActions(trigger.actions);
      }
    });
  };

  // 更新编辑器元素的辅助函数
  const updateEditorElement = (elementId: string, updates: any) => {
    setEditorScenes(prevScenes => {
      return prevScenes.map(scene => {
        if (scene.id !== currentEditorSceneId) return scene;
        return {
          ...scene,
          elements: scene.elements.map((el: any) => {
            if (el.id !== elementId) return el;
            const updatedEl = { ...el, ...updates };
            
            // 如果更新了血量，检测触发器
            if (updates.healthValue !== undefined && el.type === 'healthBar') {
              const newHealth = updates.healthValue;
              const maxHealth = el.maxHealth ?? 100;
              const triggers = el.healthTriggers || [];
              // 延迟检测，确保状态更新完成
              setTimeout(() => {
                checkHealthTriggers(elementId, newHealth, maxHealth, triggers);
              }, 0);
            }
            
            return updatedEl;
          })
        };
      });
    });
  };

  // 处理选择
  const handleChoice = (choiceId: string) => {
    const choice = choices.find(c => c.id === choiceId);
    if (!choice) return;

    const nextNode = nodes.find(n => n.id === choice.next_node_id);
    if (!nextNode) return;

    const scene = scenes.find(s => s.id === nextNode.scene_id);

    setGameState(prev => ({
      ...prev,
      currentNode: nextNode,
      currentScene: scene || prev.currentScene,
      choicesMade: [...prev.choicesMade, choiceId],
      showDialogue: true,
      showChoices: false,
      availableChoices: [],
      progress: nextNode.node_type === 'end' ? 100 : prev.progress + 10,
    }));

    // 自动保存
    setTimeout(saveProgress, 500);
  };

  // 获取当前角色
  const getCurrentCharacter = () => {
    const currentNode = gameState.currentNode;
    if (!currentNode?.character_id) return undefined;
    return characters.find(c => c.id === currentNode.character_id);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-white">加载中...</p>
        </div>
      </div>
    );
  }

  // 调试信息：如果没有场景数据
  if (!currentEditorScene && editorScenes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="text-xl mb-4">没有可预览的场景</p>
          <p className="text-sm text-zinc-400 mb-4">请确保：</p>
          <ul className="text-sm text-zinc-400 list-disc list-inside mb-4">
            <li>已在编辑器中添加场景</li>
            <li>场景已启用预览（场景列表中的勾选框）</li>
            <li>已点击保存按钮</li>
          </ul>
          <p className="text-xs text-zinc-500 mb-4">
            项目ID: {storyId}
          </p>
          <p className="text-xs text-zinc-600 mb-4">
            调试信息: editorScenes={editorScenes.length}, currentEditorSceneId={currentEditorSceneId || 'null'}
          </p>
          <button
            onClick={() => {
              // 打印 localStorage 中的数据用于调试
              const savedProjects = JSON.parse(localStorage.getItem('interactive-stories') || '{}');
              console.log('所有保存的项目:', Object.keys(savedProjects));
              console.log('当前项目数据:', savedProjects[storyId]);
              alert(`项目数量: ${Object.keys(savedProjects).length}\n当前项目存在: ${!!savedProjects[storyId]}`);
            }}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg mb-2"
          >
            调试
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            返回编辑器
          </button>
        </div>
      </div>
    );
  }

  // 调试信息：有场景但当前场景未设置
  if (!currentEditorScene) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="text-xl mb-4">加载场景中...</p>
          <p className="text-sm text-zinc-400 mb-4">
            共 {editorScenes.length} 个场景
          </p>
          <button
            onClick={() => {
              if (editorScenes.length > 0) {
                setCurrentEditorSceneId(editorScenes[0].id);
              }
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            加载第一个场景
          </button>
        </div>
      </div>
    );
  }

  // 收集所有视频URL进行预加载
  const allVideoUrls = editorScenes
    .flatMap(scene => scene.elements)
    .filter(el => el.type === 'video' && el.src)
    .map(el => el.src as string);

  return (
    <>
      {/* 视频预加载 */}
      <VideoPreloader videos={allVideoUrls} />
      
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        {/* 编辑器场景 - 优先渲染 */}
        {currentEditorScene && (
        <>
          {/* 全景视频背景 */}
          {(() => {
            const url = currentEditorScene.panoramaVideo;
            console.log('预览 - 全景视频URL:', url);
            const isValidUrl = url && !url.startsWith('blob:') && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'));
            console.log('预览 - 全景视频URL有效:', isValidUrl);
            if (isValidUrl) {
              return (
                <PanoramaVideoViewer
                  videoUrl={url}
                  hotspots={currentEditorScene.elements
                    .filter(el => el.type === 'hotspot' && el.visible)
                    .map(el => ({
                      id: el.id,
                      position: { 
                        x: el.hotspotPosition?.x || 0, 
                        y: el.hotspotPosition?.y || 0, 
                        z: el.hotspotPosition?.z || -100 
                      },
                      label: el.content || el.name || '热点',
                      backgroundColor: el.backgroundColor,
                      color: el.color,
                      opacity: el.opacity,
                      borderColor: el.borderColor,
                      borderWidth: el.borderWidth,
                      iconName: el.iconName,
                      rotation: el.rotation,
                      scale: el.scale,
                      fontSize: el.fontSize,
                      borderRadius: el.borderRadius,
                    }))}
                  onHotspotClick={(hotspotId) => {
                    const hotspot = currentEditorScene.elements.find(el => el.id === hotspotId);
                    // 播放点击动画效果
                    if (hotspot?.clickEffect && hotspot.clickEffect !== 'none') {
                      playClickEffect(hotspotId, hotspot.clickEffect, hotspot.effectDuration || 0.4);
                    }
                    // 播放点击音效
                    if (hotspot?.clickAudio) {
                      playClickAudio(hotspot.clickAudio);
                    }
                    if (hotspot?.events && hotspot.events.length > 0) {
                      const clickEvent = hotspot.events.find((e: any) => e.type === 'click');
                      if (clickEvent?.actions) {
                        executeEventActions(clickEvent.actions, hotspot);
                      }
                    }
                  }}
                />
              );
            }
            return null;
          })()}
          
          {/* 全景图背景 - 使用球体投影实现360度查看 */}
          {(() => {
            const videoUrl = currentEditorScene.panoramaVideo;
            const videoValid = videoUrl && !videoUrl.startsWith('blob:') && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://') || videoUrl.startsWith('/'));
            const imageUrl = currentEditorScene.panoramaImage;
            console.log('=== PanoramaViewer 渲染检查 ===');
            console.log('videoUrl:', videoUrl);
            console.log('videoValid:', videoValid);
            console.log('imageUrl:', imageUrl);
            console.log('imageUrl类型:', typeof imageUrl);
            console.log('imageUrl长度:', imageUrl?.length);
            console.log('imageUrl startsWith https:', imageUrl?.startsWith('https://'));
            
            // 如果有全景图URL就渲染
            const shouldRenderPanorama = imageUrl && imageUrl.length > 0 && imageUrl.startsWith('http');
            console.log('shouldRenderPanorama:', shouldRenderPanorama);
            console.log('最终条件 !videoValid && shouldRenderPanorama:', !videoValid && shouldRenderPanorama);
            
            if (!videoValid && shouldRenderPanorama) {
              console.log('>>> 渲染 PanoramaViewer 组件, imageUrl=', imageUrl?.substring(0, 100));
              return (
                <PanoramaViewer
                  imageUrl={imageUrl}
                  autoRotate={false}
                  hotspots={currentEditorScene.elements
                    .filter(el => el.type === 'hotspot' && el.visible)
                    .map(el => ({
                      id: el.id,
                      position: { 
                        x: el.hotspotPosition?.x || 0, 
                        y: el.hotspotPosition?.y || 0, 
                        z: el.hotspotPosition?.z || -100 
                      },
                      label: el.content || el.name || '热点',
                      backgroundColor: el.backgroundColor,
                      color: el.color,
                      opacity: el.opacity,
                      borderColor: el.borderColor,
                      borderWidth: el.borderWidth,
                      iconName: el.iconName,
                      rotation: el.rotation,
                      scale: el.scale,
                      fontSize: el.fontSize,
                      borderRadius: el.borderRadius,
                    }))}
                  onHotspotClick={(hotspotId) => {
                    // 处理热点点击事件
                    const hotspot = currentEditorScene.elements.find(el => el.id === hotspotId);
                    // 播放点击动画效果
                    if (hotspot?.clickEffect && hotspot.clickEffect !== 'none') {
                      playClickEffect(hotspotId, hotspot.clickEffect, hotspot.effectDuration || 0.4);
                    }
                    // 播放点击音效
                    if (hotspot?.clickAudio) {
                      playClickAudio(hotspot.clickAudio);
                    }
                    if (hotspot?.events && hotspot.events.length > 0) {
                      const clickEvent = hotspot.events.find((e: any) => e.type === 'click');
                      if (clickEvent?.actions) {
                        executeEventActions(clickEvent.actions, hotspot);
                      }
                    }
                  }}
                />
              );
            }
            console.log('>>> 不渲染 PanoramaViewer，返回 null');
            return null;
          })()}
          
          {/* 画布容器 - 保持画布宽高比 */}
          {(() => {
            const canvasW = currentEditorScene.canvasWidth || 1920;
            const canvasH = currentEditorScene.canvasHeight || 1080;
            const aspectRatio = canvasW / canvasH;
            
            // 计算实际显示尺寸
            const containerWidth = windowSize.width;
            const containerHeight = windowSize.height - 64; // 减去顶部栏高度
            const scaleToFit = Math.min(containerWidth / canvasW, containerHeight / canvasH);
            const displayWidth = canvasW * scaleToFit;
            const displayHeight = canvasH * scaleToFit;
            
            // 调试信息
            console.log('=== 画布渲染 ===');
            console.log('canvasW:', canvasW, 'canvasH:', canvasH);
            console.log('containerWidth:', containerWidth, 'containerHeight:', containerHeight);
            console.log('scaleToFit:', scaleToFit);
            console.log('displayWidth:', displayWidth, 'displayHeight:', displayHeight);
            console.log('canvasScale:', canvasScale);
            
            return (
              <div 
                className="absolute top-16 left-0 right-0 bottom-0 flex items-center justify-center overflow-hidden"
                style={{ zIndex: 1 }}
              >
                {/* 使用计算后的实际尺寸，保持画布比例 */}
                <div 
                  className="relative overflow-hidden"
                  style={{
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    isolation: 'isolate',
                    backgroundColor: currentEditorScene.backgroundColor || '#1a1a2e',
                  }}
                >
                  {/* 渲染元素 - 跳过热点类型（热点由 PanoramaViewer 处理） */}
                  {currentEditorScene.elements.map((el, originalIndex) => {
            
            // 调试：打印视频元素信息
            if (el.type === 'video') {
              console.log('=== 视频元素渲染检查 ===');
              console.log('el.id:', el.id);
              console.log('el.visible:', el.visible);
              console.log('el.x:', el.x, 'el.y:', el.y);
              console.log('el.width:', el.width, 'el.height:', el.height);
              console.log('el.src:', el.src?.substring(0, 80) + '...');
              console.log('el.playOnVisible:', el.playOnVisible);
              console.log('el.muted:', el.muted);
              console.log('URL验证:', validateVideoUrl(el.src));
              console.log('canvasW:', canvasW, 'canvasH:', canvasH);
            }
            
            // 如果元素尺寸为0，跳过渲染
            if (!el.width || !el.height || el.width <= 0 || el.height <= 0) {
              if (el.type === 'video') {
                console.log('视频元素尺寸无效，跳过渲染');
              }
              return null;
            }
            
            // 检查该元素是否会被某个时间触发器显示（如果是，则初始隐藏）
            const willBeShownByTrigger = currentEditorScene.elements.some(
              (otherEl) => otherEl.type === 'video' && 
              otherEl.timeTriggers?.some(
                (trigger) => trigger.actions?.some(
                  (action: any) => action.type === 'showElement' && action.targetElementId === el.id
                )
              )
            );
            
            // 音频和热点类型不渲染
            if (el.type === 'hotspot' || el.type === 'audio') return null;
            
            // 如果元素会被触发器显示，检查是否已被触发
            if (willBeShownByTrigger) {
              // 等待触发器显示的元素：只有在 triggeredShownElements 中才渲染
              // 同时也要检查 visible 属性（可能被 hideElement 动作隐藏）
              if (!triggeredShownElements.has(el.id)) return null;
            }
            
            // 普通元素或已被触发的元素：检查 visible 属性
            // 如果 visible 显式为 false，不渲染（不占用空间，不与鼠标交互）
            // 注意：visible 为 undefined 或 true 时都应该渲染
            if (el.visible === false) return null;
            
            // 图片和视频元素如果没有有效的 src，不渲染（避免遮挡其他元素）
            if (el.type === 'image' && (!el.src || !validateVideoUrl(el.src).isValid)) return null;
            if (el.type === 'video' && (!el.src || !validateVideoUrl(el.src).isValid)) return null;
            
            // 使用外层定义的 canvasW 和 canvasH
            // z-index 基于元素在数组中的位置，索引越大越在上层（列表底部 = 画布最上层）
            const elementZIndex = 10 + originalIndex;
            
            // 计算锚点偏移
            // 优先使用新的 anchorX/anchorY（百分比），否则使用旧的 anchorPoint 预设
            let offsetX = 0;
            let offsetY = 0;
            let transformOrigin = '50% 50%';
            
            if (el.anchorX !== undefined && el.anchorY !== undefined) {
              // 新的百分比锚点
              offsetX = (el.anchorX / 100) * el.width;
              offsetY = (el.anchorY / 100) * el.height;
              transformOrigin = `${el.anchorX}% ${el.anchorY}%`;
            } else if (el.anchorPoint) {
              // 旧的预设锚点
              const anchorOffsets: Record<string, { x: number; y: number }> = {
                'top-left': { x: 0, y: 0 },
                'top-center': { x: el.width / 2, y: 0 },
                'top-right': { x: el.width, y: 0 },
                'center-left': { x: 0, y: el.height / 2 },
                'center': { x: el.width / 2, y: el.height / 2 },
                'center-right': { x: el.width, y: el.height / 2 },
                'bottom-left': { x: 0, y: el.height },
                'bottom-center': { x: el.width / 2, y: el.height },
                'bottom-right': { x: el.width, y: el.height },
              };
              const offset = anchorOffsets[el.anchorPoint] || { x: 0, y: 0 };
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
              transformOrigin = anchorToOrigin[el.anchorPoint] || '50% 50%';
            }
            
            return (
            <div
              key={el.id}
              data-element-id={el.id}
              className="absolute"
              style={{
                left: `${((el.x - offsetX) / canvasW) * 100}%`,
                top: `${((el.y - offsetY) / canvasH) * 100}%`,
                width: `${(el.width / canvasW) * 100}%`,
                height: `${(el.height / canvasH) * 100}%`,
                backgroundColor: ['video', 'image', 'choiceItem'].includes(el.type) ? 'transparent' : 
                  (el.backgroundColor === '#FFFFFF' || el.backgroundColor === '#ffffff' || el.backgroundColor === 'white' || el.backgroundColor === '#fff' 
                    ? '#6B21A8' // 白色背景强制改为深紫色
                    : (el.backgroundColor || '#6B21A8')),
                color: el.color || '#FFFFFF', // 默认白色文字
                fontSize: `${(el.fontSize || 14) * scaleToFit}px`, // 根据画布缩放调整字体大小
                borderRadius: (el.borderRadius || 0) * scaleToFit,
                opacity: el.opacity,
                border: ['video', 'image'].includes(el.type) ? 'none' : (el.borderWidth ? `${(el.borderWidth || 1) * scaleToFit}px solid ${el.borderColor}` : 'none'),
                boxShadow: ['video', 'image'].includes(el.type) ? 'none' : el.boxShadow,
                display: ['video', 'image'].includes(el.type) ? 'block' : 'flex',
                alignItems: 'center',
                justifyContent: el.type === 'text' ? (el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center') : 'center',
                fontWeight: el.fontWeight || '500',
                padding: el.type === 'text' ? `${8 * scaleToFit}px` : (el.type === 'video' || el.type === 'image' || el.type === 'choiceItem' ? '0' : `0 ${16 * scaleToFit}px`),
                gap: el.iconName ? `${8 * scaleToFit}px` : '0',
                overflow: 'hidden',
                zIndex: elementZIndex,
                // 视频元素：只有有事件时才响应点击（控制条由 video 标签内部处理）
                // 图片元素：只有有事件时才响应点击
                pointerEvents: (el.type === 'video' || el.type === 'image')
                  ? ((el.events && el.events.length > 0) ? 'auto' : 'none')
                  : 'auto',
                transformOrigin: transformOrigin,
                transform: `rotate(${el.rotation || 0}deg) scale(${el.scale || 1})`,
              }}
              onClick={() => {
                // 视频和图片元素只有在有事件时才响应点击
                if ((el.type === 'video' || el.type === 'image') && (!el.events || el.events.length === 0)) {
                  return;
                }
                // 播放点击动画效果
                if (el.clickEffect && el.clickEffect !== 'none') {
                  playClickEffect(el.id, el.clickEffect, el.effectDuration || 0.4);
                }
                // 播放点击音效
                if (el.clickAudio) {
                  playClickAudio(el.clickAudio);
                }
                // 处理元素事件
                if (el.events && el.events.length > 0) {
                  const clickEvent = el.events.find((e: any) => e.type === 'click');
                  if (clickEvent && clickEvent.actions) {
                    executeEventActions(clickEvent.actions, el);
                  }
                }
              }}
            >
              {el.type === 'text' && (
                <span style={{ width: '100%', textAlign: el.textAlign || 'center' }}>
                  {el.content}
                </span>
              )}
              {el.type === 'button' && (
                <>
                  {el.iconName && el.iconPosition !== 'right' && getIconComponent(el.iconName, 16 * scaleToFit)}
                  <span style={{ color: el.color || '#FFFFFF' }}>{el.content}</span>
                  {el.iconName && el.iconPosition === 'right' && getIconComponent(el.iconName, 16 * scaleToFit)}
                </>
              )}
              {el.type === 'image' && el.src && validateVideoUrl(el.src).isValid && (
                <img 
                  src={el.src} 
                  alt="" 
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%', 
                    height: '100%', 
                    objectFit: el.objectFit || 'cover',
                    objectPosition: 'center',
                    borderRadius: el.borderRadius,
                    border: 'none',
                    outline: 'none',
                    display: 'block',
                    backgroundColor: el.backgroundColor || 'transparent'
                  }} 
                  onError={(e) => {
                    // 图片加载失败时显示背景色
                    console.warn('图片加载失败:', el.src);
                  }} 
                />
              )}
              {el.type === 'video' && el.src && validateVideoUrl(el.src).isValid && (
                <VideoElement 
                  key={`${currentEditorSceneId}-${el.id}`}
                  src={el.src}
                  playOnVisible={el.playOnVisible !== false}
                  loop={el.loop}
                  muted={el.muted}
                  controls={el.controls}
                  borderRadius={el.borderRadius}
                  objectFit={el.objectFit}
                  timeTriggers={el.timeTriggers}
                  onTimeTrigger={(trigger) => {
                    // 执行时间触发器的动作
                    if (trigger.actions && trigger.actions.length > 0) {
                      // 对于 showElement 动作，同时标记元素为已触发
                      trigger.actions.forEach((action: any) => {
                        if (action.type === 'showElement' && action.targetElementId) {
                          markElementAsTriggered(action.targetElementId);
                        }
                      });
                      executeEventActions(trigger.actions, el);
                    }
                  }}
                />
              )}
              {/* 标签组件 */}
              {el.type === 'label' && (() => {
                const subType = el.labelSubType || 'icon';
                const content = el.content || '标签';
                
                switch (subType) {
                  case 'icon':
                    return (
                      <div className="w-full h-full flex items-center justify-center gap-1.5 px-2">
                        <Tag className="w-3.5 h-3.5" style={{ width: '1.5em', height: '1.5em' }} />
                        <span className="text-xs font-medium truncate">{content}</span>
                      </div>
                    );
                  
                  case 'hotspot':
                    return (
                      <div className="w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500/80 to-red-500/80 border-2 border-orange-300/50">
                        <span className="text-xs font-bold text-white drop-shadow-sm">{content}</span>
                      </div>
                    );
                  
                  case 'text':
                    return (
                      <div className="w-full h-full flex items-center justify-center px-2">
                        <span className="text-sm font-medium">{content}</span>
                      </div>
                    );
                  
                  case 'text2d':
                    return (
                      <div className="w-full h-full flex items-center justify-center px-3 bg-zinc-800/80 rounded">
                        <span className="text-sm font-medium text-white">{content}</span>
                      </div>
                    );
                  
                  case 'ui':
                    return (
                      <div className="w-full h-full flex items-center justify-between px-2 bg-blue-500/20 border border-blue-400/30 rounded">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                          <span className="text-xs font-medium text-blue-300">{content}</span>
                        </div>
                      </div>
                    );
                  
                  case 'number':
                    return (
                      <div className="w-full h-full flex items-center justify-center rounded-full bg-emerald-500/80 border-2 border-emerald-300/50">
                        <span className="text-sm font-bold text-white">{content}</span>
                      </div>
                    );
                  
                  case 'bubble':
                    return (
                      <div className="w-full h-full flex items-center justify-center px-3 relative">
                        <div className="w-full h-full flex items-center justify-center bg-white/90 rounded-2xl px-2">
                          <span className="text-xs font-medium text-zinc-800">{content}</span>
                        </div>
                      </div>
                    );
                  
                  case 'dialog':
                    return (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800/95 border border-zinc-600 rounded-lg shadow-xl p-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <MessageCircle className="w-2.5 h-2.5 text-zinc-400" />
                          <span className="text-[10px] text-zinc-400">对话</span>
                        </div>
                        <span className="text-xs font-medium text-zinc-200">{content}</span>
                      </div>
                    );
                  
                  default:
                    return (
                      <div className="w-full h-full flex items-center justify-center px-2">
                        <span className="text-xs">{content}</span>
                      </div>
                    );
                }
              })()}
              {/* 血条组件 */}
              {el.type === 'healthBar' && (
                <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', gap: `${8 * scaleToFit}px`, padding: `0 ${8 * scaleToFit}px` }}>
                  {/* 血条背景 */}
                  <div 
                    style={{ flex: 1, height: '100%', minHeight: `${4 * scaleToFit}px`, backgroundColor: el.healthBarBgColor || '#374151', borderRadius: 4 * scaleToFit, overflow: 'hidden', position: 'relative' }}
                  >
                    {/* 当前血量 */}
                    <div
                      style={{
                        height: '100%',
                        width: `${((el.healthValue ?? 100) / (el.maxHealth ?? 100)) * 100}%`,
                        backgroundColor: ((el.healthValue ?? 100) / (el.maxHealth ?? 100)) * 100 <= (el.lowHealthThreshold || 30)
                          ? (el.lowHealthColor || '#EF4444')
                          : (el.healthBarColor || '#22C55E'),
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  {/* 血量文字 */}
                  {el.showHealthText !== false && (
                    <span style={{ fontSize: `${12 * scaleToFit}px`, fontWeight: 500, flexShrink: 0, color: el.color || '#FFFFFF', minWidth: `${40 * scaleToFit}px`, textAlign: 'right' }}>
                      {el.healthValue ?? 100}/{el.maxHealth ?? 100}
                    </span>
                  )}
                </div>
              )}
              {/* 选择项组件 */}
              {el.type === 'choiceItem' && (() => {
                const isSelected = selectedChoices.has(el.id);
                return (
                <div 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: `0 ${16 * scaleToFit}px`, 
                    gap: `${8 * scaleToFit}px`, 
                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.1)', 
                    borderRadius: 8 * scaleToFit, 
                    border: `${2 * scaleToFit}px solid ${isSelected ? '#8B5CF6' : 'rgba(255,255,255,0.3)'}`,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s, border-color 0.2s',
                  }}
                  onClick={() => {
                    // 切换选中状态
                    setSelectedChoices(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(el.id)) {
                        newSet.delete(el.id);
                      } else {
                        newSet.add(el.id);
                      }
                      return newSet;
                    });
                    
                    // 只有首次点击时才执行动作
                    if (!executedChoices.has(el.id)) {
                      const actions = el.clickActions || [];
                      if (actions.length > 0) {
                        executeEventActions(actions, el);
                        // 标记为已执行
                        setExecutedChoices(prev => new Set(prev).add(el.id));
                      }
                    }
                  }}
                >
                  <div style={{ 
                    width: 16 * scaleToFit, 
                    height: 16 * scaleToFit, 
                    borderRadius: 4 * scaleToFit, 
                    border: `${2 * scaleToFit}px solid ${isSelected ? '#8B5CF6' : 'rgba(255,255,255,0.5)'}`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0,
                    backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                    transition: 'all 0.2s',
                  }}>
                    {isSelected && (
                      <svg width={12 * scaleToFit} height={12 * scaleToFit} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: `${14 * scaleToFit}px`, fontWeight: 500, color: isSelected ? '#fff' : '#E4E4E7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.content || '选项文字'}</span>
                </div>
              )})()}
            </div>
          )})}
                </div>
              </div>
            );
          })()}
          
          {/* 音频元素 - 不可见但播放 */}
          {currentEditorScene.elements.filter(el => el.visible && el.type === 'audio' && el.src).map((el) => (
            <audio
              key={el.id}
              src={el.src}
              autoPlay={el.playOnVisible !== false}
              loop={el.loop === true}
              muted={isMuted}
              style={{ display: 'none' }}
            />
          ))}
          
          {/* 场景切换指示 */}
          
        </>
        )}
        
        {/* 非编辑器场景 - 使用游戏场景的全景图 */}
        {!currentEditorScene && gameState.currentScene && (
          <PanoramaViewer
            imageUrl={gameState.currentScene.panorama_image}
            autoRotate={false}
            hotspots={[]}
          />
        )}

      {/* 顶部UI */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-between">
          {/* 左侧：返回和主页 */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="bg-black/40 text-white hover:bg-black/60"
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>

          {/* 中间：标题和进度 */}
          <div className="flex-1 mx-4">
            {story && (
              <div className="text-center">
                <h1 className="text-lg font-bold text-white mb-1">{story.title}</h1>
                <div className="flex items-center gap-2">
                  <Progress value={gameState.progress} className="h-2 flex-1" />
                  <span className="text-xs text-white/80">{gameState.progress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：音量和设置 */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="bg-black/40 text-white hover:bg-black/60"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/40 text-white hover:bg-black/60"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 对话框 */}
      {gameState.showDialogue && gameState.currentNode && (
        <DialogueBox
          character={getCurrentCharacter()}
          content={gameState.currentNode.content}
          onComplete={handleDialogueComplete}
        />
      )}

      {/* 选择面板 */}
      {gameState.showChoices && gameState.availableChoices.length > 0 && (
        <ChoicePanel
          choices={gameState.availableChoices.map(c => ({
            id: c.id,
            text: c.choice_text,
          }))}
          onChoice={handleChoice}
        />
      )}

      {/* 故事结束画面 */}
      {gameState.progress === 100 && !gameState.showDialogue && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">故事结束</h2>
            <p className="mb-8 text-lg text-gray-300">感谢体验《{story?.title}》</p>
            <Button
              onClick={() => {
                loadDemoData();
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              重新开始
            </Button>
          </div>
        </div>
      )}

      {/* 调试面板 - 显示视频元素信息 */}
      <div className="absolute bottom-4 left-4 z-50 bg-black/80 text-white p-3 rounded text-xs max-w-xs">
        <div className="font-bold mb-1">调试信息:</div>
        <div>场景数: {editorScenes.length}</div>
        <div>当前场景: {currentEditorSceneId || '无'}</div>
        <div>视频元素数: {currentEditorScene?.elements?.filter(e => e.type === 'video').length || 0}</div>
        {currentEditorScene?.elements?.filter(e => e.type === 'video').map((v, i) => (
          <div key={i} className="mt-1 border-t border-white/20 pt-1">
            <div>视频{i+1}: {v.width}x{v.height}</div>
            <div>visible: {String(v.visible)}</div>
            <div>playOnVisible: {String(v.playOnVisible)}</div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

// 导出的页面组件，包含 Suspense boundary
export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    }>
      <GamePageContent />
    </Suspense>
  );
}

