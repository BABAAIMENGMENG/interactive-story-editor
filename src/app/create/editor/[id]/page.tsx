'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Save,
  Play,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Type,
  Image,
  Circle,
  Square,
  Video,
  Music,
  Box,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MousePointer2,
  FolderTree,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Upload,
  Link2,
  Download,
  Globe,
  ImageIcon,
  Film,
  Settings,
  FileVideo,
  PlayCircle,
  Volume2,
  VolumeX,
  Repeat,
  MousePointerClick,
  Move,
  Palette,
  Timer,
  Clock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sun,
  Moon,
  Star,
  Heart,
  ThumbsUp,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Layers,
  Sparkles,
  Layout,
  Tag,
  MessageCircle,
  Share2,
  Zap,
  Copy as CopyIcon,
  Check as CheckIcon,
  Route,
  Edit3,
  ToggleRight,
} from 'lucide-react';
import EditorPanoramaViewer from '@/components/panorama/EditorPanoramaViewer';
import TransparentVideo from '@/components/ui/transparent-video';

// 辅助函数：将十六进制颜色转换为 rgba
function hexToRgba(hex: string, alpha: number): string {
  // 处理简写格式 #fff -> #ffffff
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

// 生成动画CSS样式
function getAnimationStyle(element: any, isPreviewing: boolean): React.CSSProperties {
  const duration = element.animationDuration || 1;
  const delay = element.animationDelay || 0;
  const easing = element.easingType || 'easeInOut';
  const transitionType = element.transitionType || 'fade';
  
  // 将插值类型转换为CSS timing-function
  const easingMap: Record<string, string> = {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    scroll: 'linear',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    back: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };
  
  const cssEasing = easingMap[easing] || 'ease-in-out';
  const transition = `all ${duration}s ${cssEasing} ${delay}s`;
  
  // 如果正在预览动画，设置初始状态（transition会自动过渡到最终状态）
  if (isPreviewing) {
    const initialStyles: Record<string, React.CSSProperties> = {
      fade: { opacity: 0 },
      slide: { opacity: 0, transform: 'translateY(30px)' },
      slideLeft: { opacity: 0, transform: 'translateX(-30px)' },
      slideRight: { opacity: 0, transform: 'translateX(30px)' },
      slideUp: { opacity: 0, transform: 'translateY(30px)' },
      slideDown: { opacity: 0, transform: 'translateY(-30px)' },
      zoom: { opacity: 0, transform: 'scale(0.5)' },
      flip: { opacity: 0, transform: 'rotateY(90deg)' },
      rotate: { opacity: 0, transform: 'rotate(180deg)' },
      bounce: { opacity: 0, transform: 'scale(0.3)' },
      pulse: { transform: 'scale(1)' },
      shake: { transform: 'translateX(0)' },
    };
    
    return {
      ...initialStyles[transitionType] || { opacity: 0 },
      transition,
    };
  }
  
  return {};
}

// 元素类型
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

// 属性面板标签类型
type PropertyTab = 'source' | 'style' | 'behavior' | 'event';

// 媒体资源
interface MediaResource {
  id: string;
  name: string;
  type: 'image' | 'video' | 'panorama' | 'panoramaVideo' | 'audio';
  url: string;
  thumbnail?: string;
  size?: number;
  duration?: number;
}

// 按钮样式预设
interface ButtonPreset {
  name: string;
  style: {
    backgroundColor: string;
    color: string;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    boxShadow: string;
  };
}

const buttonPresets: ButtonPreset[] = [
  { name: '经典紫', style: { backgroundColor: '#8B5CF6', color: '#FFFFFF', borderRadius: 8, borderWidth: 0, borderColor: 'transparent', boxShadow: 'none' } },
  { name: '渐变蓝', style: { backgroundColor: '#3B82F6', color: '#FFFFFF', borderRadius: 24, borderWidth: 0, borderColor: 'transparent', boxShadow: '0 4px 14px rgba(59,130,246,0.4)' } },
  { name: '简约白', style: { backgroundColor: '#FFFFFF', color: '#1F2937', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', boxShadow: 'none' } },
  { name: '深色', style: { backgroundColor: '#1F2937', color: '#FFFFFF', borderRadius: 8, borderWidth: 0, borderColor: 'transparent', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' } },
  { name: '透明', style: { backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', boxShadow: 'none' } },
  { name: '霓虹', style: { backgroundColor: 'transparent', color: '#F472B6', borderRadius: 8, borderWidth: 2, borderColor: '#F472B6', boxShadow: '0 0 20px rgba(244,114,182,0.5)' } },
];

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

// 视频URL验证结果
interface VideoValidationResult {
  isValid: boolean;
  errorType?: 'empty' | 'blob' | 'streaming_site' | 'invalid_format';
  errorMessage?: string;
}

// 验证视频URL是否有效
function validateVideoUrl(url: string | undefined | null): VideoValidationResult {
  // 空值检查
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: false, errorType: 'empty', errorMessage: '未设置视频源' };
  }
  
  // blob URL 检查
  if (url.startsWith('blob:')) {
    return { isValid: false, errorType: 'blob', errorMessage: '无效的临时链接' };
  }
  
  // URL格式检查
  const isValidFormat = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  if (!isValidFormat) {
    return { isValid: false, errorType: 'invalid_format', errorMessage: '无效的URL格式' };
  }
  
  // 流媒体网站检查
  try {
    const urlObj = new URL(url, url.startsWith('/') ? 'http://localhost' : undefined);
    const hostname = urlObj.hostname.toLowerCase();
    
    for (const domain of STREAMING_SITE_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return { 
          isValid: false, 
          errorType: 'streaming_site', 
          errorMessage: '流媒体网站链接不可用，请使用直链视频地址' 
        };
      }
    }
  } catch {
    // URL解析失败，可能是相对路径，继续验证
  }
  
  return { isValid: true };
}

// 按钮图标选项
const buttonIcons = [
  { name: '无', icon: null },
  { name: '箭头', icon: <ChevronRight className="w-4 h-4" /> },
  { name: '外部链接', icon: <ExternalLink className="w-4 h-4" /> },
  { name: '对勾', icon: <Check className="w-4 h-4" /> },
  { name: '星星', icon: <Star className="w-4 h-4" /> },
  { name: '爱心', icon: <Heart className="w-4 h-4" /> },
  { name: '点赞', icon: <ThumbsUp className="w-4 h-4" /> },
  { name: '太阳', icon: <Sun className="w-4 h-4" /> },
  { name: '月亮', icon: <Moon className="w-4 h-4" /> },
];

// 事件动作
// 事件动作类型
type EventActionType = 
  | 'jumpScene'      // 跳转场景
  | 'showElement'    // 显示元素
  | 'hideElement'    // 隐藏元素
  | 'toggleElement'  // 切换元素可见性
  | 'playAudio'      // 播放音频
  | 'pauseAudio'     // 暂停音频
  | 'playVideo'      // 播放视频
  | 'pauseVideo'     // 暂停视频
  | 'stopMedia'      // 停止媒体播放
  | 'delay'          // 延迟
  | 'setProperty'    // 设置元素属性
  | 'animate'        // 执行动画
  | 'moveTo'         // 移动到位置
  | 'scaleTo'        // 缩放到
  | 'rotateTo'       // 旋转到
  | 'setOpacity'     // 设置透明度
  | 'setVolume'      // 设置音量
  | 'seekTo'         // 跳转到播放位置
  | 'addHealth'      // 加血
  | 'reduceHealth'   // 减血
  | 'setHealth'      // 设置血量
  | 'checkAnswer'    // 检查答案
  | 'startPathAnimation'; // 执行路径动画

// 事件动作
interface EventAction {
  id: string;  // 动作唯一ID
  type: EventActionType;
  // 目标
  targetSceneId?: string;     // 目标场景ID
  targetElementId?: string;   // 目标元素ID
  // 数值参数
  delay?: number;             // 延迟时间(ms)
  value?: number;             // 通用数值(透明度、音量、缩放、旋转角度、播放位置等)
  // 位置参数
  position?: { x: number; y: number };  // 移动目标位置
  // 属性设置
  propertyName?: string;      // 要设置的属性名
  propertyValue?: any;        // 要设置的属性值
  // 动画参数
  animationType?: 'fade' | 'slide' | 'zoom' | 'bounce' | 'shake' | 'pulse';
  animationDuration?: number; // 动画持续时间(ms)
  animationEasing?: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut';
  // 音频/视频参数
  audioUrl?: string;          // 音频URL（直接播放，不需要元素）
  videoUrl?: string;          // 视频URL（直接播放，不需要元素）
  volume?: number;            // 音量 (0-100)
  loop?: boolean;             // 是否循环
  muted?: boolean;            // 是否静音
  // 血条/游戏参数
  healthValue?: number;       // 血量变化值（正数加血，负数减血）
  isCorrectAnswer?: boolean;  // 是否是正确答案
  successSceneId?: string;    // 答对跳转场景
  failSceneId?: string;       // 答错跳转场景
  // 路径动画参数
  pathAnimationId?: string;   // 路径动画ID
}

// 元素事件
interface ElementEvent {
  type: 'click' | 'hover' | 'longPress';
  actions: EventAction[];
}

// 视频时间触发器
interface VideoTimeTrigger {
  id: string;           // 触发器唯一ID
  time: number;         // 触发时间（秒）
  actions: EventAction[]; // 触发的动作列表
  description?: string; // 触发器描述
}

// 血量阈值触发器
interface HealthTrigger {
  id: string;           // 触发器唯一ID
  threshold: number;    // 血量阈值（百分比，0-100）
  triggerType: 'below' | 'above' | 'equals'; // 触发条件：低于/高于/等于
  actions: EventAction[]; // 触发的动作列表
  description?: string; // 触发器描述
  triggered?: boolean;  // 是否已触发（运行时状态）
}

// 路径点 - 简化版，支持自动平滑曲线
interface PathPoint {
  id: string;           // 路径点唯一ID
  x: number;            // X坐标
  y: number;            // Y坐标
  // 贝塞尔曲线控制点（可选，不设置时自动计算平滑曲线）
  controlIn?: { x: number; y: number };   // 入方向控制点（相对于路径点）
  controlOut?: { x: number; y: number };  // 出方向控制点（相对于路径点）
}

// 元素路径配置 - 简化版，每个元素只有一条路径
interface ElementPath {
  points: PathPoint[];  // 路径点列表
  enabled: boolean;     // 是否启用路径
  // 动画配置
  duration: number;     // 动画持续时间(ms)
  easing: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut';
  loopMode: 'none' | 'loop' | 'alternate'; // 循环模式
  autoPlay: boolean;    // 是否自动播放
  delay: number;        // 动画延迟(ms)
  // 路径跟随选项
  orientToPath?: boolean; // 是否朝向路径方向
}

// 保留旧的 PathAnimation 用于向后兼容
interface PathAnimation {
  id: string;           // 动画唯一ID
  name: string;         // 动画名称
  pathPoints: PathPoint[]; // 路径点列表
  duration: number;     // 动画持续时间(ms)
  easing: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut';
  loopMode: 'none' | 'loop' | 'alternate'; // 循环模式：无循环、循环、往返
  loopCount?: number;   // 循环次数（-1为无限循环）
  autoPlay: boolean;    // 是否自动播放
  delay: number;        // 动画延迟(ms)
}

// 画布元素
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
  // 样式
  backgroundColor: string;
  backgroundOpacity?: number; // 背景透明度 0-1
  color: string;
  fontSize: number;
  borderRadius: number;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  boxShadow: string;
  boxShadowType?: string;
  // 按钮特有
  hoverBackgroundColor?: string;
  hoverScale?: number;
  iconName?: string;
  iconPosition?: 'left' | 'right';
  // 文本特有
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  fontFamily?: string;
  // 字体颜色状态
  hoverColor?: string;
  activeColor?: string;
  // 文字阴影
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  // 文字描边
  textStrokeSize?: number;
  textStrokeColor?: string;
  // 动效属性
  clickEffect?: 'none' | 'ripple' | 'pulse' | 'bounce' | 'shake' | 'flash';
  effectDuration?: number;
  animationOnStart?: boolean;
  animationOnHover?: boolean;
  animationOnEnter?: boolean;
  animationLoop?: boolean;
  animationDuration?: number;
  animationDelay?: number;
  easingType?: 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut' | 'scroll' | 'bounce' | 'elastic' | 'back';
  transitionType?: 'fade' | 'slide' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown' | 'zoom' | 'flip' | 'rotate' | 'bounce' | 'pulse' | 'shake';
  // 变换选项
  rotation?: number;
  scale?: number;
  // 锚点位置 - 元素内部的变换中心点（0-100%），x,y 坐标就是锚点在画布上的位置
  anchorX?: number; // 锚点水平位置，0=左边，50=中心，100=右边
  anchorY?: number; // 锚点垂直位置，0=上边，50=中心，100=下边
  // 旧的锚点预设（保留向后兼容）
  anchorPoint?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  // 图片特有
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  // 视频/音频特有
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playOnVisible?: boolean;
  pauseOnHidden?: boolean;
  draggable?: boolean;
  enableTransparency?: boolean; // 是否启用透明通道（支持WebM透明视频）
  // 内容
  content: string;
  src?: string;
  // 热点特有 - 3D空间位置
  hotspotPosition?: { x: number; y: number; z: number };
  // 事件
  events: ElementEvent[];
  // 原始布局（用于还原）
  originalLayout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // 是否处于最大化状态
  isMaximized?: boolean;
  // 层级关系
  parentId?: string; // 父元素ID
  // 标签子类型
  labelSubType?: LabelSubType;
  // 点击音效
  clickAudio?: string; // 点击时播放的音效URL
  // 视频时间触发器
  timeTriggers?: VideoTimeTrigger[]; // 视频播放到指定时间时触发的动作
  // 血条特有属性
  healthValue?: number;       // 当前血量
  maxHealth?: number;         // 最大血量
  healthBarColor?: string;    // 血条颜色
  healthBarBgColor?: string;  // 血条背景颜色
  lowHealthThreshold?: number; // 低血量阈值（百分比）
  lowHealthColor?: string;    // 低血量颜色
  showHealthText?: boolean;   // 是否显示血量文字
  healthTriggers?: HealthTrigger[]; // 血量阈值触发器
  // 选择项特有属性
  isSelected?: boolean;       // 选中状态（用于事件配置）
  clickActions?: EventAction[]; // 点击时触发的动作序列
  // 路径动画 - 简化版，直接在画布上绘制
  path?: ElementPath;         // 元素的移动路径
  // 旧版路径动画（保留向后兼容）
  pathAnimations?: PathAnimation[]; // 元素的路径动画列表
  // children 通过计算得出，不需要存储
}

// 场景
interface Scene {
  id: string;
  name: string;
  backgroundColor: string;
  panoramaImage: string;
  panoramaVideo: string;
  elements: CanvasElement[];
  transition: 'fade' | 'slide' | 'zoom' | 'dissolve' | 'wipe' | 'flip' | 'blur' | 'none';
  previewEnabled: boolean; // 是否在预览中显示
  canvasWidth: number; // 画布宽度
  canvasHeight: number; // 画布高度
  // 画布锚点 - 控制画布在视口中的对齐方式
  canvasAnchorX?: number; // 画布锚点水平位置，0=左边，50=中心，100=右边
  canvasAnchorY?: number; // 画布锚点垂直位置，0=上边，50=中心，100=下边
}

// 画布尺寸预设
const CANVAS_PRESETS = [
  { name: '横屏 16:9', width: 1920, height: 1080, icon: '🖥️' },
  { name: '竖屏 9:16', width: 1080, height: 1920, icon: '📱' },
  { name: '正方形 1:1', width: 1080, height: 1080, icon: '⬜' },
  { name: '横屏 4:3', width: 1440, height: 1080, icon: '📺' },
  { name: '竖屏 3:4', width: 810, height: 1080, icon: '📱' },
  { name: '自定义', width: 0, height: 0, icon: '⚙️' },
];

// 元素图标
const elementIcons: Record<ElementType, React.ReactNode> = {
  button: <Box className="w-5 h-5" />,
  text: <Type className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
  hotspot: <Circle className="w-5 h-5" />,
  panel: <Square className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  audio: <Music className="w-5 h-5" />,
  divider: <div className="w-5 h-5 flex items-center justify-center"><div className="w-4 h-0.5 bg-current rounded" /></div>,
  tooltip: <div className="w-5 h-5 flex items-center justify-center text-xs" suppressHydrationWarning>💬</div>,
  label: <Tag className="w-5 h-5" />,
  healthBar: <Heart className="w-5 h-5" />,
  choiceItem: <Check className="w-5 h-5" />,
};

// 标签子类型图标
const labelSubTypeIcons: Record<LabelSubType, React.ReactNode> = {
  icon: <Tag className="w-4 h-4" />,
  hotspot: <Circle className="w-4 h-4" />,
  text: <Type className="w-4 h-4" />,
  text2d: <div className="w-4 h-4 flex items-center justify-center text-[10px] font-bold">T</div>,
  ui: <div className="w-4 h-4 rounded bg-blue-500/30" />,
  uiAnnotation: <ChevronRight className="w-4 h-4" />,
  panel: <Square className="w-4 h-4" />,
  hud: <div className="w-4 h-4 rounded border border-cyan-400/50" />,
  number: <div className="w-4 h-4 rounded-full bg-emerald-500/30 flex items-center justify-center text-[8px]">1</div>,
  summary: <div className="w-4 h-4 border-l-2 border-violet-400" />,
  style: <Palette className="w-4 h-4" />,
  bubble: <MessageCircle className="w-4 h-4" />,
  dialog: <MessageCircle className="w-4 h-4" />,
};

// 标签子类型名称
const labelSubTypeNames: Record<LabelSubType, string> = {
  icon: '图标标签',
  hotspot: '热点标签',
  text: '文字标签',
  text2d: '2D文字',
  ui: 'UI标签',
  uiAnnotation: 'UI标注',
  panel: '面板标签',
  hud: 'HUD面板',
  number: '数字标注',
  summary: '概注',
  style: '样式注记',
  bubble: '气泡注记',
  dialog: '对话框注记',
};

// 元素名称
const elementNames: Record<ElementType, string> = {
  button: '按钮',
  text: '文本',
  image: '图片',
  hotspot: '热点',
  panel: '面板',
  video: '视频',
  audio: '音频',
  divider: '分割线',
  tooltip: '提示框',
  label: '标签',
  healthBar: '血条',
  choiceItem: '选择项',
};

// 元素默认值
const defaultElement = {
  visible: true,
  locked: false,
  backgroundColor: '#6B21A8', // 默认紫色背景（深色，白色文字可见）
  backgroundOpacity: 1, // 背景透明度
  color: '#FFFFFF', // 默认白色文字
  fontSize: 16,
  borderRadius: 8,
  opacity: 1,
  borderColor: 'transparent',
  borderWidth: 0,
  borderStyle: 'solid' as const,
  boxShadow: 'none',
  boxShadowType: 'none',
  content: '',
  events: [] as ElementEvent[],
  hoverBackgroundColor: '#7C3AED',
  hoverScale: 1.05,
  iconName: '',
  iconPosition: 'left' as const,
  fontWeight: '500',
  textAlign: 'center' as const,
  lineHeight: 1.5,
  fontFamily: '',
  hoverColor: '#FFFFFF',
  activeColor: '#E0E0E0',
  shadowColor: 'transparent',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
  textStrokeSize: 0,
  textStrokeColor: '#000000',
  clickEffect: 'none' as 'none' | 'ripple' | 'pulse' | 'bounce' | 'shake' | 'flash',
  effectDuration: 0.3,
  animationOnStart: false,
  animationOnHover: false,
  animationOnEnter: false,
  animationLoop: false,
  animationDuration: 1,
  animationDelay: 0,
  easingType: 'easeInOut' as const,
  transitionType: 'fade' as const,
  rotation: 0,
  scale: 1,
  objectFit: 'cover' as const,
  autoplay: false,
  loop: false,
  muted: true, // 默认静音（浏览器限制：非静音视频不能自动播放）
  controls: true, // 默认显示控制条，方便用户手动播放
  playOnVisible: false, // 默认不自动播放（浏览器策略：有声音的视频不能自动播放）
  pauseOnHidden: true,
  draggable: false,
  clickAudio: '', // 点击音效URL
  // 血条默认属性
  healthValue: 100,
  maxHealth: 100,
  healthBarColor: '#22C55E', // 绿色
  healthBarBgColor: '#374151', // 深灰色背景
  lowHealthThreshold: 30, // 30%以下为低血量
  lowHealthColor: '#EF4444', // 红色
  showHealthText: true,
  // 选择项默认属性
  clickActions: [],
};

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  // 获取项目 ID，确保是字符串类型
  const projectId = Array.isArray(params.id) ? (params.id as string[])[0] : (params.id as string);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 用于在 wheel 事件处理中调用缩放函数的 ref
  const zoomRef = useRef({ zoom: 1, setZoom: (z: number) => {}, offset: { x: 50, y: 50 }, setOffset: (o: { x: number; y: number }) => {} });

  // 用于追踪预览音效播放，停止时使用
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // 项目名称
  const [projectName, setProjectName] = useState('我的互动短剧');

  // 媒体资源库
  const [mediaResources, setMediaResources] = useState<MediaResource[]>([]);

  // 场景列表
  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: 'scene-1',
      name: '场景1',
      backgroundColor: '#1a1a2e',
      panoramaImage: '',
      panoramaVideo: '',
      elements: [],
      transition: 'fade',
      previewEnabled: true,
      canvasWidth: 1920,
      canvasHeight: 1080,
    },
  ]);

  // 当前场景
  const [currentSceneId, setCurrentSceneId] = useState('scene-1');
  const currentScene = scenes.find((s) => s.id === currentSceneId);

  // 选中的元素
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedElement = currentScene?.elements.find((e) => e.id === selectedId);

  // 画布状态
  const [zoom, setZoom] = useState(0.5); // 初始缩放50%以便看到完整画布
  const [offset, setOffset] = useState({ x: 100, y: 50 }); // 调整初始偏移
  
  // 更新 zoomRef 以便在 wheel 事件处理中使用
  useEffect(() => {
    zoomRef.current = { zoom, setZoom, offset, setOffset };
  }, [zoom, offset]);
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState<'canvas' | 'element' | null>(null);

  // 面板宽度状态
  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizingPanel, setIsResizingPanel] = useState<'left' | 'right' | null>(null);
  
  // 组件/图层面板高度比例 (组件面板占比)
  const [componentPanelRatio, setComponentPanelRatio] = useState(0.55);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [componentsCollapsed, setComponentsCollapsed] = useState(false);
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  // 折叠的图层ID集合（用于折叠/展开父子层级关系）
  const [collapsedLayerIds, setCollapsedLayerIds] = useState<Set<string>>(new Set());

  // 弹窗
  const [showSceneDialog, setShowSceneDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [showChoiceActionDialog, setShowChoiceActionDialog] = useState<{ elementId: string } | null>(null);
  
  // 路径绘制模式 - 直接在画布上绘制路径
  const [pathDrawMode, setPathDrawMode] = useState<{ elementId: string } | null>(null);
  // 路径编辑模式 - 在画布上直接编辑路径点
  const [pathEditMode, setPathEditMode] = useState<{ elementId: string } | null>(null);
  // 预览路径（绘制中的临时路径）
  const [previewPath, setPreviewPath] = useState<{ elementId: string; points: { x: number; y: number }[] } | null>(null);
  // 路径动画预览状态
  const [pathPreviewState, setPathPreviewState] = useState<{ elementId: string; x: number; y: number } | null>(null);
  const pathPreviewRef = useRef<{ elementId: string; animationFrame: number } | null>(null);
  
  const [newSceneName, setNewSceneName] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'panorama' | 'panoramaVideo' | 'audio'>('image');
  const [mediaUrl, setMediaUrl] = useState('');

  // 左侧面板
  const [activeTab, setActiveTab] = useState<'elements' | 'scenes' | 'layers' | 'media'>('elements');

  // 属性面板标签
  const [propertyTab, setPropertyTab] = useState<PropertyTab>('source');
  
  // 动画预览状态
  const [previewAnimationId, setPreviewAnimationId] = useState<string | null>(null);
  
  // 保存状态
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // 分享状态
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // 作品价格设置
  const [beansPrice, setBeansPrice] = useState(0);
  const [projectCategory, setProjectCategory] = useState('other');
  const [projectDescription, setProjectDescription] = useState('');
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // 拖拽状态
  const [draggingElementType, setDraggingElementType] = useState<ElementType | null>(null);
  
  // 图层拖拽状态
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  
  // 参考线状态
  const [guideLines, setGuideLines] = useState<{ id: string; type: 'horizontal' | 'vertical'; position: number }[]>([]);
  const [draggingGuide, setDraggingGuide] = useState<{ id: string; type: 'horizontal' | 'vertical' } | null>(null);
  const [guideDragStart, setGuideDragStart] = useState<number>(0);

  // 模板元素类型（点击组件后显示属性预览）
  const [templateElementType, setTemplateElementType] = useState<ElementType | null>(null);

  // 播放点击音效（使用 Web Audio API）
  const playClickSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 如果 AudioContext 被暂停，先恢复
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 使用三角波，声音更清脆明亮
      oscillator.type = 'triangle';
      
      // 频率：从1000Hz下降到600Hz，模拟"点击"感
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.08);
      
      // 音量：50%起，快速衰减
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch (e) {
      console.log('音效播放失败:', e);
    }
  }, []);
  
  // 调整大小状态
  const [resizing, setResizing] = useState<{ 
    handle: string; 
    startX: number; 
    startY: number; 
    startWidth: number; 
    startHeight: number;
    startElX: number;
    startElY: number;
  } | null>(null);
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    elementId: string | null;
  }>({ visible: false, x: 0, y: 0, elementId: null });
  
  // 视频播放状态
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // 编辑模式：2D或3D
  const [editorMode, setEditorMode] = useState<'2d' | '3d'>('2d');
  
  // 热点编辑模式
  const [isHotspotMode, setIsHotspotMode] = useState(false);

  // 生成ID
  const genId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 添加元素
  const addElement = (type: ElementType, position?: { x: number; y: number }, options?: Partial<CanvasElement>) => {
    if (!currentScene) return;

    const sizes: Record<ElementType, { w: number; h: number }> = {
      button: { w: 140, h: 48 },
      text: { w: 200, h: 40 },
      image: { w: 240, h: 160 },
      hotspot: { w: 80, h: 80 },
      panel: { w: 300, h: 200 },
      video: { w: 320, h: 180 },
      audio: { w: 200, h: 50 },
      divider: { w: 200, h: 2 },
      tooltip: { w: 200, h: 40 },
      label: { w: 120, h: 36 },
      healthBar: { w: 200, h: 30 },
      choiceItem: { w: 280, h: 50 },
    };

    // 文本元素默认无边框、透明背景
    const textDefaults = type === 'text' ? { 
      backgroundColor: 'transparent', 
      backgroundOpacity: 0,
      borderRadius: 0,
      borderWidth: 0,
      borderStyle: 'solid' as const,
      borderColor: 'transparent',
      boxShadow: 'none',
      boxShadowType: 'none',
    } : {};

    const element: CanvasElement = {
      id: genId(),
      type,
      name: `${elementNames[type]}${currentScene.elements.filter(e => e.type === type).length + 1}`,
      x: position?.x ?? 400 + Math.random() * 200,
      y: position?.y ?? 200 + Math.random() * 150,
      width: sizes[type].w,
      height: sizes[type].h,
      ...defaultElement,
      ...textDefaults,
      content: type === 'button' ? '点击开始' : type === 'text' ? '文本内容' : type === 'tooltip' ? '提示文字' : type === 'label' ? '标签' : '',
      ...options,
    };

    updateScenes(currentSceneId, [...currentScene.elements, element]);
    setSelectedId(element.id);
    setTemplateElementType(null); // 清除模板预览
    setPropertyTab('source');
  };

  // 生成模板元素（用于属性预览）
  const getTemplateElement = (type: ElementType): CanvasElement => {
    const sizes: Record<ElementType, { w: number; h: number }> = {
      button: { w: 140, h: 48 },
      text: { w: 200, h: 40 },
      image: { w: 240, h: 160 },
      hotspot: { w: 80, h: 80 },
      panel: { w: 300, h: 200 },
      video: { w: 320, h: 180 },
      audio: { w: 200, h: 50 },
      divider: { w: 200, h: 2 },
      tooltip: { w: 200, h: 40 },
      label: { w: 120, h: 36 },
      healthBar: { w: 200, h: 30 },
      choiceItem: { w: 280, h: 50 },
    };

    return {
      id: 'template',
      type,
      name: elementNames[type],
      x: 0,
      y: 0,
      width: sizes[type].w,
      height: sizes[type].h,
      ...defaultElement,
      content: type === 'button' ? '点击开始' : type === 'text' ? '文本内容' : type === 'tooltip' ? '提示文字' : type === 'choiceItem' ? '选项文字' : '',
    };
  };

  // 获取当前显示的元素（选中的元素或模板元素）
  const displayElement = selectedElement || (templateElementType ? getTemplateElement(templateElementType) : null);

  // 更新场景
  const updateScenes = (sceneId: string, elements: CanvasElement[]) => {
    setScenes(scenes.map((s) => (s.id === sceneId ? { ...s, elements } : s)));
    setSaveStatus('unsaved');
  };

  // 获取元素的所有子元素（递归）
  const getAllChildren = (elementId: string, elements: CanvasElement[]): CanvasElement[] => {
    const directChildren = elements.filter(e => e.parentId === elementId);
    const allChildren: CanvasElement[] = [...directChildren];
    directChildren.forEach(child => {
      allChildren.push(...getAllChildren(child.id, elements));
    });
    return allChildren;
  };

  // 更新元素
  const updateElement = (updates: Partial<CanvasElement>) => {
    if (!selectedId || !currentScene) return;
    
    const oldElement = currentScene.elements.find(e => e.id === selectedId);
    const deltaX = updates.x !== undefined && oldElement ? updates.x - oldElement.x : 0;
    const deltaY = updates.y !== undefined && oldElement ? updates.y - oldElement.y : 0;
    
    // 如果元素位置改变，同步移动所有子元素
    let newElements = currentScene.elements.map((e) => (e.id === selectedId ? { ...e, ...updates } : e));
    
    if (deltaX !== 0 || deltaY !== 0) {
      const childIds = getAllChildren(selectedId, currentScene.elements).map(e => e.id);
      newElements = newElements.map(e => {
        if (childIds.includes(e.id)) {
          return {
            ...e,
            x: e.x + deltaX,
            y: e.y + deltaY
          };
        }
        return e;
      });
    }
    
    updateScenes(currentSceneId, newElements);
  };

  // 通过ID更新元素（用于图层面板操作非选中元素）
  const updateElementById = (elementId: string, updates: Partial<CanvasElement>) => {
    if (!currentScene) return;
    updateScenes(
      currentSceneId,
      currentScene.elements.map((e) => (e.id === elementId ? { ...e, ...updates } : e))
    );
    setSaveStatus('unsaved');
  };

  // 预览动画
  const previewAnimation = (elementId: string) => {
    setPreviewAnimationId(elementId);
    // 动画结束后清除状态
    const element = currentScene?.elements.find(e => e.id === elementId);
    const duration = (element?.animationDuration || 1) * 1000 + (element?.animationDelay || 0) * 1000;
    
    // 先重置动画
    setTimeout(() => {
      setPreviewAnimationId(null);
      // 然后重新触发
      setTimeout(() => {
        setPreviewAnimationId(elementId);
        setTimeout(() => {
          setPreviewAnimationId(null);
        }, duration + 100);
      }, 50);
    }, 100);
  };

  // 预览路径动画
  const previewPathAnimation = useCallback((elementId: string) => {
    const element = currentScene?.elements.find(e => e.id === elementId);
    if (!element?.path || element.path.points.length < 2) return;
    
    // 停止之前的动画
    if (pathPreviewRef.current) {
      cancelAnimationFrame(pathPreviewRef.current.animationFrame);
      pathPreviewRef.current = null;
    }
    
    const path = element.path;
    const points = path.points;
    const duration = path.duration || 3000;
    const delay = path.delay || 0;
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
    
    // 二次贝塞尔曲线计算
    const quadraticBezier = (p0: number, p1: number, p2: number, t: number): number => {
      const mt = 1 - t;
      return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
    };
    
    // 自动计算平滑的贝塞尔控制点（当路径点没有控制点时）
    const calculateSmoothControlPoints = (pts: PathPoint[]): { controlOut?: { x: number; y: number }; controlIn?: { x: number; y: number } }[] => {
      const result: { controlOut?: { x: number; y: number }; controlIn?: { x: number; y: number } }[] = [];
      
      for (let i = 0; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const next = pts[i + 1];
        
        // 如果已经有控制点，保留
        if (curr.controlOut || curr.controlIn) {
          result.push({ controlOut: curr.controlOut, controlIn: curr.controlIn });
          continue;
        }
        
        // 自动计算控制点
        if (i === 0) {
          // 起点：只有出方向控制点
          if (next) {
            const dx = next.x - curr.x;
            const dy = next.y - curr.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const controlDist = dist / 3;
            result.push({
              controlOut: { x: dx !== 0 ? (dx / dist) * controlDist : controlDist, y: dy !== 0 ? (dy / dist) * controlDist : 0 }
            });
          } else {
            result.push({});
          }
        } else if (i === pts.length - 1) {
          // 终点：只有入方向控制点
          if (prev) {
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const controlDist = dist / 3;
            result.push({
              controlIn: { x: dx !== 0 ? -(dx / dist) * controlDist : -controlDist, y: dy !== 0 ? -(dy / dist) * controlDist : 0 }
            });
          } else {
            result.push({});
          }
        } else {
          // 中间点：双向控制点
          if (prev && next) {
            // 计算前后点的方向
            const dxPrev = curr.x - prev.x;
            const dyPrev = curr.y - prev.y;
            const dxNext = next.x - curr.x;
            const dyNext = next.y - curr.y;
            
            const distPrev = Math.sqrt(dxPrev * dxPrev + dyPrev * dyPrev);
            const distNext = Math.sqrt(dxNext * dxNext + dyNext * dyNext);
            
            // 平滑方向（前后方向的平均）
            const smoothX = (dxPrev / distPrev + dxNext / distNext) / 2;
            const smoothY = (dyPrev / distPrev + dyNext / distNext) / 2;
            const smoothLen = Math.sqrt(smoothX * smoothX + smoothY * smoothY);
            
            // 控制点距离
            const controlDistPrev = distPrev / 3;
            const controlDistNext = distNext / 3;
            
            result.push({
              controlIn: { 
                x: smoothLen > 0 ? -(smoothX / smoothLen) * controlDistPrev : -controlDistPrev, 
                y: smoothLen > 0 ? -(smoothY / smoothLen) * controlDistPrev : 0 
              },
              controlOut: { 
                x: smoothLen > 0 ? (smoothX / smoothLen) * controlDistNext : controlDistNext, 
                y: smoothLen > 0 ? (smoothY / smoothLen) * controlDistNext : 0 
              }
            });
          } else {
            result.push({});
          }
        }
      }
      
      return result;
    };
    
    // 预计算路径点（60fps，每帧一个点）
    const totalFrames = Math.ceil(duration / 16.67); // 60fps
    const precomputedPoints: { x: number; y: number }[] = [];
    
    // 计算自动控制点
    const autoControls = calculateSmoothControlPoints(points);
    
    // 计算路径上某点的位置
    const getPointOnPath = (progress: number): { x: number; y: number } => {
      if (points.length === 0) return { x: element.x, y: element.y };
      if (points.length === 1) return { x: points[0].x, y: points[0].y };
      
      // 计算总路径长度
      const sampleCount = 50;
      let totalLength = 0;
      const segmentLengths: number[] = [];
      
      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        let segmentLength = 0;
        let prevX = start.x;
        let prevY = start.y;
        
        for (let j = 1; j <= sampleCount; j++) {
          const t = j / sampleCount;
          let x: number, y: number;
          
          // 优先使用显式控制点，否则使用自动计算的控制点
          const ctrlOut = start.controlOut || autoControls[i]?.controlOut;
          const ctrlIn = end.controlIn || autoControls[i + 1]?.controlIn;
          
          if (ctrlOut && ctrlIn) {
            const cp1x = start.x + ctrlOut.x;
            const cp1y = start.y + ctrlOut.y;
            const cp2x = end.x + ctrlIn.x;
            const cp2y = end.y + ctrlIn.y;
            x = cubicBezier(start.x, cp1x, cp2x, end.x, t);
            y = cubicBezier(start.y, cp1y, cp2y, end.y, t);
          } else if (ctrlOut) {
            const cpx = start.x + ctrlOut.x;
            const cpy = start.y + ctrlOut.y;
            x = quadraticBezier(start.x, cpx, end.x, t);
            y = quadraticBezier(start.y, cpy, end.y, t);
          } else if (ctrlIn) {
            const cpx = end.x + ctrlIn.x;
            const cpy = end.y + ctrlIn.y;
            x = quadraticBezier(start.x, cpx, end.x, t);
            y = quadraticBezier(start.y, cpy, end.y, t);
          } else {
            x = start.x + (end.x - start.x) * t;
            y = start.y + (end.y - start.y) * t;
          }
          
          const dx = x - prevX;
          const dy = y - prevY;
          segmentLength += Math.sqrt(dx * dx + dy * dy);
          prevX = x;
          prevY = y;
        }
        
        segmentLengths.push(segmentLength);
        totalLength += segmentLength;
      }
      
      if (totalLength === 0) return { x: points[0].x, y: points[0].y };
      
      const targetLength = progress * totalLength;
      let currentLength = 0;
      
      for (let i = 0; i < points.length - 1; i++) {
        if (currentLength + segmentLengths[i] >= targetLength) {
          const start = points[i];
          const end = points[i + 1];
          const segmentProgress = (targetLength - currentLength) / segmentLengths[i];
          
          let x: number, y: number;
          
          // 优先使用显式控制点，否则使用自动计算的控制点
          const ctrlOut = start.controlOut || autoControls[i]?.controlOut;
          const ctrlIn = end.controlIn || autoControls[i + 1]?.controlIn;
          
          if (ctrlOut && ctrlIn) {
            const cp1x = start.x + ctrlOut.x;
            const cp1y = start.y + ctrlOut.y;
            const cp2x = end.x + ctrlIn.x;
            const cp2y = end.y + ctrlIn.y;
            x = cubicBezier(start.x, cp1x, cp2x, end.x, segmentProgress);
            y = cubicBezier(start.y, cp1y, cp2y, end.y, segmentProgress);
          } else if (ctrlOut) {
            const cpx = start.x + ctrlOut.x;
            const cpy = start.y + ctrlOut.y;
            x = quadraticBezier(start.x, cpx, end.x, segmentProgress);
            y = quadraticBezier(start.y, cpy, end.y, segmentProgress);
          } else if (ctrlIn) {
            const cpx = end.x + ctrlIn.x;
            const cpy = end.y + ctrlIn.y;
            x = quadraticBezier(start.x, cpx, end.x, segmentProgress);
            y = quadraticBezier(start.y, cpy, end.y, segmentProgress);
          } else {
            x = start.x + (end.x - start.x) * segmentProgress;
            y = start.y + (end.y - start.y) * segmentProgress;
          }
          
          return { x, y };
        }
        currentLength += segmentLengths[i];
      }
      
      return { x: points[points.length - 1].x, y: points[points.length - 1].y };
    };
    
    // 预计算所有路径点
    for (let i = 0; i <= totalFrames; i++) {
      const progress = i / totalFrames;
      const easedProgress = easingFn(progress);
      precomputedPoints.push(getPointOnPath(easedProgress));
    }
    
    // 使用 CSS transform 直接操作 DOM，避免 React 重渲染
    const elementDom = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
    if (!elementDom) {
      // 降级到状态更新方式
      setPathPreviewState({ elementId, x: precomputedPoints[0].x, y: precomputedPoints[0].y });
    }
    
    let currentFrame = 0;
    let startTime = performance.now() + delay;
    let iterations = 0;
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      
      if (elapsed < 0) {
        pathPreviewRef.current = { elementId, animationFrame: requestAnimationFrame(animate) };
        return;
      }
      
      let progress = elapsed / duration;
      
      // 处理循环模式
      if (loopMode === 'none') {
        if (progress >= 1) {
          // 恢复原始位置
          if (elementDom) {
            elementDom.style.transition = 'transform 0.3s ease';
            elementDom.style.transform = '';
          }
          setPathPreviewState(null);
          pathPreviewRef.current = null;
          return;
        }
      } else if (loopMode === 'loop') {
        progress = progress % 1;
        if (iterations > 10) {
          if (elementDom) {
            elementDom.style.transition = 'transform 0.3s ease';
            elementDom.style.transform = '';
          }
          setPathPreviewState(null);
          pathPreviewRef.current = null;
          return;
        }
        iterations = Math.floor(elapsed / duration);
      } else if (loopMode === 'alternate') {
        const cycle = Math.floor(progress);
        progress = progress % 1;
        if (cycle % 2 === 1) {
          progress = 1 - progress;
        }
        if (cycle > 10) {
          if (elementDom) {
            elementDom.style.transition = 'transform 0.3s ease';
            elementDom.style.transform = '';
          }
          setPathPreviewState(null);
          pathPreviewRef.current = null;
          return;
        }
      }
      
      // 计算当前帧
      currentFrame = Math.floor(progress * totalFrames);
      if (currentFrame > totalFrames) currentFrame = totalFrames;
      
      const pos = precomputedPoints[currentFrame];
      
      // 直接操作 DOM（性能更好）
      if (elementDom) {
        const offsetX = element.x + element.width / 2;
        const offsetY = element.y + element.height / 2;
        const dx = pos.x - offsetX;
        const dy = pos.y - offsetY;
        elementDom.style.transition = 'none';
        elementDom.style.transform = `translate(${dx}px, ${dy}px)`;
      } else {
        // 降级到状态更新
        setPathPreviewState({ elementId, x: pos.x, y: pos.y });
      }
      
      pathPreviewRef.current = { elementId, animationFrame: requestAnimationFrame(animate) };
    };
    
    animate();
  }, [currentScene?.elements]);

  // 停止路径动画预览
  const stopPathPreview = useCallback(() => {
    if (pathPreviewRef.current) {
      const elementId = pathPreviewRef.current.elementId;
      cancelAnimationFrame(pathPreviewRef.current.animationFrame);
      pathPreviewRef.current = null;
      
      // 恢复 DOM 元素的原始位置
      const elementDom = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
      if (elementDom) {
        elementDom.style.transition = 'transform 0.3s ease';
        elementDom.style.transform = '';
      }
    }
    setPathPreviewState(null);
  }, []);

  // 移动元素层级（上移=更靠近顶层=z-index更大=数组索引变大=列表位置变低）
  const moveElementUp = (elementId: string) => {
    if (!currentScene) return;
    const elements = currentScene.elements;
    const element = elements.find(e => e.id === elementId);
    if (!element) return;
    
    // 找到同一父级下的兄弟元素
    const siblings = elements.filter(e => e.parentId === element.parentId);
    const currentIndex = siblings.findIndex(s => s.id === elementId);
    
    // 如果已经是最后一个，无法上移（已经是顶层，列表最下方）
    if (currentIndex >= siblings.length - 1) return;
    
    // 在原数组中找到这两个元素的索引并交换
    const nextSiblingId = siblings[currentIndex + 1].id;
    
    const newElements = [...elements];
    const elementIndex = newElements.findIndex(e => e.id === elementId);
    const nextIndex = newElements.findIndex(e => e.id === nextSiblingId);
    
    // 交换位置（与后一个交换，使索引变大，z-index变大，更靠近顶层）
    [newElements[elementIndex], newElements[nextIndex]] = [newElements[nextIndex], newElements[elementIndex]];
    
    updateScenes(currentSceneId, newElements);
    setSaveStatus('unsaved');
  };

  // 下移=更靠近底层=z-index变小=数组索引变小=列表位置变高
  const moveElementDown = (elementId: string) => {
    if (!currentScene) return;
    const elements = currentScene.elements;
    const element = elements.find(e => e.id === elementId);
    if (!element) return;
    
    // 找到同一父级下的兄弟元素
    const siblings = elements.filter(e => e.parentId === element.parentId);
    const currentIndex = siblings.findIndex(s => s.id === elementId);
    
    // 如果已经是第一个，无法下移（已经是最底层，列表最上方）
    if (currentIndex <= 0) return;
    
    // 在原数组中找到这两个元素的索引并交换
    const prevSiblingId = siblings[currentIndex - 1].id;
    
    const newElements = [...elements];
    const elementIndex = newElements.findIndex(e => e.id === elementId);
    const prevIndex = newElements.findIndex(e => e.id === prevSiblingId);
    
    // 交换位置（与前一个交换，使索引变小，z-index变小，更靠近底层）
    [newElements[elementIndex], newElements[prevIndex]] = [newElements[prevIndex], newElements[elementIndex]];
    
    updateScenes(currentSceneId, newElements);
    setSaveStatus('unsaved');
  };

  // 删除元素
  const deleteElement = () => {
    if (!selectedId || !currentScene) return;
    updateScenes(currentSceneId, currentScene.elements.filter((e) => e.id !== selectedId));
    setSelectedId(null);
    setSaveStatus('unsaved');
  };

  // 保存项目
  const saveProject = useCallback(async () => {
    setSaveStatus('saving');
    const projectData = {
      id: projectId,
      name: projectName,
      scenes,
      mediaResources,
      updatedAt: Date.now(),
    };
    
    try {
      // 获取授权 token
      const token = getAuthToken();
      
      // 尝试保存到数据库
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          projectData: {
            scenes,
            mediaResources,
          },
        }),
      });

      if (response.ok) {
        // 【关键】同步更新 localStorage，确保数据一致性
        const savedProjects = JSON.parse(localStorage.getItem('interactive-stories') || '{}');
        savedProjects[projectId] = projectData;
        localStorage.setItem('interactive-stories', JSON.stringify(savedProjects));
        
        setSaveStatus('saved');
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
        return;
      }

      // 如果数据库保存失败，降级到 localStorage
      console.log('数据库保存失败，降级到 localStorage');
      const savedProjects = JSON.parse(localStorage.getItem('interactive-stories') || '{}');
      savedProjects[projectId] = projectData;
      localStorage.setItem('interactive-stories', JSON.stringify(savedProjects));
      
      setSaveStatus('saved');
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('保存失败:', error);
      // 降级到 localStorage
      try {
        const savedProjects = JSON.parse(localStorage.getItem('interactive-stories') || '{}');
        savedProjects[projectId] = projectData;
        localStorage.setItem('interactive-stories', JSON.stringify(savedProjects));
        
        setSaveStatus('saved');
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      } catch (e) {
        setSaveStatus('unsaved');
      }
    }
  }, [projectId, projectName, scenes, mediaResources]);

  // 分享项目
  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      // 先保存项目
      await saveProject();
      
      // 获取授权 token
      const token = getAuthToken();
      
      // 更新公开状态和价格
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isPublic: true,
          beansPrice: beansPrice,
          category: projectCategory,
          description: projectDescription,
          projectData: {
            scenes,
            mediaResources,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsPublic(true);
        // 使用 share_code 生成链接
        const shareCode = data.project?.share_code || projectId;
        setShareLink(`${window.location.origin}/play/${shareCode}`);
        setShowPublishDialog(false);
        setShowShareDialog(true);
      } else {
        const error = await response.json();
        alert(error.error || '发布失败，请稍后重试');
      }
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请稍后重试');
    } finally {
      setIsSharing(false);
    }
  }, [projectId, scenes, mediaResources, saveProject, beansPrice, projectCategory, projectDescription]);

  // 复制分享链接
  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [shareLink]);

  // 加载项目
  const loadProject = useCallback(async () => {
    try {
      // 【关键】先读取 localStorage 中的数据，获取其 updatedAt 时间戳
      const savedProjects = JSON.parse(localStorage.getItem('interactive-stories') || '{}');
      const localProjectData = savedProjects[projectId];
      const localUpdatedAt = localProjectData?.updatedAt || 0;
      
      // 获取授权 token
      const token = getAuthToken();
      
      // 尝试从数据库加载
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.project) {
          const projectData = data.project.projectData;
          const dbUpdatedAt = new Date(data.project.updated_at || 0).getTime();
          
          // 【关键】比较时间戳，优先使用最新的数据
          if (localProjectData && localUpdatedAt > dbUpdatedAt) {
            console.log('使用 localStorage 中的最新数据（比数据库新）');
            setProjectName(localProjectData.name || '我的互动短剧');
            if (localProjectData.scenes && localProjectData.scenes.length > 0) {
              const cleanedScenes = localProjectData.scenes.map((scene: any) => ({
                ...scene,
                panoramaImage: validateVideoUrl(scene.panoramaImage).isValid ? scene.panoramaImage : '',
                panoramaVideo: validateVideoUrl(scene.panoramaVideo).isValid ? scene.panoramaVideo : '',
                elements: scene.elements?.map((el: any) => ({
                  ...el,
                  src: validateVideoUrl(el.src).isValid ? el.src : '',
                })) || [],
              }));
              setScenes(cleanedScenes);
              setCurrentSceneId(cleanedScenes[0].id);
            }
            if (localProjectData.mediaResources) {
              const validResources = localProjectData.mediaResources.filter(
                (r: MediaResource) => validateVideoUrl(r.url).isValid
              );
              setMediaResources(validResources);
            }
            setSaveStatus('saved');
            return;
          }
          
          // 使用数据库数据
          setProjectName(data.project.name || '我的互动短剧');
          setBeansPrice(data.project.beans_price || 0);
          setProjectCategory(data.project.category || 'other');
          setProjectDescription(data.project.description || '');
          
          if (projectData?.scenes && projectData.scenes.length > 0) {
            // 过滤掉无效的 URL
            const cleanedScenes = projectData.scenes.map((scene: any) => ({
              ...scene,
              panoramaImage: validateVideoUrl(scene.panoramaImage).isValid ? scene.panoramaImage : '',
              panoramaVideo: validateVideoUrl(scene.panoramaVideo).isValid ? scene.panoramaVideo : '',
              elements: scene.elements?.map((el: any) => ({
                ...el,
                src: validateVideoUrl(el.src).isValid ? el.src : '',
              })) || [],
            }));
            setScenes(cleanedScenes);
            setCurrentSceneId(cleanedScenes[0].id);
          }
          
          if (projectData?.mediaResources) {
            const validResources = projectData.mediaResources.filter(
              (r: MediaResource) => validateVideoUrl(r.url).isValid
            );
            setMediaResources(validResources);
          }
          
          // 同步到 localStorage
          savedProjects[projectId] = {
            ...savedProjects[projectId],
            name: data.project.name,
            scenes: projectData?.scenes || [],
            mediaResources: projectData?.mediaResources || [],
            updatedAt: dbUpdatedAt,
          };
          localStorage.setItem('interactive-stories', JSON.stringify(savedProjects));
          
          setSaveStatus('saved');
          return;
        }
      }
      
      // 如果数据库加载失败，从 localStorage 加载
      const projectData = savedProjects[projectId];
      
      if (projectData) {
        setProjectName(projectData.name || '我的互动短剧');
        if (projectData.scenes && projectData.scenes.length > 0) {
          const cleanedScenes = projectData.scenes.map((scene: any) => ({
            ...scene,
            panoramaImage: validateVideoUrl(scene.panoramaImage).isValid ? scene.panoramaImage : '',
            panoramaVideo: validateVideoUrl(scene.panoramaVideo).isValid ? scene.panoramaVideo : '',
            elements: scene.elements?.map((el: any) => ({
              ...el,
              src: validateVideoUrl(el.src).isValid ? el.src : '',
            })) || [],
          }));
          setScenes(cleanedScenes);
          setCurrentSceneId(cleanedScenes[0].id);
        }
        if (projectData.mediaResources) {
          const validResources = projectData.mediaResources.filter(
            (r: MediaResource) => validateVideoUrl(r.url).isValid
          );
          setMediaResources(validResources);
        }
      } else {
        // localStorage 中没有项目数据，初始化并保存默认项目
        console.log('初始化新项目:', projectId);
        const initialProjectData = {
          id: projectId,
          name: '我的互动短剧',
          scenes: [{
            id: 'scene-1',
            name: '场景1',
            backgroundColor: '#1a1a2e',
            panoramaImage: '',
            panoramaVideo: '',
            elements: [],
            transition: 'fade',
            previewEnabled: true,
            canvasWidth: 1920,
            canvasHeight: 1080,
          }],
          mediaResources: [],
          updatedAt: Date.now(),
        };
        savedProjects[projectId] = initialProjectData;
        localStorage.setItem('interactive-stories', JSON.stringify(savedProjects));
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('加载失败:', error);
    }
  }, [projectId]);

  // 初始化加载项目数据
  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // 自动保存（防抖）
  useEffect(() => {
    if (saveStatus === 'unsaved') {
      const timer = setTimeout(() => {
        saveProject();
      }, 2000); // 2秒后自动保存
      return () => clearTimeout(timer);
    }
  }, [scenes, mediaResources, projectName, saveStatus, saveProject]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框中，不处理快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // DELETE 或 BACKSPACE 删除选中元素
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && currentScene) {
        e.preventDefault();
        // 直接执行删除逻辑
        updateScenes(currentSceneId, currentScene.elements.filter((el) => el.id !== selectedId));
        setSelectedId(null);
        setSaveStatus('unsaved');
      }

      // Ctrl+C 复制
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedElement && currentScene) {
        e.preventDefault();
        const newEl = {
          ...selectedElement,
          id: genId(),
          name: `${selectedElement.name}(复制)`,
          x: selectedElement.x + 20,
          y: selectedElement.y + 20,
        };
        updateScenes(currentSceneId, [...currentScene.elements, newEl]);
        setSelectedId(newEl.id);
      }

      // Escape 取消选中或退出路径绘制/编辑模式
      if (e.key === 'Escape') {
        if (pathDrawMode) {
          setPathDrawMode(null);
          return;
        }
        if (pathEditMode) {
          setPathEditMode(null);
          return;
        }
        setSelectedId(null);
        closeContextMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedElement, currentScene, currentSceneId, pathDrawMode, pathEditMode]);

  // 阻止浏览器默认的 Ctrl+滚轮 缩放行为（在整个编辑器内都禁止浏览器缩放）
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // 只处理 Ctrl/Cmd + 滚轮
      if (!(e.ctrlKey || e.metaKey)) return;
      
      // 在整个编辑器内都阻止浏览器的页面缩放
      e.preventDefault();
      
      // 检查是否在画布区域内
      const canvasArea = canvasRef.current;
      if (canvasArea && canvasArea.contains(e.target as Node)) {
        // 在画布区域内，手动触发画布缩放
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.25, Math.min(2, zoomRef.current.zoom + delta));
        
        // 基于鼠标位置进行缩放
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const rect = canvasArea.getBoundingClientRect();
        
        // 计算鼠标在画布中的位置（相对于画布坐标系）
        const mouseCanvasX = (mouseX - rect.left - zoomRef.current.offset.x) / zoomRef.current.zoom;
        const mouseCanvasY = (mouseY - rect.top - zoomRef.current.offset.y) / zoomRef.current.zoom;
        
        // 计算新的偏移量，使鼠标位置保持不变
        const newOffsetX = mouseX - rect.left - mouseCanvasX * newZoom;
        const newOffsetY = mouseY - rect.top - mouseCanvasY * newZoom;
        
        zoomRef.current.setZoom(newZoom);
        zoomRef.current.setOffset({ x: newOffsetX, y: newOffsetY });
      }
      // 在面板区域，只阻止浏览器缩放，不执行任何操作
    };
    
    // 使用 capture: true 在捕获阶段处理，确保比其他处理器更早执行
    // 使用 passive: false 以便能够调用 preventDefault
    document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => document.removeEventListener('wheel', handleWheel, { capture: true });
  }, []);

  // 复制元素
  const copyElement = () => {
    if (!selectedElement || !currentScene) return;
    const newEl = {
      ...selectedElement,
      id: genId(),
      name: `${selectedElement.name}(复制)`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
    };
    updateScenes(currentSceneId, [...currentScene.elements, newEl]);
    setSelectedId(newEl.id);
  };

  // 最大化元素（视频全屏）
  const maximizeElement = (elementId: string) => {
    if (!currentScene) return;
    const element = currentScene.elements.find(e => e.id === elementId);
    if (!element) return;

    // 保存原始布局
    const originalLayout = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };

    // 更新为最大化状态
    const canvasW = currentScene?.canvasWidth || 1920;
    const canvasH = currentScene?.canvasHeight || 1080;
    updateScenes(
      currentSceneId,
      currentScene.elements.map(e => 
        e.id === elementId 
          ? { 
              ...e, 
              x: 0, 
              y: 0, 
              width: canvasW, 
              height: canvasH,
              originalLayout,
              isMaximized: true,
            } 
          : e
      )
    );
    setContextMenu({ visible: false, x: 0, y: 0, elementId: null });
    setSaveStatus('unsaved');
  };

  // 还原元素布局
  const restoreElement = (elementId: string) => {
    if (!currentScene) return;
    const element = currentScene.elements.find(e => e.id === elementId);
    if (!element || !element.originalLayout) return;

    // 恢复原始布局
    updateScenes(
      currentSceneId,
      currentScene.elements.map(e => 
        e.id === elementId 
          ? { 
              ...e, 
              x: element.originalLayout!.x,
              y: element.originalLayout!.y,
              width: element.originalLayout!.width,
              height: element.originalLayout!.height,
              isMaximized: false,
            } 
          : e
      )
    );
    setContextMenu({ visible: false, x: 0, y: 0, elementId: null });
    setSaveStatus('unsaved');
  };

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = currentScene?.elements.find(el => el.id === elementId);
    
    // 视频、图片、面板元素支持最大化
    if (element && ['video', 'image', 'panel'].includes(element.type)) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        elementId,
      });
    }
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, elementId: null });
  };

  // 添加场景
  const addScene = () => {
    if (!newSceneName.trim()) return;
    const scene: Scene = {
      id: `scene-${Date.now()}`,
      name: newSceneName,
      backgroundColor: '#1a1a2e',
      panoramaImage: '',
      panoramaVideo: '',
      elements: [],
      transition: 'fade',
      previewEnabled: true,
      canvasWidth: 1920,
      canvasHeight: 1080,
    };
    setScenes([...scenes, scene]);
    setCurrentSceneId(scene.id);
    setNewSceneName('');
    setShowSceneDialog(false);
  };

  // 画布拖拽
  const handleMouseDown = (e: React.MouseEvent, elementId?: string) => {
    e.preventDefault();
    
    // 路径绘制模式 - 点击画布添加路径点
    if (pathDrawMode && !elementId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - offset.x) / zoom;
        const y = (e.clientY - rect.top - offset.y) / zoom;
        
        // 获取当前元素
        const element = currentScene?.elements.find(el => el.id === pathDrawMode.elementId);
        if (element) {
          const currentPath = element.path || {
            points: [],
            enabled: true,
            duration: 3000,
            easing: 'easeInOut' as const,
            loopMode: 'none' as const,
            autoPlay: false,
            delay: 0,
          };
          
          // 添加新的路径点
          const newPoint: PathPoint = {
            id: `pt-${Date.now()}`,
            x: Math.round(x),
            y: Math.round(y),
          };
          
          // 如果是第一个点，使用元素当前位置作为起点
          const newPoints = currentPath.points.length === 0 
            ? [
                { id: `pt-start-${Date.now()}`, x: element.x + element.width / 2, y: element.y + element.height / 2 },
                newPoint
              ]
            : [...currentPath.points, newPoint];
          
          updateElement({ 
            path: { 
              ...currentPath, 
              points: newPoints 
            } 
          });
        }
      }
      return;
    }
    
    // 路径编辑模式 - 点击空白处退出编辑模式
    if (pathEditMode && !elementId) {
      setPathEditMode(null);
      return;
    }
    
    // 计算拖拽参数（不依赖异步状态更新）
    let currentDragType: 'canvas' | 'element';
    let currentDragStart: { x: number; y: number };
    let currentElementId: string | null = null;
    
    if (elementId) {
      const el = currentScene?.elements.find((e) => e.id === elementId);
      if (!el || el.locked) return;
      setSelectedId(elementId);
      setTemplateElementType(null);
      currentDragType = 'element';
      currentDragStart = { x: e.clientX - el.x * zoom, y: e.clientY - el.y * zoom };
      currentElementId = elementId;
    } else {
      setSelectedId(null);
      currentDragType = 'canvas';
      currentDragStart = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    }
    
    // 同步更新状态
    setDragType(currentDragType);
    setDragStart(currentDragStart);
    setIsDragging(true);
    
    // 将事件绑定到 document，确保鼠标离开元素也能捕获
    const handleDocMouseMove = (moveEvent: MouseEvent) => {
      if (currentDragType === 'canvas') {
        setOffset({ 
          x: moveEvent.clientX - currentDragStart.x, 
          y: moveEvent.clientY - currentDragStart.y 
        });
      } else if (currentDragType === 'element' && currentElementId) {
        const newX = Math.max(0, (moveEvent.clientX - currentDragStart.x) / zoom);
        const newY = Math.max(0, (moveEvent.clientY - currentDragStart.y) / zoom);
        
        // 获取当前元素和计算位置变化
        const currentElement = currentScene?.elements.find(el => el.id === currentElementId);
        if (currentElement) {
          const deltaX = newX - currentElement.x;
          const deltaY = newY - currentElement.y;
          
          // 获取所有子元素ID
          const childIds = getAllChildren(currentElementId, currentScene!.elements).map(e => e.id);
          
          // 更新元素位置，同时移动所有子元素
          updateScenes(currentSceneId, currentScene!.elements.map(el => {
            if (el.id === currentElementId) {
              return { ...el, x: newX, y: newY };
            }
            // 如果是子元素，同步移动
            if (childIds.includes(el.id)) {
              return { ...el, x: el.x + deltaX, y: el.y + deltaY };
            }
            return el;
          }));
        }
      }
    };
    
    const handleDocMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setResizing(null);
      setSaveStatus('unsaved');
      document.removeEventListener('mousemove', handleDocMouseMove);
      document.removeEventListener('mouseup', handleDocMouseUp);
    };
    
    document.addEventListener('mousemove', handleDocMouseMove);
    document.addEventListener('mouseup', handleDocMouseUp);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 拖拽和调整大小逻辑已移到 document 事件处理
    // 这个函数保留给未来的其他用途
  };

  const handleMouseUp = () => {
    // 这个函数保留给 onMouseLeave 使用
    if (isDragging || resizing) {
      setIsDragging(false);
      setDragType(null);
      setResizing(null);
    }
  };

  // 开始调整大小
  const startResize = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    if (!selectedElement) return;
    
    // 计算调整大小的参数
    const resizeState = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: selectedElement.width,
      startHeight: selectedElement.height,
      startElX: selectedElement.x,
      startElY: selectedElement.y,
      elementId: selectedElement.id,
    };
    
    setResizing(resizeState);
    
    // 将事件绑定到 document
    const handleDocMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - resizeState.startX) / zoom;
      const dy = (moveEvent.clientY - resizeState.startY) / zoom;
      
      let newWidth = resizeState.startWidth;
      let newHeight = resizeState.startHeight;
      let newX = resizeState.startElX;
      let newY = resizeState.startElY;
      
      switch (resizeState.handle) {
        case 'nw':
          newWidth = Math.max(20, resizeState.startWidth - dx);
          newHeight = Math.max(20, resizeState.startHeight - dy);
          newX = resizeState.startElX + (resizeState.startWidth - newWidth);
          newY = resizeState.startElY + (resizeState.startHeight - newHeight);
          break;
        case 'ne':
          newWidth = Math.max(20, resizeState.startWidth + dx);
          newHeight = Math.max(20, resizeState.startHeight - dy);
          newY = resizeState.startElY + (resizeState.startHeight - newHeight);
          break;
        case 'sw':
          newWidth = Math.max(20, resizeState.startWidth - dx);
          newHeight = Math.max(20, resizeState.startHeight + dy);
          newX = resizeState.startElX + (resizeState.startWidth - newWidth);
          break;
        case 'se':
          newWidth = Math.max(20, resizeState.startWidth + dx);
          newHeight = Math.max(20, resizeState.startHeight + dy);
          break;
        case 'n':
          newHeight = Math.max(20, resizeState.startHeight - dy);
          newY = resizeState.startElY + (resizeState.startHeight - newHeight);
          break;
        case 's':
          newHeight = Math.max(20, resizeState.startHeight + dy);
          break;
        case 'w':
          newWidth = Math.max(20, resizeState.startWidth - dx);
          newX = resizeState.startElX + (resizeState.startWidth - newWidth);
          break;
        case 'e':
          newWidth = Math.max(20, resizeState.startWidth + dx);
          break;
      }
      
      updateScenes(currentSceneId, currentScene!.elements.map(el => 
        el.id === resizeState.elementId ? {
          ...el,
          width: Math.round(newWidth),
          height: Math.round(newHeight),
          x: Math.round(newX),
          y: Math.round(newY),
        } : el
      ));
    };
    
    const handleDocMouseUp = () => {
      setResizing(null);
      setSaveStatus('unsaved');
      document.removeEventListener('mousemove', handleDocMouseMove);
      document.removeEventListener('mouseup', handleDocMouseUp);
    };
    
    document.addEventListener('mousemove', handleDocMouseMove);
    document.addEventListener('mouseup', handleDocMouseUp);
  };

  // 生成唯一ID
  const genGuideId = () => `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 从标尺开始拖拽创建参考线
  const handleRulerMouseDown = (e: React.MouseEvent, type: 'horizontal' | 'vertical') => {
    e.preventDefault();
    e.stopPropagation();
    
    const guideId = genGuideId();
    
    // 创建新参考线，初始位置为当前鼠标位置对应的画布坐标
    if (type === 'horizontal') {
      const canvasY = (e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0) - offset.y) / zoom;
      setGuideLines(prev => [...prev, { id: guideId, type: 'horizontal', position: canvasY }]);
    } else {
      const canvasX = (e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0) - offset.x) / zoom;
      setGuideLines(prev => [...prev, { id: guideId, type: 'vertical', position: canvasX }]);
    }
    
    setDraggingGuide({ id: guideId, type });
    setGuideDragStart(type === 'horizontal' ? e.clientY : e.clientX);
  };

  // 拖拽参考线
  const handleGuideMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingGuide) return;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    
    if (draggingGuide.type === 'horizontal') {
      const canvasY = (e.clientY - canvasRect.top - offset.y) / zoom;
      setGuideLines(prev => prev.map(g => 
        g.id === draggingGuide.id ? { ...g, position: canvasY } : g
      ));
    } else {
      const canvasX = (e.clientX - canvasRect.left - offset.x) / zoom;
      setGuideLines(prev => prev.map(g => 
        g.id === draggingGuide.id ? { ...g, position: canvasX } : g
      ));
    }
  }, [draggingGuide, offset, zoom]);

  // 结束拖拽参考线
  const handleGuideMouseUp = useCallback((e: MouseEvent) => {
    if (!draggingGuide) return;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    
    if (!canvasRect) {
      setDraggingGuide(null);
      return;
    }
    
    // 检查是否拖出了画布区域（拖到标尺上删除）
    if (draggingGuide.type === 'horizontal') {
      // 如果鼠标在水平标尺区域（y < 标尺高度），删除参考线
      if (e.clientY < canvasRect.top) {
        setGuideLines(prev => prev.filter(g => g.id !== draggingGuide.id));
      }
    } else {
      // 如果鼠标在垂直标尺区域（x < 标尺宽度），删除参考线
      if (e.clientX < canvasRect.left) {
        setGuideLines(prev => prev.filter(g => g.id !== draggingGuide.id));
      }
    }
    
    // 检查参考线是否超出画布范围，超出则删除（使用足够大的范围，不依赖当前场景尺寸）
    setGuideLines(prev => prev.filter(g => {
      if (g.type === 'horizontal') {
        return g.position >= -100 && g.position <= 4096 + 100;
      } else {
        return g.position >= -100 && g.position <= 4096 + 100;
      }
    }));
    
    setDraggingGuide(null);
  }, [draggingGuide]);

  // 参考线拖拽事件监听
  useEffect(() => {
    if (draggingGuide) {
      document.addEventListener('mousemove', handleGuideMouseMove);
      document.addEventListener('mouseup', handleGuideMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGuideMouseMove);
        document.removeEventListener('mouseup', handleGuideMouseUp);
      };
    }
  }, [draggingGuide, handleGuideMouseMove, handleGuideMouseUp]);

  // 点击参考线开始拖拽（已有参考线）
  const handleGuideLineMouseDown = (e: React.MouseEvent, guideId: string, type: 'horizontal' | 'vertical') => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingGuide({ id: guideId, type });
    setGuideDragStart(type === 'horizontal' ? e.clientY : e.clientX);
  };

  // 删除参考线
  const deleteGuideLine = (guideId: string) => {
    setGuideLines(prev => prev.filter(g => g.id !== guideId));
  };

  // 清除所有参考线
  const clearAllGuides = () => {
    setGuideLines([]);
  };

  // 渲染标尺
  const renderRuler = (direction: 'horizontal' | 'vertical') => {
    const step = 100; // 每100像素一个刻度
    const majorStep = 500; // 每500像素一个大刻度
    const canvasW = currentScene?.canvasWidth || 1920;
    const canvasH = currentScene?.canvasHeight || 1080;
    const length = direction === 'horizontal' ? canvasW : canvasH;
    const scaledStep = step * zoom;
    const scaledMajorStep = majorStep * zoom;
    
    const ticks = [];
    for (let i = 0; i <= length; i += step) {
      const pos = i * zoom + (direction === 'horizontal' ? offset.x : offset.y);
      const isMajor = i % majorStep === 0;
      
      if (pos >= 0 && pos <= (direction === 'horizontal' ? canvasW * zoom + 200 : canvasH * zoom + 200)) {
        ticks.push(
          <div
            key={i}
            className={`absolute ${isMajor ? 'bg-zinc-400' : 'bg-zinc-500'}`}
            style={direction === 'horizontal' 
              ? { left: pos, top: isMajor ? 0 : 8, width: 1, height: isMajor ? 16 : 8 }
              : { top: pos, left: isMajor ? 0 : 8, height: 1, width: isMajor ? 16 : 8 }
            }
          />
        );
        if (isMajor) {
          ticks.push(
            <span
              key={`label-${i}`}
              className="absolute text-[10px] text-zinc-300"
              style={direction === 'horizontal'
                ? { left: pos + 2, top: 2 }
                : { top: pos + 2, left: 2, writingMode: 'vertical-rl' }
              }
            >
              {i}
            </span>
          );
        }
      }
    }
    return ticks;
  };

  // 缩放（支持基于鼠标位置的缩放）
  const handleZoom = (delta: number, mouseX?: number, mouseY?: number) => {
    const newZoom = Math.max(0.25, Math.min(2, zoom + delta));
    
    // 如果提供了鼠标位置，基于鼠标位置进行缩放
    if (mouseX !== undefined && mouseY !== undefined && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // 计算鼠标在画布中的位置（缩放前）
      const mouseCanvasX = (mouseX - rect.left - offset.x) / zoom;
      const mouseCanvasY = (mouseY - rect.top - offset.y) / zoom;
      
      // 计算新的偏移量，使鼠标位置保持不变
      const newOffsetX = mouseX - rect.left - mouseCanvasX * newZoom;
      const newOffsetY = mouseY - rect.top - mouseCanvasY * newZoom;
      
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
    
    setZoom(newZoom);
  };

  // 画布滚轮处理：普通滚轮平移画布，Ctrl+滚轮缩放画布
  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+滚轮：缩放画布
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta, e.clientX, e.clientY);
    } else {
      // 普通滚轮：平移画布
      const deltaX = e.deltaX || 0;
      const deltaY = e.deltaY || 0;
      setOffset(prev => ({
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }));
    }
  };

  // 面板宽度拖拽处理
  const handlePanelResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingPanel(side);
  };

  const handlePanelResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingPanel) return;
    
    if (isResizingPanel === 'left') {
      // 左侧面板：最小宽度180，最大宽度400
      const newWidth = Math.max(180, Math.min(400, e.clientX));
      setLeftPanelWidth(newWidth);
    } else if (isResizingPanel === 'right') {
      // 右侧面板：最小宽度240，最大宽度500
      const newWidth = Math.max(240, Math.min(500, window.innerWidth - e.clientX));
      setRightPanelWidth(newWidth);
    }
  }, [isResizingPanel]);

  const handlePanelResizeEnd = useCallback(() => {
    setIsResizingPanel(null);
  }, []);

  // 监听面板拖拽事件
  useEffect(() => {
    if (isResizingPanel) {
      document.addEventListener('mousemove', handlePanelResizeMove);
      document.addEventListener('mouseup', handlePanelResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handlePanelResizeMove);
      document.removeEventListener('mouseup', handlePanelResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.removeEventListener('mousemove', handlePanelResizeMove);
      document.removeEventListener('mouseup', handlePanelResizeEnd);
    };
  }, [isResizingPanel, handlePanelResizeMove, handlePanelResizeEnd]);

  // 添加事件
  const addEvent = (type: 'click' | 'hover' | 'longPress') => {
    if (!selectedElement) return;
    const events = [...selectedElement.events, { type, actions: [] }];
    updateElement({ events });
  };

  // 添加事件动作
  const addActionToEvent = (eventIndex: number, action: Omit<EventAction, 'id'>) => {
    if (!selectedElement) return;
    const events = [...selectedElement.events];
    const newAction: EventAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    events[eventIndex].actions.push(newAction);
    updateElement({ events });
  };

  // 更新事件动作
  const updateActionInEvent = (eventIndex: number, actionId: string, updates: Partial<EventAction>) => {
    if (!selectedElement) return;
    const events = [...selectedElement.events];
    const actionIndex = events[eventIndex].actions.findIndex(a => a.id === actionId);
    if (actionIndex !== -1) {
      events[eventIndex].actions[actionIndex] = {
        ...events[eventIndex].actions[actionIndex],
        ...updates,
      };
      updateElement({ events });
    }
  };

  // 删除事件动作
  const removeActionFromEvent = (eventIndex: number, actionId: string) => {
    if (!selectedElement) return;
    const events = [...selectedElement.events];
    events[eventIndex].actions = events[eventIndex].actions.filter(a => a.id !== actionId);
    updateElement({ events });
  };

  // 更新事件动作 (保留旧函数兼容性)
  const updateEventAction = (eventIndex: number, action: Omit<EventAction, 'id'>) => {
    if (!selectedElement) return;
    const events = [...selectedElement.events];
    const newAction: EventAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    events[eventIndex].actions.push(newAction);
    updateElement({ events });
  };

  // 删除事件
  const removeEvent = (eventIndex: number) => {
    if (!selectedElement) return;
    const events = selectedElement.events.filter((_, i) => i !== eventIndex);
    updateElement({ events });
  };

  // 应用按钮预设
  // 获取动作类型的中文标签
  const getActionLabel = (type: EventActionType): string => {
    const labels: Record<EventActionType, string> = {
      jumpScene: '跳转场景',
      showElement: '显示元素',
      hideElement: '隐藏元素',
      toggleElement: '切换显示',
      playAudio: '播放音频',
      pauseAudio: '暂停音频',
      playVideo: '播放视频',
      pauseVideo: '暂停视频',
      stopMedia: '停止媒体',
      delay: '延迟等待',
      setProperty: '设置属性',
      animate: '执行动画',
      moveTo: '移动到',
      scaleTo: '缩放到',
      rotateTo: '旋转到',
      setOpacity: '设置透明度',
      setVolume: '设置音量',
      seekTo: '跳转播放位置',
      addHealth: '加血',
      reduceHealth: '减血',
      setHealth: '设置血量',
      checkAnswer: '检查答案',
      startPathAnimation: '路径动画',
    };
    return labels[type] || type;
  };

  // 渲染动作配置界面
  const renderActionConfig = (eventIndex: number, action: EventAction) => {
    const currentScene = scenes.find(s => s.id === currentSceneId);
    const availableElements = currentScene?.elements.filter(e => e.id !== selectedElement?.id) || [];

    switch (action.type) {
      case 'jumpScene':
        return (
          <Select
            value={action.targetSceneId || ''}
            onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetSceneId: v })}
          >
            <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
              <SelectValue placeholder="选择目标场景" />
            </SelectTrigger>
            <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
              {scenes.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'showElement':
      case 'hideElement':
      case 'toggleElement':
        return (
          <Select
            value={action.targetElementId || ''}
            onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
          >
            <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
              <SelectValue placeholder="选择目标元素" />
            </SelectTrigger>
            <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
              {availableElements.map((el) => (
                <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'playAudio':
        return (
          <div className="space-y-3">
            {/* 音频来源选择 */}
            <div className="space-y-2">
              <Label className="text-xs text-white">音频来源</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={action.audioUrl === undefined ? 'default' : 'outline'}
                  className={`h-7 text-xs ${action.audioUrl === undefined ? 'bg-purple-600' : 'border-zinc-600 text-zinc-300'}`}
                  onClick={() => updateActionInEvent(eventIndex, action.id, { audioUrl: undefined, targetElementId: '' })}
                >
                  选择元素
                </Button>
                <Button
                  size="sm"
                  variant={action.audioUrl !== undefined ? 'default' : 'outline'}
                  className={`h-7 text-xs ${action.audioUrl !== undefined ? 'bg-purple-600' : 'border-zinc-600 text-zinc-300'}`}
                  onClick={() => updateActionInEvent(eventIndex, action.id, { audioUrl: '', targetElementId: undefined })}
                >
                  直接输入URL
                </Button>
              </div>
            </div>
            
            {/* 选择音频元素 - 默认显示（audioUrl未设置时） */}
            {action.audioUrl === undefined && (
              <Select
                value={action.targetElementId || ''}
                onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
              >
                <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                  <SelectValue placeholder="选择音频元素" />
                </SelectTrigger>
                <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                  {availableElements.filter(e => e.type === 'audio').map((el) => (
                    <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                  ))}
                  {availableElements.filter(e => e.type === 'audio').length === 0 && (
                    <SelectItem value="_none" disabled className="text-zinc-400">暂无音频元素，请先添加</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            
            {/* 直接输入音频URL */}
            {action.audioUrl !== undefined && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={action.audioUrl || ''}
                    onChange={(e) => updateActionInEvent(eventIndex, action.id, { audioUrl: e.target.value })}
                    placeholder="输入音频URL"
                    className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 border-zinc-500 text-zinc-300"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'audio/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          updateActionInEvent(eventIndex, action.id, { audioUrl: url });
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {action.audioUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-blue-400"
                    onClick={() => {
                      const audio = new Audio(action.audioUrl!);
                      audio.play().catch(() => {});
                    }}
                  >
                    试听
                  </Button>
                )}
              </div>
            )}
            
            {/* 音量设置 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">音量</Label>
                <span className="text-xs text-white">{action.volume ?? 100}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={action.volume ?? 100}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { volume: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* 循环播放 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">循环播放</Label>
              <Switch
                checked={action.loop ?? false}
                onCheckedChange={(v) => updateActionInEvent(eventIndex, action.id, { loop: v })}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
            
            {/* 静音设置 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">静音</Label>
              <Switch
                checked={action.muted ?? false}
                onCheckedChange={(v) => updateActionInEvent(eventIndex, action.id, { muted: v })}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          </div>
        );

      case 'pauseAudio':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择音频元素" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.filter(e => e.type === 'audio').map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'playVideo':
        return (
          <div className="space-y-3">
            {/* 视频来源选择 */}
            <div className="space-y-2">
              <Label className="text-xs text-white">视频来源</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={action.videoUrl === undefined ? 'default' : 'outline'}
                  className={`h-7 text-xs ${action.videoUrl === undefined ? 'bg-purple-600' : 'border-zinc-600 text-zinc-300'}`}
                  onClick={() => updateActionInEvent(eventIndex, action.id, { videoUrl: undefined, targetElementId: '' })}
                >
                  选择元素
                </Button>
                <Button
                  size="sm"
                  variant={action.videoUrl !== undefined ? 'default' : 'outline'}
                  className={`h-7 text-xs ${action.videoUrl !== undefined ? 'bg-purple-600' : 'border-zinc-600 text-zinc-300'}`}
                  onClick={() => updateActionInEvent(eventIndex, action.id, { videoUrl: '', targetElementId: undefined })}
                >
                  直接输入URL
                </Button>
              </div>
            </div>
            
            {/* 选择视频元素 - 默认显示 */}
            {action.videoUrl === undefined && (
              <Select
                value={action.targetElementId || ''}
                onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
              >
                <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                  <SelectValue placeholder="选择视频元素" />
                </SelectTrigger>
                <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                  {availableElements.filter(e => e.type === 'video').map((el) => (
                    <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                  ))}
                  {availableElements.filter(e => e.type === 'video').length === 0 && (
                    <SelectItem value="_none" disabled className="text-zinc-400">暂无视频元素，请先添加</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            
            {/* 直接输入视频URL */}
            {action.videoUrl !== undefined && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={action.videoUrl || ''}
                    onChange={(e) => updateActionInEvent(eventIndex, action.id, { videoUrl: e.target.value })}
                    placeholder="输入视频URL"
                    className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 border-zinc-500 text-zinc-300"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'video/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          updateActionInEvent(eventIndex, action.id, { videoUrl: url });
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* 音量设置 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">音量</Label>
                <span className="text-xs text-white">{action.volume ?? 100}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={action.volume ?? 100}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { volume: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* 循环播放 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">循环播放</Label>
              <Switch
                checked={action.loop ?? false}
                onCheckedChange={(v) => updateActionInEvent(eventIndex, action.id, { loop: v })}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          </div>
        );

      case 'pauseVideo':
        return (
          <Select
            value={action.targetElementId || ''}
            onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
          >
            <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
              <SelectValue placeholder="选择视频元素" />
            </SelectTrigger>
            <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
              {availableElements.filter(e => e.type === 'video').map((el) => (
                <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'stopMedia':
        return (
          <Select
            value={action.targetElementId || ''}
            onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
          >
            <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
              <SelectValue placeholder="选择媒体元素" />
            </SelectTrigger>
            <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
              {availableElements.filter(e => e.type === 'audio' || e.type === 'video').map((el) => (
                <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'delay':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={action.delay || 1000}
              onChange={(e) => updateActionInEvent(eventIndex, action.id, { delay: parseInt(e.target.value) || 1000 })}
              className="h-8 bg-zinc-600 border-zinc-500 text-xs w-24 text-white"
              min={0}
              max={60000}
            />
            <span className="text-xs text-zinc-400">毫秒</span>
          </div>
        );

      case 'setOpacity':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择目标元素" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">透明度</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((action.value ?? 1) * 100)}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { value: parseInt(e.target.value) / 100 })}
                className="flex-1 h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-white w-10">{Math.round((action.value ?? 1) * 100)}%</span>
            </div>
          </div>
        );

      case 'setVolume':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择媒体元素" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.filter(e => e.type === 'audio' || e.type === 'video').map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">音量</span>
              <input
                type="range"
                min={0}
                max={100}
                value={action.value ?? 100}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { value: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-white w-10">{action.value ?? 100}%</span>
            </div>
          </div>
        );

      case 'scaleTo':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择目标元素" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">缩放</span>
              <input
                type="range"
                min={10}
                max={300}
                value={Math.round((action.value ?? 1) * 100)}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { value: parseInt(e.target.value) / 100 })}
                className="flex-1 h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-white w-12">{Math.round((action.value ?? 1) * 100)}%</span>
            </div>
          </div>
        );

      case 'rotateTo':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择目标元素" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">旋转</span>
              <input
                type="range"
                min={0}
                max={360}
                value={action.value ?? 0}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { value: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-white w-12">{action.value ?? 0}°</span>
            </div>
          </div>
        );

      case 'seekTo':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择媒体元素" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.filter(e => e.type === 'audio' || e.type === 'video').map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">跳转到</span>
              <Input
                type="number"
                value={action.value ?? 0}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { value: parseInt(e.target.value) ?? 0 })}
                className="h-8 bg-zinc-600 border-zinc-500 text-xs w-20 text-white"
                min={0}
              />
              <span className="text-xs text-zinc-400">秒</span>
            </div>
          </div>
        );

      case 'moveTo':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择目标元素" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">X:</span>
              <Input
                type="number"
                value={action.position?.x ?? 0}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { 
                  position: { x: parseInt(e.target.value) ?? 0, y: action.position?.y ?? 0 } 
                })}
                className="h-8 bg-zinc-600 border-zinc-500 text-xs w-16 text-white"
              />
              <span className="text-xs text-zinc-400">Y:</span>
              <Input
                type="number"
                value={action.position?.y ?? 0}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { 
                  position: { x: action.position?.x ?? 0, y: parseInt(e.target.value) ?? 0 } 
                })}
                className="h-8 bg-zinc-600 border-zinc-500 text-xs w-16 text-white"
              />
            </div>
          </div>
        );

      case 'animate':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择目标元素" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={action.animationType || 'fade'}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { animationType: v as any })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择动画类型" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                <SelectItem value="slide">滑动</SelectItem>
                <SelectItem value="zoom">缩放</SelectItem>
                <SelectItem value="bounce">弹跳</SelectItem>
                <SelectItem value="shake">抖动</SelectItem>
                <SelectItem value="pulse">脉冲</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">时长:</span>
              <Input
                type="number"
                value={action.animationDuration || 500}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { animationDuration: parseInt(e.target.value) || 500 })}
                className="h-8 bg-zinc-600 border-zinc-500 text-xs w-20 text-white"
                min={100}
                max={10000}
              />
              <span className="text-xs text-zinc-400">ms</span>
            </div>
          </div>
        );

      case 'setProperty':
        return (
          <div className="space-y-3">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v, propertyName: '' })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择目标元素" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name} ({elementNames[el.type]})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Label className="text-xs text-white">属性名</Label>
              <Select
                value={action.propertyName || ''}
                onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { propertyName: v })}
              >
                <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                  <SelectValue placeholder="选择属性" />
                </SelectTrigger>
                <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                  {/* 通用属性 */}
                  <SelectItem value="visible">可见性</SelectItem>
                  <SelectItem value="opacity">透明度</SelectItem>
                  <SelectItem value="backgroundColor">背景颜色</SelectItem>
                  <SelectItem value="color">文字颜色</SelectItem>
                  <SelectItem value="fontSize">字体大小</SelectItem>
                  <SelectItem value="borderRadius">圆角</SelectItem>
                  <SelectItem value="rotation">旋转角度</SelectItem>
                  <SelectItem value="scale">缩放</SelectItem>
                  <SelectItem value="content">文本内容</SelectItem>
                  {/* 血条特有属性 */}
                  <SelectItem value="healthValue">血量值</SelectItem>
                  <SelectItem value="maxHealth">最大血量</SelectItem>
                  <SelectItem value="healthBarColor">血条颜色</SelectItem>
                  {/* 选择项特有属性 */}
                  <SelectItem value="isCorrectChoice">是否正确答案</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-white">属性值</Label>
              {action.propertyName === 'visible' ? (
                <Select
                  value={action.propertyValue !== undefined ? String(action.propertyValue) : ''}
                  onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { propertyValue: v === 'true' })}
                >
                  <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                    <SelectValue placeholder="选择值" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                    <SelectItem value="true">显示</SelectItem>
                    <SelectItem value="false">隐藏</SelectItem>
                  </SelectContent>
                </Select>
              ) : action.propertyName === 'isCorrectChoice' ? (
                <Select
                  value={action.propertyValue !== undefined ? String(action.propertyValue) : ''}
                  onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { propertyValue: v === 'true' })}
                >
                  <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                    <SelectValue placeholder="选择值" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                    <SelectItem value="true">正确</SelectItem>
                    <SelectItem value="false">错误</SelectItem>
                  </SelectContent>
                </Select>
              ) : action.propertyName === 'healthValue' || action.propertyName === 'maxHealth' ? (
                <Input
                  type="number"
                  value={action.propertyValue ?? 100}
                  onChange={(e) => updateActionInEvent(eventIndex, action.id, { propertyValue: parseInt(e.target.value) || 0 })}
                  className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white"
                  min={0}
                />
              ) : action.propertyName === 'healthBarColor' ? (
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={action.propertyValue || '#22C55E'}
                    onChange={(e) => updateActionInEvent(eventIndex, action.id, { propertyValue: e.target.value })}
                    className="w-10 h-8 p-1 bg-zinc-600 border-zinc-500"
                  />
                  <Input
                    value={action.propertyValue || '#22C55E'}
                    onChange={(e) => updateActionInEvent(eventIndex, action.id, { propertyValue: e.target.value })}
                    className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white flex-1"
                  />
                </div>
              ) : action.propertyName === 'opacity' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((action.propertyValue ?? 1) * 100)}
                    onChange={(e) => updateActionInEvent(eventIndex, action.id, { propertyValue: parseInt(e.target.value) / 100 })}
                    className="flex-1 h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-white w-10">{Math.round((action.propertyValue ?? 1) * 100)}%</span>
                </div>
              ) : action.propertyName === 'rotation' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={action.propertyValue ?? 0}
                    onChange={(e) => updateActionInEvent(eventIndex, action.id, { propertyValue: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-white w-10">{action.propertyValue ?? 0}°</span>
                </div>
              ) : action.propertyName === 'scale' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={300}
                    value={Math.round((action.propertyValue ?? 1) * 100)}
                    onChange={(e) => updateActionInEvent(eventIndex, action.id, { propertyValue: parseInt(e.target.value) / 100 })}
                    className="flex-1 h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-white w-10">{Math.round((action.propertyValue ?? 1) * 100)}%</span>
                </div>
              ) : action.propertyName === 'fontSize' ? (
                <Input
                  type="number"
                  value={action.propertyValue ?? 14}
                  onChange={(e) => updateActionInEvent(eventIndex, action.id, { propertyValue: parseInt(e.target.value) || 14 })}
                  className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white"
                  min={8}
                  max={200}
                />
              ) : action.propertyName === 'borderRadius' ? (
                <Input
                  type="number"
                  value={action.propertyValue ?? 0}
                  onChange={(e) => updateActionInEvent(eventIndex, action.id, { propertyValue: parseInt(e.target.value) || 0 })}
                  className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white"
                  min={0}
                  max={100}
                />
              ) : (
                <Input
                  value={action.propertyValue ?? ''}
                  onChange={(e) => updateActionInEvent(eventIndex, action.id, { propertyValue: e.target.value })}
                  placeholder="输入属性值"
                  className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white"
                />
              )}
            </div>
          </div>
        );

      case 'addHealth':
      case 'reduceHealth':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择血条组件" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.filter(e => e.type === 'healthBar').map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
                {availableElements.filter(e => e.type === 'healthBar').length === 0 && (
                  <SelectItem value="_none" disabled className="text-zinc-400">暂无血条组件，请先添加</SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">{action.type === 'addHealth' ? '增加' : '减少'}</span>
              <Input
                type="number"
                value={action.value ?? 10}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { value: parseInt(e.target.value) ?? 10 })}
                className="h-8 bg-zinc-600 border-zinc-500 text-xs w-16 text-white"
                min={0}
              />
              <span className="text-xs text-zinc-400">点血量</span>
            </div>
          </div>
        );

      case 'setHealth':
        return (
          <div className="space-y-2">
            <Select
              value={action.targetElementId || ''}
              onValueChange={(v) => updateActionInEvent(eventIndex, action.id, { targetElementId: v })}
            >
              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white data-[placeholder]:text-zinc-300">
                <SelectValue placeholder="选择血条组件" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-zinc-800 border-zinc-600 z-[200]">
                {availableElements.filter(e => e.type === 'healthBar').map((el) => (
                  <SelectItem key={el.id} value={el.id}>{el.name}</SelectItem>
                ))}
                {availableElements.filter(e => e.type === 'healthBar').length === 0 && (
                  <SelectItem value="_none" disabled className="text-zinc-400">暂无血条组件，请先添加</SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">设置为</span>
              <Input
                type="number"
                value={action.value ?? 100}
                onChange={(e) => updateActionInEvent(eventIndex, action.id, { value: parseInt(e.target.value) ?? 100 })}
                className="h-8 bg-zinc-600 border-zinc-500 text-xs w-16 text-white"
                min={0}
              />
              <span className="text-xs text-zinc-400">点血量</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const applyButtonPreset = (preset: ButtonPreset) => {
    updateElement({
      backgroundColor: preset.style.backgroundColor,
      color: preset.style.color,
      borderRadius: preset.style.borderRadius,
      borderWidth: preset.style.borderWidth,
      borderColor: preset.style.borderColor,
      boxShadow: preset.style.boxShadow,
    });
  };

  // 处理文件上传
  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video' | 'panorama' | 'panoramaVideo' | 'audio') => {
    if (!files || files.length === 0) return;

    // 文件大小限制为 100MB
    const maxSize = 100 * 1024 * 1024; // 100MB

    for (const file of Array.from(files)) {
      // 检查文件大小
      if (file.size > maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        alert(`文件 "${file.name}" 过大（${sizeMB}MB）\n\n本地上传最大支持 100MB。\n\n解决方案：\n1. 压缩视频文件\n2. 使用「URL链接」导入外部视频\n3. 将视频上传到云存储后使用链接导入`);
        continue;
      }

      // 先显示本地预览
      const localUrl = URL.createObjectURL(file);
      
      // 上传到对象存储
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        console.log('开始上传文件:', file.name, '大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        console.log('上传响应状态:', response.status, response.statusText);
        
        // 先尝试读取响应文本
        const responseText = await response.text();
        console.log('上传响应内容:', responseText.substring(0, 500));
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          // 检查是否是服务器限制错误
          if (responseText.includes('Request Entity Too Large') || responseText.includes('413')) {
            throw new Error('文件超出服务器限制，请压缩视频或使用URL链接导入');
          }
          console.error('解析响应失败:', responseText);
          throw new Error(`服务器返回格式错误: ${responseText.substring(0, 100)}`);
        }
        
        if (!response.ok) {
          // 处理 413 错误
          if (response.status === 413) {
            throw new Error('文件超出服务器限制，请压缩视频或使用URL链接导入');
          }
          throw new Error(result.error || result.details || `上传失败 (${response.status})`);
        }
        
        if (result.success && result.url) {
          // 使用对象存储的 URL
          const url = result.url;
          
          const resource: MediaResource = {
            id: genId(),
            name: file.name,
            type,
            url,
            size: file.size,
          };

          setMediaResources(prev => [...prev, resource]);
          
          // 如果当前选中的元素是图片或视频控件，自动更新其src属性
          if (selectedElement) {
            if (type === 'image' && selectedElement.type === 'image') {
              updateElement({ src: url, name: file.name });
            } else if (type === 'video' && selectedElement.type === 'video') {
              updateElement({ src: url, name: file.name });
            } else if (type === 'panorama' && currentScene) {
              setScenes(scenes.map(s => 
                s.id === currentSceneId ? { ...s, panoramaImage: url } : s
              ));
            } else if (type === 'panoramaVideo' && currentScene) {
              setScenes(scenes.map(s => 
                s.id === currentSceneId ? { ...s, panoramaVideo: url } : s
              ));
            }
          } else if (type === 'panorama' && currentScene) {
            setScenes(scenes.map(s => 
              s.id === currentSceneId ? { ...s, panoramaImage: url } : s
            ));
          } else if (type === 'panoramaVideo' && currentScene) {
            setScenes(scenes.map(s => 
              s.id === currentSceneId ? { ...s, panoramaVideo: url } : s
            ));
          }
          
          // 上传成功，释放本地 URL
          URL.revokeObjectURL(localUrl);
        } else {
          throw new Error(result.error || '上传失败');
        }
      } catch (error) {
        console.error('上传文件失败:', error);
        alert(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
        // 上传失败，不添加资源到列表，避免使用 blob: URL
        // 因为 blob: URL 只在当前页面有效，预览页面会失效
        URL.revokeObjectURL(localUrl);
      }
    }
    
    setShowMediaDialog(false);
    setSaveStatus('unsaved');
  };

  // 添加URL资源
  const addMediaFromUrl = () => {
    if (!mediaUrl.trim()) return;

    const resource: MediaResource = {
      id: genId(),
      name: mediaUrl.split('/').pop() || '外部资源',
      type: mediaType,
      url: mediaUrl,
    };

    setMediaResources(prev => [...prev, resource]);
    
    // 如果当前选中的元素是图片或视频控件，自动更新其src属性
    if (selectedElement) {
      if (mediaType === 'image' && selectedElement.type === 'image') {
        updateElement({ src: mediaUrl, name: resource.name });
      } else if (mediaType === 'video' && selectedElement.type === 'video') {
        updateElement({ src: mediaUrl, name: resource.name });
      } else if (mediaType === 'audio' && selectedElement.type === 'audio') {
        updateElement({ src: mediaUrl, name: resource.name });
      } else if (mediaType === 'panorama' && currentScene) {
        setScenes(scenes.map(s => 
          s.id === currentSceneId ? { ...s, panoramaImage: mediaUrl } : s
        ));
      } else if (mediaType === 'panoramaVideo' && currentScene) {
        setScenes(scenes.map(s => 
          s.id === currentSceneId ? { ...s, panoramaVideo: mediaUrl } : s
        ));
      }
    } else if (mediaType === 'panorama' && currentScene) {
      setScenes(scenes.map(s => 
        s.id === currentSceneId ? { ...s, panoramaImage: mediaUrl } : s
      ));
    } else if (mediaType === 'panoramaVideo' && currentScene) {
      setScenes(scenes.map(s => 
        s.id === currentSceneId ? { ...s, panoramaVideo: mediaUrl } : s
      ));
    }
    
    setMediaUrl('');
    setShowMediaDialog(false);
  };

  // 将媒体资源添加到画布
  const addMediaToCanvas = (resource: MediaResource) => {
    if (resource.type === 'image') {
      addElement('image', undefined, {
        src: resource.url,
        name: resource.name,
        width: 240,
        height: 160,
      });
    } else if (resource.type === 'video') {
      addElement('video', undefined, {
        src: resource.url,
        name: resource.name,
        width: 320,
        height: 180,
        playOnVisible: true,
        loop: true,
        muted: true,
        controls: false,
      });
    } else if (resource.type === 'audio') {
      addElement('audio', undefined, {
        src: resource.url,
        name: resource.name,
        width: 200,
        height: 40,
      });
    } else if (resource.type === 'panorama') {
      setScenes(scenes.map(s => 
        s.id === currentSceneId ? { ...s, panoramaImage: resource.url } : s
      ));
    } else if (resource.type === 'panoramaVideo') {
      setScenes(scenes.map(s => 
        s.id === currentSceneId ? { ...s, panoramaVideo: resource.url } : s
      ));
    }
  };

  // 获取图标组件
  const getIconComponent = (iconName?: string) => {
    const icon = buttonIcons.find(i => i.name === iconName);
    return icon?.icon || null;
  };

  // 获取属性面板标签列表
  const getPropertyTabs = (): { id: PropertyTab; label: string; icon: React.ReactNode }[] => {
    if (!selectedElement) return [];
    
    const baseTabs: { id: PropertyTab; label: string; icon: React.ReactNode }[] = [
      { id: 'style', label: '样式', icon: <Palette className="w-4 h-4" /> },
      { id: 'behavior', label: '行为', icon: <Settings className="w-4 h-4" /> },
      { id: 'event', label: '事件', icon: <Sparkles className="w-4 h-4" /> },
    ];

    // 音频只需要源设置、行为和事件，不需要样式
    if (selectedElement.type === 'audio') {
      return [
        { id: 'source', label: '源文件', icon: <FileVideo className="w-4 h-4" /> },
        { id: 'behavior', label: '行为', icon: <Settings className="w-4 h-4" /> },
        { id: 'event', label: '事件', icon: <Sparkles className="w-4 h-4" /> },
      ];
    }

    // 图片和视频需要源设置
    if (['image', 'video'].includes(selectedElement.type)) {
      return [
        { id: 'source', label: '源文件', icon: <FileVideo className="w-4 h-4" /> },
        { id: 'style', label: '样式', icon: <Palette className="w-4 h-4" /> },
        { id: 'behavior', label: '行为', icon: <Settings className="w-4 h-4" /> },
        { id: 'event', label: '事件', icon: <Sparkles className="w-4 h-4" /> },
      ];
    }

    // 按钮和文本
    if (['button', 'text'].includes(selectedElement.type)) {
      return [
        { id: 'source', label: '内容', icon: <Type className="w-4 h-4" /> },
        { id: 'style', label: '样式', icon: <Palette className="w-4 h-4" /> },
        { id: 'behavior', label: '行为', icon: <Settings className="w-4 h-4" /> },
        { id: 'event', label: '事件', icon: <Sparkles className="w-4 h-4" /> },
      ];
    }

    // 血条和选择项 - 使用"内容"标签
    if (['healthBar', 'choiceItem'].includes(selectedElement.type)) {
      return [
        { id: 'source', label: '内容', icon: <Type className="w-4 h-4" /> },
        { id: 'style', label: '样式', icon: <Palette className="w-4 h-4" /> },
        { id: 'behavior', label: '行为', icon: <Settings className="w-4 h-4" /> },
        { id: 'event', label: '事件', icon: <Sparkles className="w-4 h-4" /> },
      ];
    }

    // 热点、面板和其他元素
    return baseTabs;
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white">
      {/* 顶部工具栏 */}
      <header className="h-12 bg-zinc-800 border-b border-zinc-700 flex items-center px-3 gap-2 shrink-0">
        <Link href="/create" className="p-1.5 hover:bg-zinc-700 rounded">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Separator orientation="vertical" className="h-6 bg-zinc-600" />
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-40 bg-zinc-700 border border-zinc-600 text-sm font-medium text-white placeholder:text-zinc-400"
        />

        <div className="flex-1 flex justify-center items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className={showGrid ? 'text-purple-400' : 'text-zinc-300'}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            网格
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllGuides}
            disabled={guideLines.length === 0}
            className={guideLines.length > 0 ? 'text-rose-400' : 'text-zinc-500'}
            title="清除所有参考线"
          >
            <AlignLeft className="w-4 h-4 mr-1" />
            参考线
            {guideLines.length > 0 && <span className="ml-1 text-xs">({guideLines.length})</span>}
          </Button>
          
          <Separator orientation="vertical" className="h-5 bg-zinc-600 mx-2" />
          
          {/* 2D/3D模式切换 - 始终显示 */}
          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setEditorMode('2d')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                editorMode === '2d' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Layout className="w-4 h-4" />
                2D
              </div>
            </button>
            <button
              onClick={() => setEditorMode('3d')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                editorMode === '3d' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                3D
              </div>
            </button>
          </div>
          
          {editorMode === '3d' && currentScene?.panoramaImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHotspotMode(!isHotspotMode)}
              className={isHotspotMode ? 'text-purple-400' : 'text-zinc-300'}
            >
              <MousePointerClick className="w-4 h-4 mr-1" />
              添加热点
            </Button>
          )}
          
          <Separator orientation="vertical" className="h-5 bg-zinc-600 mx-2" />
          
          {/* 锚点定位 - 快捷移动元素到画布预设位置 */}
          {selectedElement && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-400">锚点</span>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!value || !currentScene || !selectedElement) return;
                  
                  const canvasW = currentScene.canvasWidth || 1920;
                  const canvasH = currentScene.canvasHeight || 1080;
                  const elW = selectedElement.width;
                  const elH = selectedElement.height;
                  
                  // 根据锚点位置计算新坐标
                  const positions: Record<string, { x: number; y: number; width?: number; height?: number }> = {
                    'top-left': { x: 0, y: 0 },
                    'top-center': { x: (canvasW - elW) / 2, y: 0 },
                    'top-right': { x: canvasW - elW, y: 0 },
                    'center-left': { x: 0, y: (canvasH - elH) / 2 },
                    'center': { x: (canvasW - elW) / 2, y: (canvasH - elH) / 2 },
                    'center-right': { x: canvasW - elW, y: (canvasH - elH) / 2 },
                    'bottom-left': { x: 0, y: canvasH - elH },
                    'bottom-center': { x: (canvasW - elW) / 2, y: canvasH - elH },
                    'bottom-right': { x: canvasW - elW, y: canvasH - elH },
                    'fullscreen': { x: 0, y: 0, width: canvasW, height: canvasH },
                  };
                  
                  const newPos = positions[value];
                  if (newPos) {
                    if (newPos.width !== undefined && newPos.height !== undefined) {
                      updateElement({ 
                        x: Math.round(newPos.x), 
                        y: Math.round(newPos.y),
                        width: newPos.width,
                        height: newPos.height
                      });
                    } else {
                      updateElement({ x: Math.round(newPos.x), y: Math.round(newPos.y) });
                    }
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[100px] bg-zinc-700 border-zinc-600 text-xs">
                  <SelectValue placeholder="选择位置" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                  <SelectItem value="top-left">↖ 左上</SelectItem>
                  <SelectItem value="top-center">↑ 中上</SelectItem>
                  <SelectItem value="top-right">↗ 右上</SelectItem>
                  <SelectItem value="center-left">← 左中</SelectItem>
                  <SelectItem value="center">⊙ 中心</SelectItem>
                  <SelectItem value="center-right">→ 右中</SelectItem>
                  <SelectItem value="bottom-left">↙ 左下</SelectItem>
                  <SelectItem value="bottom-center">↓ 中下</SelectItem>
                  <SelectItem value="bottom-right">↘ 右下</SelectItem>
                  <SelectItem value="fullscreen">⛶ 铺满全屏</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Separator orientation="vertical" className="h-5 bg-zinc-600 mx-2" />
          <Button variant="ghost" size="sm" onClick={() => handleZoom(-0.1)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-zinc-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => handleZoom(0.1)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setZoom(1); setOffset({ x: 50, y: 50 }); }}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* 调试按钮 - 显示场景数据 */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-400"
            onClick={() => {
              const data = {
                当前场景: currentScene?.name,
                全景图: currentScene?.panoramaImage || '无',
                全景视频: currentScene?.panoramaVideo || '无',
                元素数量: currentScene?.elements?.length || 0,
                热点数量: currentScene?.elements?.filter(e => e.type === 'hotspot').length || 0,
              };
              console.log('场景数据:', data);
              console.log('完整场景:', JSON.stringify(currentScene, null, 2));
              alert(`当前场景: ${data.当前场景}\n全景图: ${data.全景图 ? '已设置' : '未设置'}\n全景视频: ${data.全景视频 ? '已设置' : '未设置'}\n元素数量: ${data.元素数量}\n热点数量: ${data.热点数量}`);
            }}
          >
            调试
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-zinc-500 bg-zinc-700 text-white hover:bg-zinc-600 relative overflow-hidden"
            disabled={isPreviewing}
            onClick={() => {
              setIsPreviewing(true);
              
              // 构建项目数据
              const projectData = {
                id: projectId,
                name: projectName,
                scenes,
                mediaResources,
                updatedAt: Date.now(),
              };
              
              console.log('=== 编辑器准备预览 ===');
              console.log('编辑器 - projectId:', projectId);
              console.log('编辑器 - 场景数:', scenes.length);
              console.log('编辑器 - currentSceneId:', currentSceneId);
              
              // 打开预览页面
              const previewWindow = window.open(`/game?story=${projectId}&scene=${currentSceneId}`, '_blank');
              
              // 【关键】使用 window.postMessage 监听预览页面的数据请求
              const handleMessage = (event: MessageEvent) => {
                console.log('编辑器 - 收到 message:', event.data?.type, 'from:', event.origin);
                
                // 只接受来自同源的消息，或者来自预览页面的消息
                if (event.data?.type === 'PREVIEW_REQUEST_DATA') {
                  console.log('编辑器 - 收到预览页面请求，发送数据...');
                  
                  // 通过 postMessage 发送数据到预览窗口
                  if (previewWindow && !previewWindow.closed) {
                    previewWindow.postMessage({
                      type: 'PREVIEW_PROJECT_DATA',
                      data: projectData
                    }, '*'); // 使用 '*' 允许跨域
                    
                    console.log('编辑器 - 数据已发送');
                  }
                }
              };
              
              window.addEventListener('message', handleMessage);
              
              // 保存引用，窗口关闭时清理
              if (previewWindow) {
                const checkClosed = setInterval(() => {
                  if (previewWindow.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', handleMessage);
                    setIsPreviewing(false);
                  }
                }, 500);
                
                // 10秒后自动清理（防止内存泄漏）
                setTimeout(() => {
                  clearInterval(checkClosed);
                  window.removeEventListener('message', handleMessage);
                  setIsPreviewing(false);
                }, 10000);
              }
              
              // 异步保存到数据库
              saveProject();
            }}
          >
            {isPreviewing ? (
              <>
                <div className="w-4 h-4 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                打开中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                预览
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            className={`relative overflow-hidden transition-all text-white font-medium ${
              showSaveSuccess 
                ? 'bg-green-600 hover:bg-green-600' 
                : 'bg-purple-700 hover:bg-purple-800'
            }`}
            onClick={saveProject}
          >
            {showSaveSuccess ? (
              <>
                <svg className="w-4 h-4 mr-1 animate-scale-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                已保存
              </>
            ) : saveStatus === 'saving' ? (
              <>
                <div className="w-4 h-4 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                {saveStatus === 'unsaved' ? '保存*' : '保存'}
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-zinc-500 bg-zinc-700 text-white hover:bg-zinc-600"
            onClick={() => setShowPublishDialog(true)}
            disabled={isSharing}
          >
            {isSharing ? (
              <>
                <div className="w-4 h-4 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                发布中...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-1" />
                发布
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板 */}
        <aside 
          className="bg-zinc-700 border-r border-zinc-600 flex flex-col shrink-0 relative"
          style={{ width: leftPanelWidth }}
        >
          {/* 标签切换 */}
          <div className="flex border-b border-zinc-700">
            {[
              { id: 'elements', icon: <LayoutGrid className="w-4 h-4" />, label: '组件' },
              { id: 'scenes', icon: <FolderTree className="w-4 h-4" />, label: '场景' },
              { id: 'media', icon: <ImageIcon className="w-4 h-4" />, label: '媒体' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 text-xs flex flex-col items-center gap-0.5 transition-colors ${
                  activeTab === tab.id ? 'text-purple-400 bg-zinc-700/50' : 'text-zinc-300 hover:text-zinc-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* 主内容区 - 组件/场景/媒体 */}
          <div 
            className="flex-1 overflow-hidden"
            style={{ 
              flex: componentsCollapsed || layersCollapsed ? '1 1 100%' : `1 1 ${componentPanelRatio * 100}%`,
              minHeight: componentsCollapsed ? 'auto' : '150px'
            }}
          >
            <ScrollArea className="h-full">
            {/* 组件库 */}
            {activeTab === 'elements' && (
              <div className="p-2">
                <p className="text-xs text-zinc-400 px-2 mb-2">拖拽组件到画布</p>
                
                {/* 基础组件 */}
                <div className="mb-3">
                  <p className="text-xs text-zinc-500 px-2 mb-1">基础组件</p>
                  {(
                    [
                      ['button', '按钮'],
                      ['text', '文本'],
                      ['image', '图片'],
                      ['video', '视频'],
                      ['audio', '音频'],
                      ['panel', '面板'],
                      ['label', '标签'],
                    ] as const
                  ).map(([type, name]) => (
                    <div
                      key={type}
                      draggable
                      onClick={() => {
                        playClickSound();
                        setTemplateElementType(type);
                        setSelectedId(null);
                      }}
                      onDragStart={(e) => {
                        setDraggingElementType(type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onDragEnd={() => setDraggingElementType(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-700/50 transition-colors text-left cursor-grab active:cursor-grabbing ${
                        templateElementType === type && !selectedElement ? 'bg-blue-500/20 border border-blue-500/50' :
                        draggingElementType === type ? 'bg-purple-500/20 border border-purple-500/50' : ''
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center text-zinc-300">
                        {elementIcons[type]}
                      </div>
                      <span className="text-sm text-zinc-200">{name}</span>
                    </div>
                  ))}
                </div>

                {/* 3D元素 */}
                <div className="mb-3">
                  <p className="text-xs text-zinc-500 px-2 mb-1">3D元素</p>
                  <div 
                    className="px-2 py-1.5 text-xs text-zinc-500 italic"
                  >
                    仅在3D编辑模式可用
                  </div>
                  {(
                    [
                      ['hotspot', '热点（全景空间）'],
                    ] as const
                  ).map(([type, name]) => (
                    <div
                      key={type}
                      draggable
                      onClick={() => {
                        playClickSound();
                        setTemplateElementType(type);
                        setSelectedId(null);
                      }}
                      onDragStart={(e) => {
                        setDraggingElementType(type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onDragEnd={() => setDraggingElementType(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-700/50 transition-colors text-left cursor-grab active:cursor-grabbing ${
                        templateElementType === type && !selectedElement ? 'bg-blue-500/20 border border-blue-500/50' :
                        draggingElementType === type ? 'bg-purple-500/20 border border-purple-500/50' : ''
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center text-zinc-300">
                        {elementIcons[type]}
                      </div>
                      <span className="text-sm text-zinc-200">{name}</span>
                    </div>
                  ))}
                </div>

                {/* 辅助组件 */}
                <div className="mb-3">
                  <p className="text-xs text-zinc-500 px-2 mb-1">辅助组件</p>
                  {(
                    [
                      ['divider', '分割线'],
                      ['tooltip', '提示框'],
                    ] as const
                  ).map(([type, name]) => (
                    <div
                      key={type}
                      draggable
                      onClick={() => {
                        setTemplateElementType(type);
                        setSelectedId(null);
                      }}
                      onDragStart={(e) => {
                        setDraggingElementType(type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onDragEnd={() => setDraggingElementType(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-700/50 transition-colors text-left cursor-grab active:cursor-grabbing ${
                        templateElementType === type && !selectedElement ? 'bg-blue-500/20 border border-blue-500/50' :
                        draggingElementType === type ? 'bg-purple-500/20 border border-purple-500/50' : ''
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center text-zinc-300">
                        {elementIcons[type]}
                      </div>
                      <span className="text-sm text-zinc-200">{name}</span>
                    </div>
                  ))}
                </div>

                {/* 游戏组件 */}
                <div>
                  <p className="text-xs text-zinc-500 px-2 mb-1">游戏组件</p>
                  {(
                    [
                      ['healthBar', '血条'],
                      ['choiceItem', '选择项'],
                    ] as const
                  ).map(([type, name]) => (
                    <div
                      key={type}
                      draggable
                      onClick={() => {
                        playClickSound();
                        setTemplateElementType(type);
                        setSelectedId(null);
                      }}
                      onDragStart={(e) => {
                        setDraggingElementType(type);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onDragEnd={() => setDraggingElementType(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-700/50 transition-colors text-left cursor-grab active:cursor-grabbing ${
                        templateElementType === type && !selectedElement ? 'bg-blue-500/20 border border-blue-500/50' :
                        draggingElementType === type ? 'bg-purple-500/20 border border-purple-500/50' : ''
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center text-zinc-300">
                        {elementIcons[type]}
                      </div>
                      <span className="text-sm text-zinc-200">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 场景列表 */}
            {activeTab === 'scenes' && (
              <div className="p-3 space-y-2">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={`relative p-3 rounded-lg cursor-pointer transition-all ${
                      currentSceneId === scene.id
                        ? 'bg-purple-500/20 border border-purple-500/50'
                        : 'bg-zinc-700/30 border border-transparent hover:bg-zinc-700/50'
                    } ${!scene.previewEnabled ? 'opacity-60' : ''}`}
                  >
                    {/* 预览勾选框 */}
                    <div 
                      className="absolute top-2 right-2 z-10 flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 删除按钮 */}
                      {scenes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`确定删除场景「${scene.name}」吗？`)) {
                              const newScenes = scenes.filter(s => s.id !== scene.id);
                              setScenes(newScenes);
                              if (currentSceneId === scene.id) {
                                setCurrentSceneId(newScenes[0].id);
                                setSelectedId(null);
                              }
                              setSaveStatus('unsaved');
                            }
                          }}
                          className="w-5 h-5 rounded flex items-center justify-center bg-zinc-700/50 hover:bg-red-500/50 text-zinc-300 hover:text-white transition-colors"
                          title="删除场景"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setScenes(scenes.map(s => 
                            s.id === scene.id ? { ...s, previewEnabled: !s.previewEnabled } : s
                          ));
                          setSaveStatus('unsaved');
                        }}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          scene.previewEnabled 
                            ? 'bg-purple-500 border-purple-500 text-white' 
                            : 'bg-zinc-700 border-zinc-500 hover:border-zinc-400'
                        }`}
                        title={scene.previewEnabled ? '预览中显示' : '预览中隐藏'}
                      >
                        {scene.previewEnabled && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                    
                    <div onClick={() => setCurrentSceneId(scene.id)}>
                      <p className="text-sm font-medium pr-16">{scene.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {scene.canvasWidth || 1920}×{scene.canvasHeight || 1080}
                        <span className="mx-1">·</span>
                        {scene.elements.length} 个元素
                        {scene.panoramaImage && ' · 全景图'}
                        {scene.panoramaVideo && ' · 全景视频'}
                        {!scene.previewEnabled && ' · 已隐藏'}
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() => setShowSceneDialog(true)}
                  variant="outline"
                  className="w-full mt-2 border-dashed border-zinc-600 text-zinc-300 hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加场景
                </Button>
              </div>
            )}

            {/* 媒体资源库 */}
            {activeTab === 'media' && (
              <div className="p-3 space-y-3">
                {/* 3D模式下优先显示全景选项 */}
                {editorMode === '3d' && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 mb-2">
                    <p className="text-xs text-purple-300 mb-2">3D模式 - 推荐导入全景资源</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setMediaType('panorama');
                          setShowMediaDialog(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-purple-500/50 text-purple-200 hover:bg-purple-500/20"
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        全景图
                      </Button>
                      <Button
                        onClick={() => {
                          setMediaType('panoramaVideo');
                          setShowMediaDialog(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-purple-500/50 text-purple-200 hover:bg-purple-500/20"
                      >
                        <Film className="w-4 h-4 mr-1" />
                        全景视频
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setMediaType('image');
                      setShowMediaDialog(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-zinc-600 text-zinc-200"
                  >
                    <Image className="w-4 h-4 mr-1" />
                    图片
                  </Button>
                  <Button
                    onClick={() => {
                      setMediaType('video');
                      setShowMediaDialog(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-zinc-600 text-zinc-200"
                  >
                    <Video className="w-4 h-4 mr-1" />
                    视频
                  </Button>
                </div>
                {editorMode === '2d' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setMediaType('panorama');
                        setShowMediaDialog(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-zinc-600 text-zinc-200"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      全景图
                    </Button>
                    <Button
                      onClick={() => {
                        setMediaType('panoramaVideo');
                        setShowMediaDialog(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-zinc-600 text-zinc-200"
                    >
                      <Film className="w-4 h-4 mr-1" />
                      全景视频
                    </Button>
                  </div>
                )}

                <Separator className="bg-zinc-700" />

                <p className="text-xs text-zinc-400">资源库 ({mediaResources.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {mediaResources.map((resource) => (
                    <div
                      key={resource.id}
                      onClick={() => addMediaToCanvas(resource)}
                      className="aspect-square rounded-lg bg-zinc-700/50 border border-zinc-600 cursor-pointer hover:border-purple-500/50 transition-all overflow-hidden relative group"
                    >
                      {resource.type === 'image' || resource.type === 'panorama' ? (
                        resource.url && !resource.url.startsWith('blob:') && (resource.url.startsWith('http://') || resource.url.startsWith('https://') || resource.url.startsWith('/')) ? (
                          <img src={resource.url} alt={resource.name} className="w-full h-full object-cover" onError={() => {}} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-700">
                            <ImageIcon className="w-8 h-8 text-zinc-300" />
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-700">
                          <Video className="w-8 h-8 text-zinc-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      {/* 资源类型标签 */}
                      {(resource.type === 'panorama' || resource.type === 'panoramaVideo') && (
                        <div className="absolute top-1 left-1 bg-purple-500/80 text-white text-xs px-1.5 py-0.5 rounded">
                          {resource.type === 'panorama' ? '全景图' : '全景视频'}
                        </div>
                      )}
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMediaResources(prev => prev.filter(r => r.id !== resource.id));
                          setSaveStatus('unsaved');
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="删除资源"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                        <p className="text-xs truncate">{resource.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {mediaResources.length === 0 && (
                  <p className="text-xs text-zinc-400 text-center py-4">暂无资源，点击上方按钮添加</p>
                )}
              </div>
            )}
          </ScrollArea>
          </div>
          
          {/* 可拖拽调整高度的分隔条 */}
          {!componentsCollapsed && !layersCollapsed && (
            <div
              className="h-1.5 bg-zinc-600 hover:bg-purple-500/50 cursor-row-resize transition-colors flex items-center justify-center shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingHeight(true);
                const startY = e.clientY;
                const startRatio = componentPanelRatio;
                const containerHeight = e.currentTarget.parentElement?.clientHeight || 500;
                
                const handleMouseMove = (e: MouseEvent) => {
                  const deltaY = e.clientY - startY;
                  const newRatio = startRatio + deltaY / containerHeight;
                  setComponentPanelRatio(Math.max(0.2, Math.min(0.8, newRatio)));
                };
                
                const handleMouseUp = () => {
                  setIsResizingHeight(false);
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div className="w-8 h-0.5 bg-zinc-400 rounded-full" />
            </div>
          )}
          
          {/* 图层面板 - 始终显示 */}
          {currentScene && (
            <div 
              className="border-t border-zinc-600 flex flex-col shrink-0 overflow-hidden"
              style={{ 
                height: componentsCollapsed || layersCollapsed ? 'auto' : `${(1 - componentPanelRatio) * 100}%`,
                minHeight: layersCollapsed ? 'auto' : '120px'
              }}
            >
              {/* 图层标题栏 */}
              <div 
                className="flex items-center justify-between px-3 py-2 bg-zinc-700/50 border-b border-zinc-600 cursor-pointer"
                onClick={() => setLayersCollapsed(!layersCollapsed)}
              >
                <div className="flex items-center gap-2 text-zinc-300">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-medium">图层</span>
                  <span className="text-xs text-zinc-500">({currentScene.elements.length})</span>
                </div>
                <div className="flex items-center gap-1">
                  {layersCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </div>
              
              {/* 图层列表 */}
              {!layersCollapsed && (
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-0.5">
                    {(() => {
                      // 渲染层级树
                      const renderLayerItem = (el: CanvasElement, depth: number = 0, allElements: CanvasElement[]) => {
                        const children = allElements.filter(e => e.parentId === el.id);
                        const hasChildren = children.length > 0;
                        const isDropTarget = dropTargetId === el.id;
                        const isDragging = draggedLayerId === el.id;
                        
                        return (
                          <div key={el.id}>
                            <div
                              onClick={() => setSelectedId(el.id)}
                              className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-all overflow-hidden ${
                                selectedId === el.id ? 'bg-purple-500/20' : 'hover:bg-zinc-700/30'
                              } ${isDropTarget ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''} ${
                                isDragging ? 'opacity-50' : ''
                              }`}
                              style={{ paddingLeft: `${8 + depth * 12}px` }}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', el.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggedLayerId(el.id);
                              }}
                              onDragEnd={() => {
                                setDraggedLayerId(null);
                                setDropTargetId(null);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                              }}
                              onDragEnter={(e) => {
                                e.preventDefault();
                                if (draggedLayerId && draggedLayerId !== el.id) {
                                  // 使用函数式更新获取最新状态
                                  setScenes(prevScenes => {
                                    const scene = prevScenes.find(s => s.id === currentSceneId);
                                    if (!scene) return prevScenes;
                                    const draggedChildren = getAllChildren(draggedLayerId, scene.elements);
                                    if (!draggedChildren.some(c => c.id === el.id)) {
                                      setDropTargetId(el.id);
                                    }
                                    return prevScenes;
                                  });
                                }
                              }}
                              onDragLeave={() => setDropTargetId(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const draggedId = e.dataTransfer.getData('text/plain') || draggedLayerId;
                                if (draggedId && draggedId !== el.id) {
                                  // 使用函数式更新确保使用最新状态
                                  setScenes(prevScenes => {
                                    const sceneIndex = prevScenes.findIndex(s => s.id === currentSceneId);
                                    if (sceneIndex === -1) return prevScenes;
                                    const scene = prevScenes[sceneIndex];
                                    const draggedChildren = getAllChildren(draggedId, scene.elements);
                                    // 检查是否会形成循环引用
                                    if (draggedChildren.some(c => c.id === el.id)) {
                                      return prevScenes;
                                    }
                                    // 更新父级关系
                                    const newElements = scene.elements.map(e => 
                                      e.id === draggedId ? { ...e, parentId: el.id } : e
                                    );
                                    const newScenes = [...prevScenes];
                                    newScenes[sceneIndex] = { ...scene, elements: newElements };
                                    return newScenes;
                                  });
                                  setSaveStatus('unsaved');
                                }
                                setDraggedLayerId(null);
                                setDropTargetId(null);
                              }}
                            >
                              {/* 折叠/展开按钮 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (hasChildren) {
                                    setCollapsedLayerIds(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(el.id)) {
                                        newSet.delete(el.id); // 展开
                                      } else {
                                        newSet.add(el.id); // 折叠
                                      }
                                      return newSet;
                                    });
                                  }
                                }}
                                className="p-0.5 shrink-0 flex items-center justify-center"
                                style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                              >
                                {hasChildren ? (
                                  <ChevronDown 
                                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                                      collapsedLayerIds.has(el.id) ? '-rotate-90' : ''
                                    }`} 
                                  />
                                ) : (
                                  <div className="w-3 h-3" />
                                )}
                              </button>
                              <div className="text-zinc-300 shrink-0">{elementIcons[el.type]}</div>
                              <span className="flex-1 text-xs min-w-0" title={el.name}>
                                {el.name.length > 15 ? el.name.slice(0, 15) + '...' : el.name}
                              </span>
                              {/* 操作按钮组 - 始终可见 */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                {/* 上移按钮（在列表中向上移动，画布层级下降） */}
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    moveElementDown(el.id); 
                                  }}
                                  className="p-1 hover:bg-zinc-600 rounded disabled:opacity-30 flex items-center justify-center"
                                  title="上移（列表中向上）"
                                  disabled={(() => {
                                    const siblings = currentScene.elements.filter(elem => elem.parentId === el.parentId);
                                    return siblings.findIndex(s => s.id === el.id) === 0;
                                  })()}
                                >
                                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                                </button>
                                {/* 下移按钮（在列表中向下移动，画布层级上升） */}
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    moveElementUp(el.id); 
                                  }}
                                  className="p-1 hover:bg-zinc-600 rounded disabled:opacity-30 flex items-center justify-center"
                                  title="下移（列表中向下）"
                                  disabled={(() => {
                                    const siblings = currentScene.elements.filter(elem => elem.parentId === el.parentId);
                                    return siblings.findIndex(s => s.id === el.id) === siblings.length - 1;
                                  })()}
                                >
                                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                </button>
                                {/* 显示/隐藏按钮 */}
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    updateElementById(el.id, { visible: !el.visible }); 
                                  }}
                                  className="p-1 hover:bg-zinc-600 rounded flex items-center justify-center"
                                  title={el.visible ? '隐藏' : '显示'}
                                >
                                  {el.visible ? <Eye className="w-3.5 h-3.5 text-zinc-300" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
                                </button>
                                {/* 删除按钮 */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // 使用函数式更新
                                    setScenes(prevScenes => {
                                      const sceneIndex = prevScenes.findIndex(s => s.id === currentSceneId);
                                      if (sceneIndex === -1) return prevScenes;
                                      const scene = prevScenes[sceneIndex];
                                      const childIds = getAllChildren(el.id, scene.elements).map(e => e.id);
                                      const newElements = scene.elements.filter(item => item.id !== el.id && !childIds.includes(item.id));
                                      const newScenes = [...prevScenes];
                                      newScenes[sceneIndex] = { ...scene, elements: newElements };
                                      return newScenes;
                                    });
                                    if (selectedId === el.id) setSelectedId(null);
                                    setSaveStatus('unsaved');
                                  }}
                                  className="p-1 hover:bg-red-500/20 rounded flex items-center justify-center text-zinc-400 hover:text-red-400"
                                  title="删除"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {/* 只有在未折叠时才渲染子元素 */}
                            {!collapsedLayerIds.has(el.id) && children.map(child => renderLayerItem(child, depth + 1, allElements))}
                          </div>
                        );
                      };
                      
                      const rootElements = currentScene.elements.filter(e => !e.parentId);
                      return rootElements.map(el => renderLayerItem(el, 0, currentScene.elements));
                    })()}
                    {currentScene.elements.length === 0 && (
                      <p className="text-xs text-zinc-400 text-center py-3">暂无元素</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
          
          {/* 左侧面板拖拽调整宽度的分隔条 */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-purple-500/50 transition-colors z-10"
            style={{ transform: 'translateX(50%)' }}
            onMouseDown={(e) => handlePanelResizeStart(e, 'left')}
          />
        </aside>

        {/* 画布区域 */}
        <main className="flex-1 relative overflow-hidden bg-zinc-700 flex flex-col">
          {/* 水平标尺 */}
          <div className="h-5 bg-zinc-800 border-b border-zinc-600 flex shrink-0">
            <div className="w-6 shrink-0 bg-zinc-800 border-r border-zinc-600" />
            <div 
              className="flex-1 relative overflow-hidden cursor-ns-resize"
              onMouseDown={(e) => handleRulerMouseDown(e, 'horizontal')}
            >
              {renderRuler('horizontal')}
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            {/* 垂直标尺 */}
            <div 
              className="w-6 bg-zinc-800 border-r border-zinc-600 relative overflow-hidden shrink-0 cursor-ew-resize"
              onMouseDown={(e) => handleRulerMouseDown(e, 'vertical')}
            >
              {renderRuler('vertical')}
            </div>
            
            {/* 画布 */}
            <div
              ref={canvasRef}
              className="flex-1 relative overflow-hidden"
              style={{ 
                cursor: isDragging && dragType === 'canvas' ? 'grabbing' : 'grab',
                touchAction: 'none',
              }}
              onMouseDown={(e) => handleMouseDown(e)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleCanvasWheel}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingElementType) {
                  // 计算画布坐标
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (rect) {
                    const x = (e.clientX - rect.left - offset.x) / zoom;
                    const y = (e.clientY - rect.top - offset.y) / zoom;
                    addElement(draggingElementType, { x: Math.max(0, x - 50), y: Math.max(0, y - 20) });
                  }
                  setDraggingElementType(null);
                  setTemplateElementType(null); // 清除模板预览
                }
              }}
            >
            {/* 网格 */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                }}
              />
            )}

            {/* 画布内容 */}
            <div
              className="absolute shadow-2xl overflow-hidden"
              style={{
                width: currentScene?.canvasWidth || 1920,
                height: currentScene?.canvasHeight || 1080,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                backgroundColor: currentScene?.backgroundColor || '#1a1a2e',
                isolation: 'isolate',
              }}
            >
              {/* 3D编辑模式 */}
              {editorMode === '3d' ? (
                currentScene?.panoramaImage ? (
                  <div className="absolute inset-0 w-full h-full" style={{ width: currentScene?.canvasWidth || 1920, height: currentScene?.canvasHeight || 1080 }}>
                    <EditorPanoramaViewer
                      imageUrl={currentScene.panoramaImage}
                      isHotspotMode={isHotspotMode}
                      hotspots={currentScene.elements
                        .filter(el => el.type === 'hotspot' && el.visible)
                        .map(el => ({
                          id: el.id,
                          position: el.hotspotPosition || { x: 0, y: 0, z: -100 },
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
                        setSelectedId(hotspotId);
                      }}
                      onHotspotAdd={(position) => {
                        // 添加新热点
                        const hotspotId = genId();
                        const newHotspot: CanvasElement = {
                          id: hotspotId,
                          type: 'hotspot',
                          name: `热点${currentScene.elements.filter(e => e.type === 'hotspot').length + 1}`,
                          x: 960, // 画布中心
                          y: 540,
                          width: 80,
                          height: 80,
                          visible: true,
                          locked: false,
                          backgroundColor: 'rgba(139, 92, 246, 0.5)',
                          color: '#FFFFFF',
                          fontSize: 24,
                          borderRadius: 40,
                          opacity: 1,
                          borderColor: '#8B5CF6',
                          borderWidth: 2,
                          boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
                          content: '',
                          hotspotPosition: position,
                          events: [],
                        };
                        setScenes(scenes.map(s => 
                          s.id === currentSceneId 
                            ? { ...s, elements: [...s.elements, newHotspot] }
                            : s
                        ));
                        setSelectedId(hotspotId);
                        setIsHotspotMode(false);
                        setSaveStatus('unsaved');
                      }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                    <div className="text-center max-w-md">
                      <Globe className="w-16 h-16 mx-auto text-zinc-500 mb-4" />
                      <p className="text-lg text-zinc-300 mb-2">3D编辑模式</p>
                      <p className="text-sm text-zinc-500 mb-6">请先导入全景图或全景视频作为场景背景</p>
                      <div className="flex gap-3 justify-center mb-4">
                        <Button
                          variant="outline"
                          className="border-zinc-600 text-zinc-200"
                          onClick={() => {
                            setMediaType('panorama');
                            setShowMediaDialog(true);
                          }}
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          导入全景图
                        </Button>
                        <Button
                          variant="outline"
                          className="border-zinc-600 text-zinc-200"
                          onClick={() => {
                            setMediaType('panoramaVideo');
                            setShowMediaDialog(true);
                          }}
                        >
                          <Film className="w-4 h-4 mr-2" />
                          导入全景视频
                        </Button>
                      </div>
                      <p className="text-xs text-zinc-500">
                        提示：也可从左侧「媒体」标签页导入全景资源
                      </p>
                    </div>
                  </div>
                )
              ) : null}
              
              {/* 2D编辑模式 - 专门用于UI编辑 */}
              {editorMode === '2d' && (
                <>
              {currentScene?.elements.filter(el => el.type !== 'hotspot').map((el, index) => {
                // 计算文字阴影
                const textShadow = el.shadowColor && el.shadowColor !== 'transparent' 
                  ? `${el.shadowOffsetX || 0}px ${el.shadowOffsetY || 0}px ${el.shadowBlur || 0}px ${el.shadowColor}`
                  : undefined;
                
                // 计算文字描边
                const textStroke = el.textStrokeSize && el.textStrokeSize > 0
                  ? `${el.textStrokeSize}px ${el.textStrokeColor || '#000000'}`
                  : undefined;
                
                // 点击特效动画类
                const getClickEffectClass = () => {
                  if (!el.clickEffect || el.clickEffect === 'none') return '';
                  switch (el.clickEffect) {
                    case 'ripple': return 'animate-ripple';
                    case 'pulse': return 'animate-pulse';
                    case 'bounce': return 'animate-bounce';
                    case 'shake': return 'animate-shake';
                    case 'flash': return 'animate-flash';
                    default: return '';
                  }
                };
                
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
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, el.id);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, el.id)}
                  style={{
                    position: 'absolute',
                    // 路径点坐标代表元素中心位置，需要转换为左上角坐标
                    left: (pathPreviewState?.elementId === el.id 
                      ? pathPreviewState.x - el.width / 2 
                      : el.x) - offsetX,
                    top: (pathPreviewState?.elementId === el.id 
                      ? pathPreviewState.y - el.height / 2 
                      : el.y) - offsetY,
                    width: el.width,
                    height: el.height,
                    // 图片和透明视频使用透明背景
                    backgroundColor: (() => {
                      // 图片和透明视频使用透明背景
                      if (el.type === 'image' || (el.type === 'video' && el.enableTransparency !== false)) {
                        return 'transparent';
                      }
                      // 最大化时透明
                      if (el.isMaximized) {
                        return 'transparent';
                      }
                      // 音频透明
                      if (el.type === 'audio') {
                        return 'transparent';
                      }
                      // 视频、面板直接使用背景色（带透明度）
                      if (el.type === 'video' || el.type === 'panel') {
                        const bgColor = el.backgroundColor || 'transparent';
                        const bgOpacity = el.backgroundOpacity ?? 1;
                        if (bgColor === 'transparent' || bgOpacity === 0) return 'transparent';
                        if (bgOpacity === 1) return bgColor;
                        return hexToRgba(bgColor, bgOpacity);
                      }
                      // 其他元素：支持透明背景
                      let bgColor = el.backgroundColor || '#6B21A8';
                      // 透明背景保持透明
                      if (bgColor === 'transparent') {
                        return 'transparent';
                      }
                      // 白色背景强制改为深紫色
                      if (bgColor === '#FFFFFF' || bgColor === '#ffffff' || bgColor === 'white' || bgColor === '#fff') {
                        bgColor = '#6B21A8';
                      }
                      const bgOpacity = el.backgroundOpacity ?? 1;
                      if (bgOpacity === 0) return 'transparent';
                      if (bgOpacity === 1) return bgColor;
                      return hexToRgba(bgColor, bgOpacity);
                    })(),
                    color: el.color || '#FFFFFF',
                    fontSize: el.fontSize,
                    borderRadius: el.isMaximized ? 0 : el.borderRadius,
                    opacity: el.opacity,
                    border: el.isMaximized || el.type === 'audio' ? 'none' : (el.borderWidth ? `${el.borderWidth}px ${el.borderStyle || 'solid'} ${el.borderColor}` : 'none'),
                    boxShadow: el.isMaximized ? 'none' : el.boxShadow,
                    outline: selectedId === el.id && !el.isMaximized && el.type !== 'text' ? '2px solid #8B5CF6' : 'none',
                    outlineOffset: selectedId === el.id && !el.isMaximized && el.type !== 'text' ? '2px' : '0',
                    // 图片和视频使用block布局，其他使用flex
                    display: (el.type === 'image' || el.type === 'video') ? 'block' : 'flex',
                    alignItems: 'center',
                    justifyContent: el.type === 'text' ? (el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center') : 'center',
                    cursor: el.locked || el.isMaximized ? 'default' : 'move',
                    visibility: el.visible ? 'visible' : 'hidden',
                    fontWeight: el.fontWeight || '500',
                    fontFamily: el.fontFamily || 'inherit',
                    padding: el.isMaximized ? 0 : (el.type === 'text' ? '8px' : el.type === 'video' || el.type === 'image' || el.type === 'audio' ? 0 : '0 16px'),
                    transition: 'transform 0.15s ease, background-color 0.2s ease',
                    gap: el.iconName ? '8px' : '0',
                    // z-index 基于元素在数组中的位置，索引越大越在上层（列表底部 = 画布最上层）
                    zIndex: 10 + index,
                    transformOrigin: transformOrigin,
                    transform: `rotate(${el.rotation || 0}deg) scale(${el.scale || 1})`,
                    lineHeight: el.lineHeight || 1.5,
                    textShadow: textShadow,
                    WebkitTextStroke: textStroke,
                    overflow: el.type === 'video' || el.type === 'image' ? 'hidden' : 'visible',
                    // 动画预览
                    ...getAnimationStyle(el, previewAnimationId === el.id),
                  }}
                  className={`${el.type === 'button' ? getClickEffectClass() : ''}`}
                >
                  {el.type === 'text' && (
                    <span style={{ width: '100%', textAlign: el.textAlign || 'center' }}>
                      {el.content}
                    </span>
                  )}
                  {el.type === 'button' && (
                    <>
                      {el.iconName && el.iconPosition !== 'right' && getIconComponent(el.iconName)}
                      <span style={{ color: el.color || '#FFFFFF' }}>{el.content}</span>
                      {el.iconName && el.iconPosition === 'right' && getIconComponent(el.iconName)}
                    </>
                  )}
                  {el.type === 'hotspot' && (
                    <div className="w-full h-full flex flex-col items-center justify-center relative"
                      style={{
                        background: el.backgroundColor || 'rgba(139, 92, 246, 0.5)',
                        borderRadius: '50%',
                        border: `${el.borderWidth || 2}px solid ${el.borderColor || '#8B5CF6'}`,
                        boxShadow: el.boxShadow || '0 0 20px rgba(139, 92, 246, 0.5)',
                      }}
                    >
                      {el.iconName && el.iconPosition !== 'right' && getIconComponent(el.iconName)}
                      {el.content ? (
                        <span className="text-xs font-medium" style={{ color: el.color || '#FFFFFF' }}>
                          {el.content}
                        </span>
                      ) : (
                        !el.iconName && (
                          <>
                            <Circle className="w-4 h-4 mb-0.5" style={{ color: el.color || '#FFFFFF' }} />
                            <span className="text-[10px]" style={{ color: el.color || '#FFFFFF' }}>{el.name}</span>
                          </>
                        )
                      )}
                      {el.iconName && el.iconPosition === 'right' && getIconComponent(el.iconName)}
                      {/* 3D位置提示 */}
                      {el.hotspotPosition && (
                        <span className="absolute -bottom-4 text-[8px] text-purple-300/50">
                          3D: ({Math.round(el.hotspotPosition.x)}, {Math.round(el.hotspotPosition.y)}, {Math.round(el.hotspotPosition.z)})
                        </span>
                      )}
                    </div>
                  )}
                  {el.type === 'image' && (
                    (() => {
                      // 放宽URL验证：只要有src且不是blob就尝试显示
                      const isValidUrl = el.src && !el.src.startsWith('blob:');
                      
                      return isValidUrl ? (
                        <img 
                          src={el.src} 
                          alt="" 
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: el.objectFit || 'cover',
                            objectPosition: 'center',
                            border: 'none',
                            outline: 'none',
                            display: 'block',
                            backgroundColor: 'transparent'
                          }}
                          onError={(e) => {
                            // 静默处理图片加载失败
                            console.warn('图片资源无法加载:', el.src?.substring(0, 50) + '...');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-600/30 border border-dashed border-zinc-500 pointer-events-none">
                          <div className="text-center pointer-events-none">
                            <ImageIcon className="w-8 h-8 mx-auto text-zinc-400 mb-1" />
                            <span className="text-xs text-zinc-400">
                              {el.src?.startsWith('blob:') ? '无效链接' : el.src ? '加载中...' : '图片'}
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  )}
                  {el.type === 'video' && (
                    (() => {
                      // 使用新的验证函数检查视频URL
                      const validation = validateVideoUrl(el.src);
                      
                      return validation.isValid ? (
                        <TransparentVideo
                          src={el.src!}
                          style={{ 
                            width: '100%',
                            height: '100%',
                          }}
                          objectFit={el.objectFit || 'cover'}
                          loop={el.loop !== false}
                          muted={el.muted !== false}
                          autoplay={el.autoplay !== false && !el.controls}
                          controls={!!(el.controls || el.isMaximized)}
                          playsInline
                          enableTransparency={el.enableTransparency !== false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-600/30 border border-dashed border-zinc-500 pointer-events-none">
                          <div className="text-center px-2 pointer-events-none">
                            <PlayCircle className="w-8 h-8 mx-auto text-zinc-400 mb-1" />
                            <span className="text-xs text-zinc-400">
                              {validation.errorMessage || '视频'}
                            </span>
                            {validation.errorType === 'streaming_site' && (
                              <span className="text-xs text-amber-400 block mt-1">
                                请使用直链视频地址
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                  {/* 音频 - 编辑模式下显示透明标签 */}
                  {el.type === 'audio' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-emerald-400/70" />
                        <span className="text-xs text-emerald-400/70">{el.name || '音频'}</span>
                      </div>
                    </div>
                  )}
                  {/* 分割线 */}
                  {el.type === 'divider' && (
                    <div className="w-full h-full bg-current opacity-50" />
                  )}
                  {/* 提示框 */}
                  {el.type === 'tooltip' && (
                    <div className="w-full h-full flex items-center justify-center px-3 py-2 bg-zinc-700 rounded text-sm">
                      {el.content || '提示文字'}
                    </div>
                  )}
                  {/* 标签组件 */}
                  {el.type === 'label' && (
                    (() => {
                      const subType = el.labelSubType || 'icon';
                      const content = el.content || '标签';
                      
                      // 根据子类型渲染不同样式
                      switch (subType) {
                        case 'icon':
                          // 图标标签 - 带图标的标签
                          return (
                            <div className="w-full h-full flex items-center justify-center gap-1.5 px-2">
                              <Tag className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium truncate">{content}</span>
                            </div>
                          );
                        
                        case 'hotspot':
                          // 热点标签 - 圆形热点
                          return (
                            <div className="w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500/80 to-red-500/80 border-2 border-orange-300/50">
                              <span className="text-xs font-bold text-white drop-shadow-sm">{content}</span>
                            </div>
                          );
                        
                        case 'text':
                          // 文字标签 - 纯文字标签
                          return (
                            <div className="w-full h-full flex items-center justify-center px-2">
                              <span className="text-sm font-medium text-zinc-200">{content}</span>
                            </div>
                          );
                        
                        case 'text2d':
                          // 2D文字 - 带背景的文字标签
                          return (
                            <div className="w-full h-full flex items-center justify-center px-3 bg-zinc-800/80 rounded">
                              <span className="text-sm font-medium text-white">{content}</span>
                            </div>
                          );
                        
                        case 'ui':
                          // UI标签 - UI元素标注
                          return (
                            <div className="w-full h-full flex items-center justify-between px-2 bg-blue-500/20 border border-blue-400/30 rounded">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-xs font-medium text-blue-300">{content}</span>
                              </div>
                            </div>
                          );
                        
                        case 'uiAnnotation':
                          // UI标注 - 带箭头的标注
                          return (
                            <div className="w-full h-full flex items-center gap-1 px-2 bg-amber-500/20 border border-amber-400/30 rounded">
                              <span className="text-xs">→</span>
                              <span className="text-xs font-medium text-amber-300">{content}</span>
                            </div>
                          );
                        
                        case 'panel':
                          // 面板标签 - 信息面板
                          return (
                            <div className="w-full h-full flex items-center justify-center px-3 bg-zinc-900/90 border border-zinc-600 rounded-lg shadow-lg">
                              <span className="text-xs font-medium text-zinc-200">{content}</span>
                            </div>
                          );
                        
                        case 'hud':
                          // HUD面板标签 - 游戏风格HUD
                          return (
                            <div className="w-full h-full flex items-center justify-center px-2 bg-cyan-500/10 border border-cyan-400/50 rounded" style={{ fontFamily: 'monospace' }}>
                              <span className="text-xs font-bold text-cyan-400 tracking-wider">{content}</span>
                            </div>
                          );
                        
                        case 'number':
                          // 数字标注 - 圆形数字标签
                          return (
                            <div className="w-full h-full flex items-center justify-center rounded-full bg-emerald-500/80 border-2 border-emerald-300/50">
                              <span className="text-sm font-bold text-white">{content}</span>
                            </div>
                          );
                        
                        case 'summary':
                          // 概注 - 摘要标注
                          return (
                            <div className="w-full h-full flex items-start justify-start p-1.5 bg-violet-500/20 border-l-2 border-violet-400 rounded-r">
                              <span className="text-xs text-violet-300 leading-tight">{content}</span>
                            </div>
                          );
                        
                        case 'style':
                          // 样式注记 - 样式说明
                          return (
                            <div className="w-full h-full flex items-center gap-1 px-2 bg-pink-500/20 border border-dashed border-pink-400/50 rounded">
                              <span className="text-[10px] text-pink-300">CSS</span>
                              <span className="text-xs text-pink-200">{content}</span>
                            </div>
                          );
                        
                        case 'bubble':
                          // 气泡注记 - 对话气泡
                          return (
                            <div className="w-full h-full flex items-center justify-center px-3 relative">
                              <div className="w-full h-full flex items-center justify-center bg-white/90 rounded-2xl px-2">
                                <span className="text-xs font-medium text-zinc-800">{content}</span>
                              </div>
                              {/* 小三角 */}
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-white/90" />
                            </div>
                          );
                        
                        case 'dialog':
                          // 对话框注记 - 对话框样式
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
                    })()
                  )}
                  {/* 血条组件 */}
                  {el.type === 'healthBar' && (
                    <div className="w-full h-full flex items-center gap-2 px-2">
                      {/* 血条背景 */}
                      <div 
                        className="flex-1 h-full rounded overflow-hidden relative"
                        style={{ backgroundColor: el.healthBarBgColor || '#374151' }}
                      >
                        {/* 当前血量 */}
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${((el.healthValue ?? 100) / (el.maxHealth ?? 100)) * 100}%`,
                            backgroundColor: ((el.healthValue ?? 100) / (el.maxHealth ?? 100)) * 100 <= (el.lowHealthThreshold || 30)
                              ? (el.lowHealthColor || '#EF4444')
                              : (el.healthBarColor || '#22C55E'),
                          }}
                        />
                      </div>
                      {/* 血量文字 */}
                      {el.showHealthText !== false && (
                        <span className="text-xs font-medium shrink-0" style={{ color: el.color || '#FFFFFF', minWidth: '40px', textAlign: 'right' }}>
                          {el.healthValue ?? 100}/{el.maxHealth ?? 100}
                        </span>
                      )}
                    </div>
                  )}
                  {/* 选择项组件 */}
                  {el.type === 'choiceItem' && (
                    <div className={`w-full h-full flex items-center justify-center px-4 gap-2 transition-colors rounded-lg border-2 ${
                      el.isSelected 
                        ? 'bg-purple-500/30 border-purple-500' 
                        : 'bg-white/10 hover:bg-white/20 border-white/30'
                    }`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        el.isSelected 
                          ? 'bg-purple-500 border-purple-500' 
                          : 'border-2 border-zinc-400'
                      }`}>
                        {el.isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-medium truncate ${el.isSelected ? 'text-white' : 'text-zinc-200'}`}>{el.content || '选项文字'}</span>
                    </div>
                  )}
                  
                  {/* 选中元素的调整手柄 - 文本元素不显示 */}
                  {selectedId === el.id && !el.locked && el.type !== 'text' && (
                    <>
                      {/* 8个调整手柄 */}
                      {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map((handle) => {
                        const positions: Record<string, React.CSSProperties> = {
                          nw: { left: '-4px', top: '-4px' },
                          n: { left: '50%', top: '-4px', transform: 'translateX(-50%)' },
                          ne: { right: '-4px', top: '-4px' },
                          w: { left: '-4px', top: '50%', transform: 'translateY(-50%)' },
                          e: { right: '-4px', top: '50%', transform: 'transformY(-50%)' },
                          sw: { left: '-4px', bottom: '-4px' },
                          s: { left: '50%', bottom: '-4px', transform: 'translateX(-50%)' },
                          se: { right: '-4px', bottom: '-4px' },
                        };
                        const cursors: Record<string, string> = {
                          nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', se: 'nwse-resize',
                          n: 'ns-resize', s: 'ns-resize', w: 'ew-resize', e: 'ew-resize',
                        };
                        return (
                          <div
                            key={handle}
                            onMouseDown={(e) => startResize(e, handle)}
                            style={{
                              position: 'absolute',
                              width: '8px',
                              height: '8px',
                              backgroundColor: 'white',
                              border: '1px solid #8B5CF6',
                              borderRadius: '2px',
                              cursor: cursors[handle],
                              zIndex: 100,
                              ...positions[handle],
                            }}
                          />
                        );
                      })}
                      
                      {/* 锚点指示器 - 显示变换中心位置，可拖动 */}
                      {(() => {
                        // 计算锚点位置百分比
                        let anchorX = 0;
                        let anchorY = 0;
                        
                        if (el.anchorX !== undefined && el.anchorY !== undefined) {
                          anchorX = el.anchorX;
                          anchorY = el.anchorY;
                        } else if (el.anchorPoint) {
                          const anchorPositions: Record<string, { x: number; y: number }> = {
                            'top-left': { x: 0, y: 0 },
                            'top-center': { x: 50, y: 0 },
                            'top-right': { x: 100, y: 0 },
                            'center-left': { x: 0, y: 50 },
                            'center': { x: 50, y: 50 },
                            'center-right': { x: 100, y: 50 },
                            'bottom-left': { x: 0, y: 100 },
                            'bottom-center': { x: 50, y: 100 },
                            'bottom-right': { x: 100, y: 100 },
                          };
                          const pos = anchorPositions[el.anchorPoint] || { x: 0, y: 0 };
                          anchorX = pos.x;
                          anchorY = pos.y;
                        }
                        
                        return (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${anchorX}%`,
                              top: `${anchorY}%`,
                              transform: 'translate(-50%, -50%)',
                              width: '20px',
                              height: '20px',
                              zIndex: 101,
                              cursor: 'crosshair',
                            }}
                            title={`锚点 (${Math.round(anchorX)}%, ${Math.round(anchorY)}%)`}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startAnchorX = anchorX;
                              const startAnchorY = anchorY;
                              
                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                // 计算移动的距离（相对于元素尺寸的百分比）
                                const deltaX = ((moveEvent.clientX - startX) / el.width) * 100;
                                const deltaY = ((moveEvent.clientY - startY) / el.height) * 100;
                                
                                // 计算新的锚点位置，限制在 0-100 范围内
                                const newAnchorX = Math.max(0, Math.min(100, startAnchorX + deltaX));
                                const newAnchorY = Math.max(0, Math.min(100, startAnchorY + deltaY));
                                
                                updateElement({ anchorX: newAnchorX, anchorY: newAnchorY });
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };
                              
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          >
                            {/* 锚点图标 - 十字准星样式 */}
                            <div className="relative w-full h-full group">
                              {/* 外圈 */}
                              <div className="absolute inset-0 border-2 border-cyan-400 rounded-full group-hover:border-cyan-300 transition-colors" />
                              {/* 中心点 */}
                              <div className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-cyan-400 rounded-full group-hover:bg-cyan-300 transition-colors" />
                              {/* 十字线 */}
                              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-cyan-400 -translate-x-1/2 opacity-50 group-hover:opacity-80 transition-opacity" />
                              <div className="absolute left-0 top-1/2 w-full h-0.5 bg-cyan-400 -translate-y-1/2 opacity-50 group-hover:opacity-80 transition-opacity" />
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
                );
              })}
            
            {/* 路径绘制/编辑模式 - 在画布上显示和编辑路径 */}
            {(pathDrawMode || pathEditMode) && (() => {
              const elementId = pathDrawMode?.elementId || pathEditMode?.elementId;
              const pathElement = currentScene?.elements.find(el => el.id === elementId);
              const elementPath = pathElement?.path;
              
              if (!pathElement) return null;
              
              const points = elementPath?.points || [];
              
              // 计算平滑贝塞尔曲线的控制点（自动计算）
              const getAutoControlPoints = (prev: PathPoint | null, next: PathPoint | null, curr: PathPoint, index: number, total: number) => {
                // 起点 and 终点使用较小的控制点
                if (index === 0) {
                  if (!next) return { controlOut: { x: 0, y: 0 } };
                  const dx = next.x - curr.x;
                  const dy = next.y - curr.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const controlDist = dist * 0.3;
                  return { controlOut: { x: (dx / dist) * controlDist, y: (dy / dist) * controlDist } };
                }
                if (index === total - 1) {
                  if (!prev) return { controlIn: { x: 0, y: 0 } };
                  const dx = prev.x - curr.x;
                  const dy = prev.y - curr.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const controlDist = dist * 0.3;
                  return { controlIn: { x: (dx / dist) * controlDist, y: (dy / dist) * controlDist } };
                }
                
                // 中间点 - 计算平滑曲线
                if (!prev || !next) return { controlIn: { x: 0, y: 0 }, controlOut: { x: 0, y: 0 } };
                
                const dx = next.x - prev.x;
                const dy = next.y - prev.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const controlDist = dist * 0.25;
                
                return {
                  controlIn: { x: -(dx / dist) * controlDist, y: -(dy / dist) * controlDist },
                  controlOut: { x: (dx / dist) * controlDist, y: (dy / dist) * controlDist }
                };
              };
              
              // 生成 SVG 路径
              const generatePathD = () => {
                if (points.length < 2) return '';
                
                let d = `M ${points[0].x} ${points[0].y}`;
                
                for (let i = 1; i < points.length; i++) {
                  const prev = points[i - 1];
                  const curr = points[i];
                  
                  const prevAuto = getAutoControlPoints(
                    i > 1 ? points[i - 2] : null,
                    curr,
                    prev,
                    i - 1,
                    points.length
                  );
                  const currAuto = getAutoControlPoints(
                    prev,
                    i < points.length - 1 ? points[i + 1] : null,
                    curr,
                    i,
                    points.length
                  );
                  
                  const prevControlOut = prev.controlOut || prevAuto.controlOut || { x: 0, y: 0 };
                  const currControlIn = curr.controlIn || currAuto.controlIn || { x: 0, y: 0 };
                  
                  // 使用三次贝塞尔曲线
                  const cp1x = prev.x + prevControlOut.x;
                  const cp1y = prev.y + prevControlOut.y;
                  const cp2x = curr.x + currControlIn.x;
                  const cp2y = curr.y + currControlIn.y;
                  
                  d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
                }
                
                return d;
              };
              
              // 更新路径点
              const updatePathPoint = (pointIndex: number, updates: Partial<PathPoint>) => {
                if (!pathElement || !elementPath) return;
                const newPoints = [...points];
                newPoints[pointIndex] = { ...newPoints[pointIndex], ...updates };
                updateElement({ 
                  path: { ...elementPath, points: newPoints } 
                });
              };
              
              return (
                <svg 
                  className="absolute inset-0 pointer-events-none"
                  style={{ 
                    width: currentScene?.canvasWidth || 1920, 
                    height: currentScene?.canvasHeight || 1080,
                    overflow: 'visible'
                  }}
                >
                  {/* 路径曲线 */}
                  {points.length >= 2 && (
                    <path 
                      d={generatePathD()} 
                      fill="none" 
                      stroke="rgba(139, 92, 246, 0.9)" 
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  
                  {/* 连接线（直线预览） */}
                  {points.length >= 2 && (
                    <path 
                      d={`M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                      fill="none" 
                      stroke="rgba(139, 92, 246, 0.3)" 
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                  )}
                  
                  {/* 路径点 */}
                  {points.map((point, pointIndex) => {
                    const autoControls = getAutoControlPoints(
                      pointIndex > 0 ? points[pointIndex - 1] : null,
                      pointIndex < points.length - 1 ? points[pointIndex + 1] : null,
                      point,
                      pointIndex,
                      points.length
                    );
                    
                    const controlIn = point.controlIn || autoControls.controlIn;
                    const controlOut = point.controlOut || autoControls.controlOut;
                    
                    return (
                      <g key={point.id}>
                        {/* 控制点连接线 */}
                        {controlIn && (
                          <line 
                            x1={point.x} 
                            y1={point.y} 
                            x2={point.x + controlIn.x} 
                            y2={point.y + controlIn.y}
                            stroke="rgba(236, 72, 153, 0.6)"
                            strokeWidth="1.5"
                          />
                        )}
                        {controlOut && (
                          <line 
                            x1={point.x} 
                            y1={point.y} 
                            x2={point.x + controlOut.x} 
                            y2={point.y + controlOut.y}
                            stroke="rgba(34, 197, 94, 0.6)"
                            strokeWidth="1.5"
                          />
                        )}
                        
                        {/* 入方向控制点 */}
                        {controlIn && pathEditMode && (
                          <circle
                            cx={point.x + controlIn.x}
                            cy={point.y + controlIn.y}
                            r="7"
                            fill="rgba(236, 72, 153, 0.9)"
                            stroke="white"
                            strokeWidth="2"
                            className="pointer-events-auto cursor-move"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startControl = controlIn;
                              
                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const deltaY = moveEvent.clientY - startY;
                                updatePathPoint(pointIndex, { 
                                  controlIn: { x: startControl.x + deltaX, y: startControl.y + deltaY } 
                                });
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };
                              
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                        )}
                        
                        {/* 出方向控制点 */}
                        {controlOut && pathEditMode && (
                          <circle
                            cx={point.x + controlOut.x}
                            cy={point.y + controlOut.y}
                            r="7"
                            fill="rgba(34, 197, 94, 0.9)"
                            stroke="white"
                            strokeWidth="2"
                            className="pointer-events-auto cursor-move"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startControl = controlOut;
                              
                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const deltaY = moveEvent.clientY - startY;
                                updatePathPoint(pointIndex, { 
                                  controlOut: { x: startControl.x + deltaX, y: startControl.y + deltaY } 
                                });
                              };
                              
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };
                              
                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                        )}
                        
                        {/* 主路径点 */}
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="12"
                          fill={pointIndex === 0 ? "rgba(34, 197, 94, 0.9)" : pointIndex === points.length - 1 ? "rgba(239, 68, 68, 0.9)" : "rgba(139, 92, 246, 0.9)"}
                          stroke="white"
                          strokeWidth="2"
                          className="pointer-events-auto cursor-move"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startPoint = { x: point.x, y: point.y };
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const deltaY = moveEvent.clientY - startY;
                              updatePathPoint(pointIndex, { 
                                x: startPoint.x + deltaX, 
                                y: startPoint.y + deltaY 
                              });
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        />
                        
                        {/* 点序号 */}
                        <text
                          x={point.x}
                          y={point.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="white"
                          fontSize="10"
                          fontWeight="bold"
                          className="pointer-events-none select-none"
                        >
                          {pointIndex + 1}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* 绘制模式提示 */}
                  {pathDrawMode && (
                    <g>
                      <rect
                        x="10"
                        y="10"
                        width="280"
                        height="60"
                        fill="rgba(0, 0, 0, 0.8)"
                        rx="8"
                      />
                      <text x="20" y="30" fill="white" fontSize="12" fontWeight="bold">
                        🖊️ 路径绘制模式
                      </text>
                      <text x="20" y="50" fill="rgba(255,255,255,0.7)" fontSize="11">
                        点击画布添加路径点，按 ESC 或点击按钮退出
                      </text>
                    </g>
                  )}
                </svg>
              );
            })()}
            
            {/* 选中元素的路径预览（非编辑模式） */}
            {!pathDrawMode && !pathEditMode && selectedElement?.path && selectedElement.path.points.length >= 2 && (
              <svg 
                className="absolute inset-0 pointer-events-none"
                style={{ 
                  width: currentScene?.canvasWidth || 1920, 
                  height: currentScene?.canvasHeight || 1080,
                  overflow: 'visible'
                }}
              >
                {(() => {
                  const points = selectedElement.path.points;
                  
                  // 自动计算平滑控制点
                  const calculateAutoControls = (pts: PathPoint[]): { out: { x: number; y: number } | null; in: { x: number; y: number } | null }[] => {
                    return pts.map((p, i) => {
                      if (p.controlOut || p.controlIn) {
                        return { out: p.controlOut || null, in: p.controlIn || null };
                      }
                      
                      const prev = pts[i - 1];
                      const next = pts[i + 1];
                      
                      if (i === 0) {
                        if (next) {
                          const dx = next.x - p.x;
                          const dy = next.y - p.y;
                          const dist = Math.sqrt(dx * dx + dy * dy);
                          return { out: { x: (dx / dist) * (dist / 3), y: (dy / dist) * (dist / 3) }, in: null };
                        }
                      } else if (i === pts.length - 1) {
                        if (prev) {
                          const dx = p.x - prev.x;
                          const dy = p.y - prev.y;
                          const dist = Math.sqrt(dx * dx + dy * dy);
                          return { in: { x: -(dx / dist) * (dist / 3), y: -(dy / dist) * (dist / 3) }, out: null };
                        }
                      } else if (prev && next) {
                        const dxPrev = p.x - prev.x;
                        const dyPrev = p.y - prev.y;
                        const dxNext = next.x - p.x;
                        const dyNext = next.y - p.y;
                        const distPrev = Math.sqrt(dxPrev * dxPrev + dyPrev * dyPrev);
                        const distNext = Math.sqrt(dxNext * dxNext + dyNext * dyNext);
                        
                        const smoothX = (dxPrev / distPrev + dxNext / distNext) / 2;
                        const smoothY = (dyPrev / distPrev + dyNext / distNext) / 2;
                        const smoothLen = Math.sqrt(smoothX * smoothX + smoothY * smoothY);
                        
                        return {
                          in: { x: smoothLen > 0 ? -(smoothX / smoothLen) * (distPrev / 3) : -(distPrev / 3), y: smoothLen > 0 ? -(smoothY / smoothLen) * (distPrev / 3) : 0 },
                          out: { x: smoothLen > 0 ? (smoothX / smoothLen) * (distNext / 3) : (distNext / 3), y: smoothLen > 0 ? (smoothY / smoothLen) * (distNext / 3) : 0 }
                        };
                      }
                      return { out: null, in: null };
                    });
                  };
                  
                  const autoControls = calculateAutoControls(points);
                  
                  let d = `M ${points[0].x} ${points[0].y}`;
                  
                  for (let i = 1; i < points.length; i++) {
                    const prev = points[i - 1];
                    const curr = points[i];
                    
                    const ctrlOut = prev.controlOut || autoControls[i - 1]?.out;
                    const ctrlIn = curr.controlIn || autoControls[i]?.in;
                    
                    if (ctrlOut && ctrlIn) {
                      const cp1x = prev.x + ctrlOut.x;
                      const cp1y = prev.y + ctrlOut.y;
                      const cp2x = curr.x + ctrlIn.x;
                      const cp2y = curr.y + ctrlIn.y;
                      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
                    } else if (ctrlOut) {
                      const cpx = prev.x + ctrlOut.x;
                      const cpy = prev.y + ctrlOut.y;
                      d += ` Q ${cpx} ${cpy}, ${curr.x} ${curr.y}`;
                    } else if (ctrlIn) {
                      const cpx = curr.x + ctrlIn.x;
                      const cpy = curr.y + ctrlIn.y;
                      d += ` Q ${cpx} ${cpy}, ${curr.x} ${curr.y}`;
                    } else {
                      d += ` L ${curr.x} ${curr.y}`;
                    }
                  }
                  
                  return (
                    <g>
                      <path 
                        d={d} 
                        fill="none" 
                        stroke="rgba(139, 92, 246, 0.5)" 
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                      {points.map((point, idx) => (
                        <circle
                          key={point.id}
                          cx={point.x}
                          cy={point.y}
                          r="5"
                          fill={idx === 0 ? "rgba(34, 197, 94, 0.7)" : idx === points.length - 1 ? "rgba(239, 68, 68, 0.7)" : "rgba(139, 92, 246, 0.7)"}
                          stroke="white"
                          strokeWidth="1"
                        />
                      ))}
                    </g>
                  );
                })()}
              </svg>
            )}
            
            </>
            )}
            </div>
            
            {/* 画布信息 */}
            <div className="absolute bottom-3 left-3 text-xs text-zinc-400 flex gap-3" suppressHydrationWarning>
              <span suppressHydrationWarning>{currentScene?.canvasWidth || 1920} × {currentScene?.canvasHeight || 1080}</span>
              <span>|</span>
              <span>{currentScene?.name}</span>
              {currentScene?.panoramaImage && <span>| 全景图</span>}
              {currentScene?.panoramaVideo && <span>| 全景视频</span>}
            </div>
            </div>
          </div>
          
          {/* 右键菜单 */}
          {contextMenu.visible && (
            <div
              className="fixed z-50 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl py-1 min-w-[160px]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const element = currentScene?.elements.find(e => e.id === contextMenu.elementId);
                if (!element) return null;
                
                return (
                  <>
                    {element.isMaximized ? (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 flex items-center gap-2"
                        onClick={() => contextMenu.elementId && restoreElement(contextMenu.elementId)}
                      >
                        <Minimize2 className="w-4 h-4" />
                        还原布局
                      </button>
                    ) : (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 flex items-center gap-2"
                        onClick={() => contextMenu.elementId && maximizeElement(contextMenu.elementId)}
                      >
                        <Maximize2 className="w-4 h-4" />
                        最大视图
                      </button>
                    )}
                    <div className="h-px bg-zinc-600 my-1" />
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 flex items-center gap-2"
                      onClick={() => {
                        if (contextMenu.elementId) {
                          setSelectedId(contextMenu.elementId);
                          closeContextMenu();
                        }
                      }}
                    >
                      <MousePointer2 className="w-4 h-4" />
                      选择元素
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 flex items-center gap-2"
                      onClick={() => {
                        if (contextMenu.elementId) {
                          setSelectedId(contextMenu.elementId);
                          copyElement();
                          closeContextMenu();
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                      复制元素
                    </button>
                    <div className="h-px bg-zinc-600 my-1" />
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                      onClick={() => {
                        if (contextMenu.elementId) {
                          setSelectedId(contextMenu.elementId);
                          deleteElement();
                          closeContextMenu();
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      删除元素
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {/* 参考线 - 覆盖在整个画布区域之上 */}
          {/* 注意：参考线位置需要考虑标尺偏移 (水平标尺 20px, 垂直标尺 24px) */}
          {guideLines.map(guide => (
            <div
              key={guide.id}
              className={`absolute z-30 cursor-${guide.type === 'horizontal' ? 'ns-resize' : 'ew-resize'} group`}
              style={guide.type === 'horizontal' 
                ? {
                    // 水平参考线：从左侧开始，横跨整个宽度
                    left: 0,
                    right: 0,
                    // top = 水平标尺高度(20px) + 画布内的Y位置
                    top: 20 + guide.position * zoom + offset.y,
                    height: 2,
                    background: 'linear-gradient(90deg, #f43f5e 0%, #ec4899 50%, #f43f5e 100%)',
                    boxShadow: '0 0 4px rgba(244, 63, 94, 0.5)',
                  }
                : {
                    // 垂直参考线：从顶部开始，横跨整个高度
                    top: 0,
                    bottom: 0,
                    // left = 垂直标尺宽度(24px) + 画布内的X位置
                    left: 24 + guide.position * zoom + offset.x,
                    width: 2,
                    background: 'linear-gradient(180deg, #f43f5e 0%, #ec4899 50%, #f43f5e 100%)',
                    boxShadow: '0 0 4px rgba(244, 63, 94, 0.5)',
                  }
              }
              onMouseDown={(e) => handleGuideLineMouseDown(e, guide.id, guide.type)}
            >
              {/* 位置标签 */}
              <div 
                className={`absolute px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10`}
                style={guide.type === 'horizontal'
                  ? { left: 4, top: -20 }
                  : { left: 4, top: 4 }
                }
              >
                {Math.round(guide.position)}
              </div>
              {/* 删除按钮 */}
              <button
                className={`absolute w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 z-10`}
                style={guide.type === 'horizontal'
                  ? { right: 10, top: -10 }
                  : { left: -10, top: 10 }
                }
                onClick={(e) => {
                  e.stopPropagation();
                  deleteGuideLine(guide.id);
                }}
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </main>

        {/* 点击其他地方关闭右键菜单 */}
        {contextMenu.visible && (
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
            onContextMenu={closeContextMenu}
          />
        )}

        {/* 右侧属性面板 - 参考截图设计 */}
        <aside 
          className="bg-zinc-800 border-l border-zinc-600 flex flex-col shrink-0 relative"
          style={{ width: rightPanelWidth }}
        >
          {/* 右侧面板拖拽调整宽度的分隔条 */}
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-purple-500/50 transition-colors z-10"
            style={{ transform: 'translateX(-50%)' }}
            onMouseDown={(e) => handlePanelResizeStart(e, 'right')}
          />
          
          {displayElement ? (
            <>
              {/* 标题栏 */}
              <div className="p-3 border-b border-zinc-700 flex items-center justify-between bg-zinc-800">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${templateElementType && !selectedElement ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {elementIcons[displayElement.type]}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">
                      {elementNames[displayElement.type]}控件
                      {templateElementType && !selectedElement && <span className="text-blue-400 text-xs ml-1">(预览)</span>}
                    </h3>
                    {selectedElement ? (
                      <Input
                        value={displayElement.name}
                        onChange={(e) => updateElement({ name: e.target.value })}
                        className="h-5 w-32 bg-transparent border-none text-xs text-zinc-300 p-0"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">拖拽到画布添加</span>
                    )}
                  </div>
                </div>
                {selectedElement && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={copyElement} className="w-7 h-7 text-zinc-300">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={deleteElement} className="w-7 h-7 text-zinc-300 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* 快捷操作 - 点击音效（仅按钮和面板） */}
              {selectedElement && (displayElement.type === 'button' || displayElement.type === 'panel') && (
                <div className="mx-3 mt-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <Label className="text-xs text-white flex items-center gap-2 mb-2">
                    <Volume2 className="w-3.5 h-3.5" />
                    点击音效
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={displayElement.clickAudio || ''}
                      onChange={(e) => updateElement({ clickAudio: e.target.value })}
                      placeholder="输入音效URL"
                      className="h-7 bg-white border-zinc-300 text-xs text-zinc-900 placeholder:text-zinc-500 flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'audio/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            updateElement({ clickAudio: url });
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                    {displayElement.clickAudio && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 border-zinc-300 bg-white text-blue-600 hover:bg-zinc-100"
                          onClick={() => {
                            // 停止之前的预览
                            if (audioPreviewRef.current) {
                              audioPreviewRef.current.pause();
                              audioPreviewRef.current.currentTime = 0;
                            }
                            // 播放新的预览
                            const audio = new Audio(displayElement.clickAudio);
                            audioPreviewRef.current = audio;
                            audio.play().catch(() => {});
                            audio.onended = () => {
                              if (audioPreviewRef.current === audio) {
                                audioPreviewRef.current = null;
                              }
                            };
                          }}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 border-zinc-300 bg-white text-red-600 hover:bg-zinc-100"
                          onClick={() => {
                            // 停止正在播放的音效
                            if (audioPreviewRef.current) {
                              audioPreviewRef.current.pause();
                              audioPreviewRef.current.currentTime = 0;
                              audioPreviewRef.current = null;
                            }
                            updateElement({ clickAudio: '' });
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 双栏布局 */}
              <div className="flex-1 flex overflow-hidden">
                {/* 左侧导航 */}
                <div className="w-28 bg-zinc-800/50 border-r border-zinc-700 shrink-0">
                  <ScrollArea className="h-full">
                    <div className="py-2">
                      {getPropertyTabs().map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPropertyTab(tab.id)}
                          className={`w-full px-3 py-2.5 flex items-center gap-2 text-left transition-colors ${
                            propertyTab === tab.id
                              ? 'bg-zinc-700/50 text-white'
                              : 'text-white hover:text-zinc-200'
                          }`}
                        >
                          {tab.icon}
                          <span className="text-xs">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* 右侧配置区 */}
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* === 源文件/内容 === */}
                    {propertyTab === 'source' && (
                      <>
                        {/* 图片/视频源文件 */}
                        {['image', 'video'].includes(displayElement.type) && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs text-white flex items-center gap-2">
                                <Settings className="w-3.5 h-3.5" />
                                本地文件
                              </Label>
                              <button
                                onClick={() => {
                                  if (!selectedElement) return;
                                  setMediaType(displayElement.type as any);
                                  setShowMediaDialog(true);
                                }}
                                disabled={!selectedElement}
                                className={`w-full h-9 px-3 rounded border text-sm text-left flex items-center gap-2 transition-colors ${
                                  selectedElement 
                                    ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' 
                                    : 'bg-zinc-700/50 border-zinc-700 text-zinc-500 cursor-not-allowed'
                                }`}
                              >
                                <FolderOpen className="w-4 h-4" />
                                {displayElement.src ? '更换文件...' : '[无文件]...'}
                              </button>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white flex items-center gap-2">
                                <Link2 className="w-3.5 h-3.5" />
                                网络地址
                              </Label>
                              <div className="flex gap-1">
                                <Input
                                  value={displayElement.src || ''}
                                  onChange={(e) => updateElement({ src: e.target.value })}
                                  placeholder="输入URL..."
                                  className="h-9 bg-zinc-700 border-zinc-600 text-sm flex-1"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="w-9 h-9 border-zinc-600"
                                  onClick={() => {
                                    setMediaType(displayElement.type as any);
                                    setShowMediaDialog(true);
                                  }}
                                >
                                  <FolderOpen className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="w-9 h-9 border-zinc-600"
                                  onClick={() => updateElement({ src: '' })}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* 图片适配模式 */}
                            {displayElement.type === 'image' && (
                              <div className="space-y-2">
                                <Label className="text-xs text-white">适配模式</Label>
                                <Select
                                  value={displayElement.objectFit || 'cover'}
                                  onValueChange={(v) => updateElement({ objectFit: v as any })}
                                >
                                  <SelectTrigger className="h-9 bg-zinc-700 border-zinc-600 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                    <SelectItem value="cover">填充覆盖</SelectItem>
                                    <SelectItem value="contain">完整显示</SelectItem>
                                    <SelectItem value="fill">拉伸填充</SelectItem>
                                    <SelectItem value="none">原始大小</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {/* 视频适配模式 */}
                            {displayElement.type === 'video' && (
                              <div className="space-y-2">
                                <Label className="text-xs text-white">适配模式</Label>
                                <Select
                                  value={displayElement.objectFit || 'cover'}
                                  onValueChange={(v) => updateElement({ objectFit: v as any })}
                                >
                                  <SelectTrigger className="h-9 bg-zinc-700 border-zinc-600 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                    <SelectItem value="cover">填充覆盖</SelectItem>
                                    <SelectItem value="contain">完整显示</SelectItem>
                                    <SelectItem value="fill">拉伸填充</SelectItem>
                                    <SelectItem value="none">原始大小</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {/* 视频控制 - 仅在实际选中元素时显示 */}
                            {displayElement.type === 'video' && displayElement.src && selectedElement && (
                              <>
                                <Separator className="bg-zinc-700" />
                                
                                {/* 播放控制按钮 */}
                                <div className="space-y-2">
                                  <Label className="text-xs text-white">播放控制</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 border-zinc-600"
                                      onClick={() => {
                                        const video = videoRefs.current.get(selectedElement.id);
                                        if (video) {
                                          if (video.paused) {
                                            video.play();
                                            setPlayingVideos(prev => new Set(prev).add(selectedElement.id));
                                          } else {
                                            video.pause();
                                            setPlayingVideos(prev => {
                                              const next = new Set(prev);
                                              next.delete(selectedElement.id);
                                              return next;
                                            });
                                          }
                                        }
                                      }}
                                    >
                                      {playingVideos.has(selectedElement.id) ? (
                                        <>
                                          <Square className="w-4 h-4 mr-1" />
                                          暂停
                                        </>
                                      ) : (
                                        <>
                                          <Play className="w-4 h-4 mr-1" />
                                          播放
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 border-zinc-600"
                                      onClick={() => {
                                        const video = videoRefs.current.get(selectedElement.id);
                                        if (video) {
                                          video.currentTime = 0;
                                        }
                                      }}
                                    >
                                      <RotateCcw className="w-4 h-4 mr-1" />
                                      重置
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* 视频设置 */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs text-white">自动播放</Label>
                                    <Switch
                                      checked={displayElement.autoplay || false}
                                      onCheckedChange={(v) => updateElement({ autoplay: v })}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs text-white">循环播放</Label>
                                    <Switch
                                      checked={displayElement.loop !== false}
                                      onCheckedChange={(v) => updateElement({ loop: v })}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs text-white">静音</Label>
                                    <Switch
                                      checked={displayElement.muted !== false}
                                      onCheckedChange={(v) => {
                                        updateElement({ muted: v });
                                        const video = videoRefs.current.get(selectedElement.id);
                                        if (video) {
                                          video.muted = v;
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs text-white">显示控制条</Label>
                                    <Switch
                                      checked={displayElement.controls || false}
                                      onCheckedChange={(v) => {
                                        updateElement({ controls: v });
                                        const video = videoRefs.current.get(selectedElement.id);
                                        if (video) {
                                          video.controls = v;
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {/* 音频源文件 */}
                        {displayElement.type === 'audio' && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs text-white flex items-center gap-2">
                                <Music className="w-3.5 h-3.5" />
                                音频文件
                              </Label>
                              <button
                                onClick={() => {
                                  if (!selectedElement) return;
                                  setMediaType('audio');
                                  setShowMediaDialog(true);
                                }}
                                disabled={!selectedElement}
                                className={`w-full h-9 px-3 rounded border text-sm text-left flex items-center gap-2 transition-colors ${
                                  selectedElement 
                                    ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500' 
                                    : 'bg-zinc-700/50 border-zinc-700 text-zinc-500 cursor-not-allowed'
                                }`}
                              >
                                <FolderOpen className="w-4 h-4" />
                                {displayElement.src ? '更换音频...' : '[选择音频文件]...'}
                              </button>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white flex items-center gap-2">
                                <Link2 className="w-3.5 h-3.5" />
                                网络地址
                              </Label>
                              <div className="flex gap-1">
                                <Input
                                  value={displayElement.src || ''}
                                  onChange={(e) => updateElement({ src: e.target.value })}
                                  placeholder="输入音频URL..."
                                  className="h-9 bg-zinc-700 border-zinc-600 text-sm flex-1"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="w-9 h-9 border-zinc-600"
                                  onClick={() => updateElement({ src: '' })}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* 音频预览 */}
                            {displayElement.src && selectedElement && (
                              <div className="space-y-2">
                                <Label className="text-xs text-white">音频预览</Label>
                                <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-600">
                                  <audio
                                    src={displayElement.src}
                                    controls
                                    className="w-full h-8"
                                    onError={() => {
                                      console.error('音频加载失败');
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* 音频设置 */}
                            <Separator className="bg-zinc-700" />
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-white">自动播放</Label>
                                <Switch
                                  checked={displayElement.autoplay ?? false}
                                  onCheckedChange={(v) => updateElement({ autoplay: v })}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-white">循环播放</Label>
                                <Switch
                                  checked={displayElement.loop ?? false}
                                  onCheckedChange={(v) => updateElement({ loop: v })}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* 标签内容 */}
                        {displayElement.type === 'label' && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs text-white">标签类型</Label>
                              <Select
                                value={displayElement.labelSubType || 'icon'}
                                onValueChange={(v) => updateElement({ labelSubType: v as LabelSubType })}
                              >
                                <SelectTrigger className="h-9 bg-zinc-700 border-zinc-600 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                  <SelectItem value="icon">图标标签</SelectItem>
                                  <SelectItem value="hotspot">热点标签</SelectItem>
                                  <SelectItem value="text">文字标签</SelectItem>
                                  <SelectItem value="text2d">2D文字</SelectItem>
                                  <SelectItem value="ui">UI标签</SelectItem>
                                  <SelectItem value="number">数字标注</SelectItem>
                                  <SelectItem value="summary">概注</SelectItem>
                                  <SelectItem value="bubble">气泡注记</SelectItem>
                                  <SelectItem value="dialog">对话框注记</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white">标签文字</Label>
                              <Input
                                value={displayElement.content}
                                onChange={(e) => updateElement({ content: e.target.value })}
                                className="bg-zinc-700 border-zinc-600 text-sm"
                                placeholder="输入标签文字..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white">快速样式</Label>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { name: '紫', color: '#8B5CF6' },
                                  { name: '粉', color: '#EC4899' },
                                  { name: '蓝', color: '#3B82F6' },
                                  { name: '绿', color: '#10B981' },
                                  { name: '橙', color: '#F59E0B' },
                                  { name: '红', color: '#EF4444' },
                                  { name: '青', color: '#14B8A6' },
                                  { name: '灰', color: '#6B7280' },
                                ].map((preset) => (
                                  <button
                                    key={preset.name}
                                    onClick={() => updateElement({ backgroundColor: preset.color })}
                                    className="h-8 rounded text-xs font-medium transition-transform hover:scale-105 text-white"
                                    style={{ backgroundColor: preset.color }}
                                  >
                                    {preset.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* 按钮内容 */}
                        {displayElement.type === 'button' && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs text-white">按钮文字</Label>
                              <Textarea
                                value={displayElement.content}
                                onChange={(e) => updateElement({ content: e.target.value })}
                                className="bg-zinc-700 border-zinc-600 text-sm min-h-[60px]"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white">快速样式</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {buttonPresets.map((preset) => (
                                  <button
                                    key={preset.name}
                                    onClick={() => applyButtonPreset(preset)}
                                    className="h-9 rounded text-xs font-medium transition-transform hover:scale-105"
                                    style={{
                                      backgroundColor: preset.style.backgroundColor,
                                      color: preset.style.color,
                                      borderRadius: preset.style.borderRadius,
                                      border: preset.style.borderWidth ? `${preset.style.borderWidth}px solid ${preset.style.borderColor}` : 'none',
                                      boxShadow: preset.style.boxShadow,
                                    }}
                                  >
                                    {preset.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white">图标</Label>
                              <Select
                                value={displayElement.iconName || '无'}
                                onValueChange={(v) => updateElement({ iconName: v === '无' ? '' : v })}
                              >
                                <SelectTrigger className="h-9 bg-zinc-700 border-zinc-600 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                  {buttonIcons.map((icon) => (
                                    <SelectItem key={icon.name} value={icon.name}>
                                      {icon.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white">图标位置</Label>
                              <Select
                                value={displayElement.iconPosition || 'left'}
                                onValueChange={(v) => updateElement({ iconPosition: v as 'left' | 'right' })}
                              >
                                <SelectTrigger className="h-9 bg-zinc-700 border-zinc-600 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                  <SelectItem value="left">左侧</SelectItem>
                                  <SelectItem value="right">右侧</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        {/* 文本内容 */}
                        {displayElement.type === 'text' && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs text-white">文本内容</Label>
                              <Textarea
                                value={displayElement.content}
                                onChange={(e) => updateElement({ content: e.target.value })}
                                className="bg-zinc-700 border-zinc-600 text-sm min-h-[100px]"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white">文本对齐</Label>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => updateElement({ textAlign: 'left' })}
                                  className={`flex-1 p-2 rounded transition-colors ${
                                    displayElement.textAlign === 'left' ? 'bg-blue-500/30 text-blue-400' : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'
                                  }`}
                                >
                                  <AlignLeft className="w-4 h-4 mx-auto" />
                                </button>
                                <button
                                  onClick={() => updateElement({ textAlign: 'center' })}
                                  className={`flex-1 p-2 rounded transition-colors ${
                                    displayElement.textAlign === 'center' ? 'bg-blue-500/30 text-blue-400' : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'
                                  }`}
                                >
                                  <AlignCenter className="w-4 h-4 mx-auto" />
                                </button>
                                <button
                                  onClick={() => updateElement({ textAlign: 'right' })}
                                  className={`flex-1 p-2 rounded transition-colors ${
                                    displayElement.textAlign === 'right' ? 'bg-blue-500/30 text-blue-400' : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700'
                                  }`}
                                >
                                  <AlignRight className="w-4 h-4 mx-auto" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {/* 选择项属性 */}
                        {displayElement.type === 'choiceItem' && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs text-white flex items-center gap-2">
                                <Type className="w-3.5 h-3.5" />
                                选项文字
                              </Label>
                              <Input
                                value={displayElement.content || ''}
                                onChange={(e) => updateElement({ content: e.target.value })}
                                className="h-9 bg-zinc-700 border-zinc-600 text-sm"
                                placeholder="输入选项文字..."
                              />
                            </div>

                            <Separator className="bg-zinc-700" />

                            {/* 选中状态 - 事件配置 */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-white flex items-center gap-2">
                                  <ToggleRight className="w-3.5 h-3.5" />
                                  选中状态
                                </Label>
                                <Switch
                                  checked={displayElement.isSelected || false}
                                  onCheckedChange={(checked) => updateElement({ isSelected: checked })}
                                />
                              </div>
                              <p className="text-xs text-zinc-500">
                                开启后，预览时该选项默认显示为选中状态
                              </p>
                            </div>

                            <Separator className="bg-zinc-700" />

                            {/* 点击后执行的动作 */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-purple-400 flex items-center gap-2">
                                  <MousePointerClick className="w-3.5 h-3.5" />
                                  点击后执行
                                </Label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                                  onClick={() => setShowChoiceActionDialog({ elementId: displayElement.id })}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  配置动作
                                </Button>
                              </div>
                              {(displayElement.clickActions || []).length > 0 ? (
                                <div className="space-y-1">
                                  {(displayElement.clickActions || []).map((action, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-zinc-700/50 text-xs">
                                      <span className="text-zinc-300">
                                        {action.type === 'addHealth' && `加血 ${action.value || 0}`}
                                        {action.type === 'reduceHealth' && `减血 ${action.value || 0}`}
                                        {action.type === 'setHealth' && `设置血量 ${action.value || 0}`}
                                        {action.type === 'jumpScene' && `跳转场景`}
                                        {action.type === 'showElement' && '显示元素'}
                                        {action.type === 'hideElement' && '隐藏元素'}
                                        {action.type === 'playAudio' && '播放音频'}
                                        {action.type === 'playVideo' && '播放视频'}
                                        {action.type === 'delay' && `延迟 ${action.delay || 0}ms`}
                                        {action.type === 'setOpacity' && `设置透明度 ${Math.round((action.value || 1) * 100)}%`}
                                        {!['addHealth', 'reduceHealth', 'setHealth', 'jumpScene', 'showElement', 'hideElement', 'playAudio', 'playVideo', 'delay', 'setOpacity'].includes(action.type) && action.type}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                        onClick={() => {
                                          const newActions = (displayElement.clickActions || []).filter((_, i) => i !== idx);
                                          updateElement({ clickActions: newActions });
                                        }}
                                      >
                                        ×
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-zinc-500">暂无动作，点击"配置动作"添加</p>
                              )}
                            </div>
                          </>
                        )}

                        {/* 血条属性 */}
                        {displayElement.type === 'healthBar' && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs text-white flex items-center gap-2">
                                <Heart className="w-3.5 h-3.5" />
                                血量设置
                              </Label>
                              <p className="text-xs text-zinc-500">提示：当血量不满时，背景颜色会显示在血条损失部分</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-zinc-400 mb-1 block">当前血量</Label>
                                  <Input
                                    type="number"
                                    value={displayElement.healthValue ?? 100}
                                    onChange={(e) => updateElement({ healthValue: parseInt(e.target.value) || 0 })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm"
                                    min={0}
                                    max={displayElement.maxHealth ?? 100}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-zinc-400 mb-1 block">最大血量</Label>
                                  <Input
                                    type="number"
                                    value={displayElement.maxHealth ?? 100}
                                    onChange={(e) => updateElement({ maxHealth: parseInt(e.target.value) || 100 })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm"
                                    min={1}
                                  />
                                </div>
                              </div>
                            </div>

                            <Separator className="bg-zinc-700" />

                            <div className="space-y-2">
                              <Label className="text-xs text-white">低血量警告</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-zinc-400 mb-1 block">阈值(%)</Label>
                                  <Input
                                    type="number"
                                    value={displayElement.lowHealthThreshold ?? 30}
                                    onChange={(e) => updateElement({ lowHealthThreshold: parseInt(e.target.value) || 30 })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm"
                                    min={0}
                                    max={100}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-zinc-400 mb-1 block">警告颜色</Label>
                                  <Input
                                    type="color"
                                    value={displayElement.lowHealthColor || '#EF4444'}
                                    onChange={(e) => updateElement({ lowHealthColor: e.target.value })}
                                    className="w-full h-8 p-1 bg-zinc-700 border-zinc-600"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-white">显示血量文字</Label>
                              <Switch
                                checked={displayElement.showHealthText !== false}
                                onCheckedChange={(v) => updateElement({ showHealthText: v })}
                              />
                            </div>

                            <Separator className="bg-zinc-700" />

                            {/* 血量阈值触发器 */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-white flex items-center gap-2">
                                  <Zap className="w-3.5 h-3.5" />
                                  血量触发器
                                </Label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                                  onClick={() => {
                                    const triggers = displayElement.healthTriggers || [];
                                    const newTrigger: HealthTrigger = {
                                      id: `trigger-${Date.now()}`,
                                      threshold: 50,
                                      triggerType: 'below',
                                      actions: [],
                                    };
                                    updateElement({ healthTriggers: [...triggers, newTrigger] });
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  添加触发器
                                </Button>
                              </div>
                              <p className="text-xs text-zinc-500">
                                当血量达到指定阈值时自动触发事件
                              </p>
                              
                              {(displayElement.healthTriggers || []).map((trigger, idx) => (
                                <div key={trigger.id} className="p-3 rounded-lg bg-zinc-700/50 border border-zinc-600 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-white font-medium">触发器 {idx + 1}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-red-400 hover:text-red-300"
                                      onClick={() => {
                                        const triggers = displayElement.healthTriggers || [];
                                        updateElement({ healthTriggers: triggers.filter(t => t.id !== trigger.id) });
                                      }}
                                    >
                                      删除
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs text-zinc-400 mb-1 block">触发条件</Label>
                                      <Select
                                        value={trigger.triggerType}
                                        onValueChange={(v) => {
                                          const triggers = displayElement.healthTriggers || [];
                                          updateElement({
                                            healthTriggers: triggers.map(t => 
                                              t.id === trigger.id ? { ...t, triggerType: v as 'below' | 'above' | 'equals' } : t
                                            )
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-700 border-zinc-600">
                                          <SelectItem value="below">低于</SelectItem>
                                          <SelectItem value="above">高于</SelectItem>
                                          <SelectItem value="equals">等于</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-zinc-400 mb-1 block">阈值(%)</Label>
                                      <Input
                                        type="number"
                                        value={trigger.threshold}
                                        onChange={(e) => {
                                          const triggers = displayElement.healthTriggers || [];
                                          updateElement({
                                            healthTriggers: triggers.map(t => 
                                              t.id === trigger.id ? { ...t, threshold: parseInt(e.target.value) || 0 } : t
                                            )
                                          });
                                        }}
                                        className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white"
                                        min={0}
                                        max={100}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs text-zinc-400">触发动作</Label>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                                        onClick={() => {
                                          const triggers = displayElement.healthTriggers || [];
                                          const currentActions = triggers.find(t => t.id === trigger.id)?.actions || [];
                                          const newAction: EventAction = {
                                            id: `action-${Date.now()}`,
                                            type: 'jumpScene',
                                            targetSceneId: '',
                                          };
                                          updateElement({
                                            healthTriggers: triggers.map(t => 
                                              t.id === trigger.id ? { ...t, actions: [...currentActions, newAction] } : t
                                            )
                                          });
                                        }}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        添加动作
                                      </Button>
                                    </div>
                                    {trigger.actions.map((action, actionIdx) => (
                                      <div key={action.id} className="flex items-center gap-2 p-2 rounded bg-zinc-600/50">
                                        <Select
                                          value={action.type}
                                          onValueChange={(v) => {
                                            const triggers = displayElement.healthTriggers || [];
                                            updateElement({
                                              healthTriggers: triggers.map(t => 
                                                t.id === trigger.id ? {
                                                  ...t,
                                                  actions: t.actions.map(a => 
                                                    a.id === action.id ? { ...a, type: v as any } : a
                                                  )
                                                } : t
                                              )
                                            });
                                          }}
                                        >
                                          <SelectTrigger className="h-7 bg-zinc-500 border-zinc-400 text-xs text-white w-28">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-zinc-700 border-zinc-600">
                                            <SelectItem value="jumpScene">跳转场景</SelectItem>
                                            <SelectItem value="showElement">显示元素</SelectItem>
                                            <SelectItem value="hideElement">隐藏元素</SelectItem>
                                            <SelectItem value="toggleElement">切换显示</SelectItem>
                                            <SelectItem value="playAudio">播放音频</SelectItem>
                                            <SelectItem value="pauseAudio">暂停音频</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        {action.type === 'jumpScene' && (
                                          <Select
                                            value={action.targetSceneId || ''}
                                            onValueChange={(v) => {
                                              const triggers = displayElement.healthTriggers || [];
                                              updateElement({
                                                healthTriggers: triggers.map(t => 
                                                  t.id === trigger.id ? {
                                                    ...t,
                                                    actions: t.actions.map(a => 
                                                      a.id === action.id ? { ...a, targetSceneId: v } : a
                                                    )
                                                  } : t
                                                )
                                              });
                                            }}
                                          >
                                            <SelectTrigger className="h-7 bg-zinc-500 border-zinc-400 text-xs text-white flex-1">
                                              <SelectValue placeholder="选择场景" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-700 border-zinc-600">
                                              {scenes.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        )}
                                        {action.type === 'playAudio' && (
                                          <Input
                                            value={action.audioUrl || ''}
                                            onChange={(e) => {
                                              const triggers = displayElement.healthTriggers || [];
                                              updateElement({
                                                healthTriggers: triggers.map(t => 
                                                  t.id === trigger.id ? {
                                                    ...t,
                                                    actions: t.actions.map(a => 
                                                      a.id === action.id ? { ...a, audioUrl: e.target.value } : a
                                                    )
                                                  } : t
                                                )
                                              });
                                            }}
                                            placeholder="音频URL"
                                            className="h-7 bg-zinc-500 border-zinc-400 text-xs text-white flex-1"
                                          />
                                        )}
                                        {(action.type === 'showElement' || action.type === 'hideElement' || action.type === 'toggleElement') && (
                                          <Select
                                            value={action.targetElementId || ''}
                                            onValueChange={(v) => {
                                              const triggers = displayElement.healthTriggers || [];
                                              updateElement({
                                                healthTriggers: triggers.map(t => 
                                                  t.id === trigger.id ? {
                                                    ...t,
                                                    actions: t.actions.map(a => 
                                                      a.id === action.id ? { ...a, targetElementId: v } : a
                                                    )
                                                  } : t
                                                )
                                              });
                                            }}
                                          >
                                            <SelectTrigger className="h-7 bg-zinc-500 border-zinc-400 text-xs text-white flex-1">
                                              <SelectValue placeholder="选择元素" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-700 border-zinc-600">
                                              {currentScene?.elements.filter(e => e.id !== displayElement.id).map(e => (
                                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 text-red-400 hover:text-red-300"
                                          onClick={() => {
                                            const triggers = displayElement.healthTriggers || [];
                                            updateElement({
                                              healthTriggers: triggers.map(t => 
                                                t.id === trigger.id ? {
                                                  ...t,
                                                  actions: t.actions.filter(a => a.id !== action.id)
                                                } : t
                                              )
                                            });
                                          }}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* === 样式 === */}
                    {propertyTab === 'style' && (
                      <>
                        {/* 音频只需要位置设置 */}
                        {displayElement.type === 'audio' ? (
                          <div className="space-y-2">
                            <Label className="text-xs text-white flex items-center gap-2">
                              <Music className="w-3.5 h-3.5" />
                              音频控件
                            </Label>
                            <p className="text-xs text-zinc-400">
                              音频元素在预览时不可见，无需样式设置。请在"行为"标签页配置播放选项。
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* 位置尺寸 */}
                            <div className="space-y-2">
                              <Label className="text-xs text-white flex items-center gap-2">
                                <Move className="w-3.5 h-3.5" />
                                位置与尺寸
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-xs text-zinc-400">X</span>
                                  <Input
                                    type="number"
                                    value={Math.round(displayElement.x)}
                                    onChange={(e) => updateElement({ x: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs text-zinc-400">Y</span>
                                  <Input
                                    type="number"
                                    value={Math.round(displayElement.y)}
                                    onChange={(e) => updateElement({ y: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs text-zinc-400">宽度</span>
                                  <Input
                                    type="number"
                                    value={Math.round(displayElement.width)}
                                    onChange={(e) => updateElement({ width: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs text-zinc-400">高度</span>
                                  <Input
                                    type="number"
                                    value={Math.round(displayElement.height)}
                                    onChange={(e) => updateElement({ height: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 血条颜色样式 */}
                            {displayElement.type === 'healthBar' && (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-xs text-white flex items-center gap-2">
                                    <Heart className="w-3.5 h-3.5" />
                                    血条颜色
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="color"
                                      value={displayElement.healthBarColor || '#22C55E'}
                                      onChange={(e) => updateElement({ healthBarColor: e.target.value })}
                                      className="w-10 h-8 p-1 bg-zinc-700 border-zinc-600"
                                    />
                                    <Input
                                      value={displayElement.healthBarColor || '#22C55E'}
                                      onChange={(e) => updateElement({ healthBarColor: e.target.value })}
                                      className="h-8 bg-zinc-700 border-zinc-600 text-sm flex-1"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs text-white">背景颜色</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="color"
                                      value={displayElement.healthBarBgColor || '#374151'}
                                      onChange={(e) => updateElement({ healthBarBgColor: e.target.value })}
                                      className="w-10 h-8 p-1 bg-zinc-700 border-zinc-600"
                                    />
                                    <Input
                                      value={displayElement.healthBarBgColor || '#374151'}
                                      onChange={(e) => updateElement({ healthBarBgColor: e.target.value })}
                                      className="h-8 bg-zinc-700 border-zinc-600 text-sm flex-1"
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            {/* 颜色 */}
                        <div className="space-y-2">
                          <Label className="text-xs text-white flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5" />
                            颜色
                          </Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 w-12">背景</span>
                              <Input
                                type="color"
                                value={displayElement.backgroundColor}
                                onChange={(e) => updateElement({ backgroundColor: e.target.value })}
                                className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                              />
                              <Input
                                value={displayElement.backgroundColor}
                                onChange={(e) => updateElement({ backgroundColor: e.target.value })}
                                className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 w-12">透明度</span>
                              <Input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={displayElement.backgroundOpacity ?? 1}
                                onChange={(e) => updateElement({ backgroundOpacity: Number(e.target.value) })}
                                className="flex-1 h-8"
                              />
                              <span className="text-xs text-zinc-400 w-8 text-right">{Math.round((displayElement.backgroundOpacity ?? 1) * 100)}%</span>
                            </div>
                            {displayElement.type === 'button' && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-12">悬停</span>
                                <Input
                                  type="color"
                                  value={displayElement.hoverBackgroundColor || '#7C3AED'}
                                  onChange={(e) => updateElement({ hoverBackgroundColor: e.target.value })}
                                  className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                                />
                                <Input
                                  value={displayElement.hoverBackgroundColor || '#7C3AED'}
                                  onChange={(e) => updateElement({ hoverBackgroundColor: e.target.value })}
                                  className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-xs"
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 w-12">文字</span>
                              <Input
                                type="color"
                                value={displayElement.color}
                                onChange={(e) => updateElement({ color: e.target.value })}
                                className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                              />
                              <Input
                                value={displayElement.color}
                                onChange={(e) => updateElement({ color: e.target.value })}
                                className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 字体 */}
                        {['button', 'text', 'hotspot'].includes(displayElement.type) && (
                          <div className="space-y-2">
                            <Label className="text-xs text-white flex items-center gap-2">
                              <Type className="w-3.5 h-3.5" />
                              字体
                            </Label>
                            <div>
                              <Select
                                value={displayElement.fontFamily || 'default'}
                                onValueChange={(v) => updateElement({ fontFamily: v === 'default' ? '' : v })}
                              >
                                <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-sm">
                                  <SelectValue placeholder="默认字体" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-600 z-[200] max-h-60">
                                  <SelectItem value="default">默认字体</SelectItem>
                                  <SelectItem value="'Microsoft YaHei', sans-serif">微软雅黑</SelectItem>
                                  <SelectItem value="'SimHei', sans-serif">黑体</SelectItem>
                                  <SelectItem value="'SimSun', serif">宋体</SelectItem>
                                  <SelectItem value="'KaiTi', serif">楷体</SelectItem>
                                  <SelectItem value="'FangSong', serif">仿宋</SelectItem>
                                  <SelectItem value="'PingFang SC', sans-serif">苹方</SelectItem>
                                  <SelectItem value="'STHeiti', sans-serif">华文黑体</SelectItem>
                                  <SelectItem value="'STSong', serif">华文宋体</SelectItem>
                                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                                  <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                                  <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                                  <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                                  <SelectItem value="Tahoma, sans-serif">Tahoma</SelectItem>
                                  <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                                  <SelectItem value="Impact, sans-serif">Impact</SelectItem>
                                  <SelectItem value="serif">衬线字体</SelectItem>
                                  <SelectItem value="monospace">等宽字体</SelectItem>
                                  <SelectItem value="cursive">手写字体</SelectItem>
                                  <SelectItem value="fantasy">艺术字体</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-zinc-400">字号</span>
                                <Input
                                  type="number"
                                  value={displayElement.fontSize}
                                  onChange={(e) => updateElement({ fontSize: Number(e.target.value) })}
                                  className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                />
                              </div>
                              <div>
                                <span className="text-xs text-zinc-400">字重</span>
                                <Select
                                  value={displayElement.fontWeight || '500'}
                                  onValueChange={(v) => updateElement({ fontWeight: v })}
                                >
                                  <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                    <SelectItem value="300">细体</SelectItem>
                                    <SelectItem value="400">常规</SelectItem>
                                    <SelectItem value="500">中等</SelectItem>
                                    <SelectItem value="600">半粗</SelectItem>
                                    <SelectItem value="700">粗体</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-zinc-400">对齐</span>
                                <Select
                                  value={displayElement.textAlign || 'center'}
                                  onValueChange={(v) => updateElement({ textAlign: v as 'left' | 'center' | 'right' })}
                                >
                                  <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                    <SelectItem value="left">左对齐</SelectItem>
                                    <SelectItem value="center">居中</SelectItem>
                                    <SelectItem value="right">右对齐</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <span className="text-xs text-zinc-400">行间距</span>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={displayElement.lineHeight || 1.5}
                                  onChange={(e) => updateElement({ lineHeight: Number(e.target.value) })}
                                  className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 字体颜色状态 */}
                        {['button', 'text'].includes(displayElement.type) && (
                          <div className="space-y-2">
                            <Label className="text-xs text-white flex items-center gap-2">
                              <Palette className="w-3.5 h-3.5" />
                              字体颜色状态
                            </Label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-16">正常</span>
                                <Input
                                  type="color"
                                  value={displayElement.color || '#FFFFFF'}
                                  onChange={(e) => updateElement({ color: e.target.value })}
                                  className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                                />
                                <Input
                                  value={displayElement.color || '#FFFFFF'}
                                  onChange={(e) => updateElement({ color: e.target.value })}
                                  className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-16">悬停</span>
                                <Input
                                  type="color"
                                  value={displayElement.hoverColor || '#FFFFFF'}
                                  onChange={(e) => updateElement({ hoverColor: e.target.value })}
                                  className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                                />
                                <Input
                                  value={displayElement.hoverColor || '#FFFFFF'}
                                  onChange={(e) => updateElement({ hoverColor: e.target.value })}
                                  className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-16">点击</span>
                                <Input
                                  type="color"
                                  value={displayElement.activeColor || '#E0E0E0'}
                                  onChange={(e) => updateElement({ activeColor: e.target.value })}
                                  className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                                />
                                <Input
                                  value={displayElement.activeColor || '#E0E0E0'}
                                  onChange={(e) => updateElement({ activeColor: e.target.value })}
                                  className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 文字阴影 */}
                        {['button', 'text'].includes(displayElement.type) && (
                          <div className="space-y-2">
                            <Label className="text-xs text-white flex items-center gap-2">
                              <Square className="w-3.5 h-3.5" />
                              文字阴影
                            </Label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-12">颜色</span>
                                <Input
                                  type="color"
                                  value={displayElement.shadowColor || 'transparent'}
                                  onChange={(e) => updateElement({ shadowColor: e.target.value })}
                                  className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                                />
                                <Input
                                  value={displayElement.shadowColor || 'transparent'}
                                  onChange={(e) => updateElement({ shadowColor: e.target.value })}
                                  className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-xs"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <span className="text-xs text-zinc-400">X偏移</span>
                                  <Input
                                    type="number"
                                    value={displayElement.shadowOffsetX || 0}
                                    onChange={(e) => updateElement({ shadowOffsetX: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs text-zinc-400">Y偏移</span>
                                  <Input
                                    type="number"
                                    value={displayElement.shadowOffsetY || 0}
                                    onChange={(e) => updateElement({ shadowOffsetY: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs text-zinc-400">模糊</span>
                                  <Input
                                    type="number"
                                    value={displayElement.shadowBlur || 0}
                                    onChange={(e) => updateElement({ shadowBlur: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 文字描边 */}
                        {['button', 'text'].includes(displayElement.type) && (
                          <div className="space-y-2">
                            <Label className="text-xs text-white flex items-center gap-2">
                              <Square className="w-3.5 h-3.5" />
                              文字描边
                            </Label>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-12">粗细</span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={displayElement.textStrokeSize || 0}
                                  onChange={(e) => updateElement({ textStrokeSize: Number(e.target.value) })}
                                  className="h-8 bg-zinc-700 border-zinc-600 text-sm"
                                />
                              </div>
                              {(displayElement.textStrokeSize || 0) > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-400 w-12">颜色</span>
                                  <Input
                                    type="color"
                                    value={displayElement.textStrokeColor || '#000000'}
                                    onChange={(e) => updateElement({ textStrokeColor: e.target.value })}
                                    className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                                  />
                                  <Input
                                    value={displayElement.textStrokeColor || '#000000'}
                                    onChange={(e) => updateElement({ textStrokeColor: e.target.value })}
                                    className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 点击特效 */}
                        {displayElement.type === 'button' && (
                          <div className="space-y-2">
                            <Label className="text-xs text-white flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5" />
                              点击特效
                            </Label>
                            <div className="space-y-2">
                              <Select
                                value={displayElement.clickEffect || 'none'}
                                onValueChange={(v) => updateElement({ clickEffect: v as 'none' | 'ripple' | 'pulse' | 'bounce' | 'shake' | 'flash' })}
                              >
                                <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                  <SelectItem value="none">无</SelectItem>
                                  <SelectItem value="ripple">涟漪</SelectItem>
                                  <SelectItem value="pulse">脉冲</SelectItem>
                                  <SelectItem value="bounce">弹跳</SelectItem>
                                  <SelectItem value="shake">抖动</SelectItem>
                                  <SelectItem value="flash">闪烁</SelectItem>
                                </SelectContent>
                              </Select>
                              {(displayElement.clickEffect || 'none') !== 'none' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-400 w-16">持续时间</span>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={displayElement.effectDuration || 0.3}
                                    onChange={(e) => updateElement({ effectDuration: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm"
                                  />
                                  <span className="text-xs text-zinc-400">秒</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 动画设置 */}
                        {['button', 'text'].includes(displayElement.type) && (
                          <div className="space-y-2">
                            <Label className="text-xs text-white flex items-center gap-2">
                              <Play className="w-3.5 h-3.5" />
                              动画设置
                            </Label>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={displayElement.animationOnStart || false}
                                    onChange={(e) => updateElement({ animationOnStart: e.target.checked })}
                                    className="rounded border-zinc-600"
                                  />
                                  启动即播放
                                </label>
                                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={displayElement.animationOnHover || false}
                                    onChange={(e) => updateElement({ animationOnHover: e.target.checked })}
                                    className="rounded border-zinc-600"
                                  />
                                  鼠标即播放
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={displayElement.animationOnEnter || false}
                                    onChange={(e) => updateElement({ animationOnEnter: e.target.checked })}
                                    className="rounded border-zinc-600"
                                  />
                                  鼠标移入开启
                                </label>
                                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={displayElement.animationLoop || false}
                                    onChange={(e) => updateElement({ animationLoop: e.target.checked })}
                                    className="rounded border-zinc-600"
                                  />
                                  循环播放
                                </label>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-xs text-zinc-400">持续时间</span>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    value={displayElement.animationDuration || 1}
                                    onChange={(e) => updateElement({ animationDuration: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs text-zinc-400">延迟时间</span>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={displayElement.animationDelay || 0}
                                    onChange={(e) => updateElement({ animationDelay: Number(e.target.value) })}
                                    className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-xs text-zinc-400">插值类型</span>
                                  <Select
                                    value={displayElement.easingType || 'easeInOut'}
                                    onValueChange={(v) => updateElement({ easingType: v as any })}
                                  >
                                    <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                      <SelectItem value="linear">线性</SelectItem>
                                      <SelectItem value="ease">缓动</SelectItem>
                                      <SelectItem value="easeIn">缓入</SelectItem>
                                      <SelectItem value="easeOut">缓出</SelectItem>
                                      <SelectItem value="easeInOut">缓入缓出</SelectItem>
                                      <SelectItem value="scroll">滚动</SelectItem>
                                      <SelectItem value="bounce">弹跳</SelectItem>
                                      <SelectItem value="elastic">弹性</SelectItem>
                                      <SelectItem value="back">回弹</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <span className="text-xs text-zinc-400">过渡类型</span>
                                  <Select
                                    value={displayElement.transitionType || 'fade'}
                                    onValueChange={(v) => updateElement({ transitionType: v as any })}
                                  >
                                    <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                      <SelectItem value="fade">淡入淡出</SelectItem>
                                      <SelectItem value="slide">滑动</SelectItem>
                                      <SelectItem value="slideLeft">左滑</SelectItem>
                                      <SelectItem value="slideRight">右滑</SelectItem>
                                      <SelectItem value="slideUp">上滑</SelectItem>
                                      <SelectItem value="slideDown">下滑</SelectItem>
                                      <SelectItem value="zoom">缩放</SelectItem>
                                      <SelectItem value="flip">翻转</SelectItem>
                                      <SelectItem value="rotate">旋转</SelectItem>
                                      <SelectItem value="bounce">弹跳</SelectItem>
                                      <SelectItem value="pulse">脉冲</SelectItem>
                                      <SelectItem value="shake">抖动</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {/* 预览动画按钮 */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-8 mt-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                                onClick={() => previewAnimation(displayElement.id)}
                              >
                                <Play className="w-3.5 h-3.5 mr-1" />
                                预览动画
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* 变换选项 */}
                        <div className="space-y-2">
                          <Label className="text-xs text-white flex items-center gap-2">
                            <RotateCcw className="w-3.5 h-3.5" />
                            变换选项
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-zinc-400">旋转</span>
                              <div className="flex items-center gap-1 mt-1">
                                <Input
                                  type="number"
                                  value={displayElement.rotation || 0}
                                  onChange={(e) => updateElement({ rotation: Number(e.target.value) })}
                                  className="h-8 bg-zinc-700 border-zinc-600 text-sm"
                                />
                                <span className="text-xs text-zinc-400">°</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-zinc-400">缩放</span>
                              <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="3"
                                value={displayElement.scale || 1}
                                onChange={(e) => updateElement({ scale: Number(e.target.value) })}
                                className="h-8 bg-zinc-700 border-zinc-600 text-sm mt-1"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 外观 */}
                        <div className="space-y-2">
                          <Label className="text-xs text-white flex items-center gap-2">
                            <Square className="w-3.5 h-3.5" />
                            外观
                          </Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 w-12">圆角</span>
                              <Input
                                type="number"
                                value={displayElement.borderRadius}
                                onChange={(e) => updateElement({ borderRadius: Number(e.target.value) })}
                                className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 w-12">透明度</span>
                              <Input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={displayElement.opacity}
                                onChange={(e) => updateElement({ opacity: Number(e.target.value) })}
                                className="flex-1"
                              />
                              <span className="text-xs text-white w-8">{Math.round(displayElement.opacity * 100)}%</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-12">边框宽</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={displayElement.borderWidth}
                                  onChange={(e) => updateElement({ borderWidth: Number(e.target.value) })}
                                  className="w-16 h-8 bg-zinc-700 border-zinc-600 text-sm"
                                />
                                <span className="text-xs text-zinc-400 w-12">边框色</span>
                                <Input
                                  type="color"
                                  value={displayElement.borderColor || '#8B5CF6'}
                                  onChange={(e) => updateElement({ borderColor: e.target.value })}
                                  className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                                />
                              </div>
                              {displayElement.borderWidth > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-400 w-12">边框样式</span>
                                  <Select
                                    value={displayElement.borderStyle || 'solid'}
                                    onValueChange={(v) => updateElement({ borderStyle: v as any })}
                                  >
                                    <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-sm flex-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                      <SelectItem value="solid">实线</SelectItem>
                                      <SelectItem value="dashed">虚线</SelectItem>
                                      <SelectItem value="dotted">点线</SelectItem>
                                      <SelectItem value="double">双线</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-12">阴影</span>
                                <Select
                                  value={displayElement.boxShadowType || 'none'}
                                  onValueChange={(v) => {
                                    const shadows: Record<string, string> = {
                                      'none': 'none',
                                      'sm': '0 1px 2px rgba(0,0,0,0.1)',
                                      'md': '0 4px 6px rgba(0,0,0,0.2)',
                                      'lg': '0 10px 15px rgba(0,0,0,0.3)',
                                      'xl': '0 20px 25px rgba(0,0,0,0.4)',
                                      'glow': '0 0 20px rgba(139,92,246,0.5)',
                                    };
                                    updateElement({ boxShadow: shadows[v] || 'none', boxShadowType: v });
                                  }}
                                >
                                  <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-sm flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                    <SelectItem value="none">无阴影</SelectItem>
                                    <SelectItem value="sm">小阴影</SelectItem>
                                    <SelectItem value="md">中阴影</SelectItem>
                                    <SelectItem value="lg">大阴影</SelectItem>
                                    <SelectItem value="xl">超大阴影</SelectItem>
                                    <SelectItem value="glow">发光效果</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 热点内容 */}
                        {displayElement.type === 'hotspot' && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs text-white">热点文字</Label>
                              <Textarea
                                value={displayElement.content}
                                onChange={(e) => updateElement({ content: e.target.value })}
                                className="bg-zinc-700 border-zinc-600 text-sm min-h-[60px]"
                                placeholder="输入热点显示的文字..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white">快速样式</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { name: '紫色', backgroundColor: 'rgba(139, 92, 246, 0.8)', borderColor: '#8B5CF6', color: '#FFFFFF' },
                                  { name: '橙色', backgroundColor: 'rgba(249, 115, 22, 0.8)', borderColor: '#F97316', color: '#FFFFFF' },
                                  { name: '蓝色', backgroundColor: 'rgba(59, 130, 246, 0.8)', borderColor: '#3B82F6', color: '#FFFFFF' },
                                  { name: '绿色', backgroundColor: 'rgba(16, 185, 129, 0.8)', borderColor: '#10B981', color: '#FFFFFF' },
                                  { name: '红色', backgroundColor: 'rgba(239, 68, 68, 0.8)', borderColor: '#EF4444', color: '#FFFFFF' },
                                  { name: '青色', backgroundColor: 'rgba(20, 184, 166, 0.8)', borderColor: '#14B8A6', color: '#FFFFFF' },
                                ].map((preset) => (
                                  <button
                                    key={preset.name}
                                    onClick={() => updateElement({
                                      backgroundColor: preset.backgroundColor,
                                      borderColor: preset.borderColor,
                                      color: preset.color,
                                    })}
                                    className="h-9 rounded-full text-xs font-medium transition-transform hover:scale-105"
                                    style={{
                                      backgroundColor: preset.backgroundColor,
                                      color: preset.color,
                                      border: `2px solid ${preset.borderColor}`,
                                    }}
                                  >
                                    {preset.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-white">图标</Label>
                              <Select
                                value={displayElement.iconName || '无'}
                                onValueChange={(v) => updateElement({ iconName: v === '无' ? '' : v })}
                              >
                                <SelectTrigger className="h-9 bg-zinc-700 border-zinc-600 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                  <SelectItem value="无">无图标</SelectItem>
                                  {[
                                    { name: '箭头' }, { name: '星星' }, { name: '爱心' },
                                    { name: '对号' }, { name: '太阳' }, { name: '月亮' },
                                    { name: '点赞' }, { name: '播放' },
                                  ].map((icon) => (
                                    <SelectItem key={icon.name} value={icon.name}>
                                      {icon.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}

                        {/* 热点3D位置 */}
                        {displayElement.type === 'hotspot' && (
                          <div className="space-y-2">
                            <Label className="text-xs text-white flex items-center gap-2">
                              <Globe className="w-3.5 h-3.5" />
                              3D位置（全景空间）
                            </Label>
                            <div className="p-3 rounded-lg bg-zinc-800/50 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-8">X</span>
                                <Input
                                  type="number"
                                  value={displayElement.hotspotPosition?.x || 0}
                                  onChange={(e) => updateElement({ 
                                    hotspotPosition: { 
                                      ...displayElement.hotspotPosition, 
                                      x: Number(e.target.value),
                                      y: displayElement.hotspotPosition?.y || 0,
                                      z: displayElement.hotspotPosition?.z || -100
                                    } 
                                  })}
                                  className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-sm"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-8">Y</span>
                                <Input
                                  type="number"
                                  value={displayElement.hotspotPosition?.y || 0}
                                  onChange={(e) => updateElement({ 
                                    hotspotPosition: { 
                                      ...displayElement.hotspotPosition,
                                      x: displayElement.hotspotPosition?.x || 0,
                                      y: Number(e.target.value),
                                      z: displayElement.hotspotPosition?.z || -100
                                    } 
                                  })}
                                  className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-sm"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-400 w-8">Z</span>
                                <Input
                                  type="number"
                                  value={displayElement.hotspotPosition?.z || -100}
                                  onChange={(e) => updateElement({ 
                                    hotspotPosition: { 
                                      ...displayElement.hotspotPosition,
                                      x: displayElement.hotspotPosition?.x || 0,
                                      y: displayElement.hotspotPosition?.y || 0,
                                      z: Number(e.target.value)
                                    } 
                                  })}
                                  className="flex-1 h-8 bg-zinc-700 border-zinc-600 text-sm"
                                />
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1">
                                提示：开启「全景预览」模式后，点击「添加热点」可在全景图中直接放置热点
                              </p>
                            </div>
                          </div>
                        )}
                          </>
                        )}
                      </>
                    )}

                    {/* === 行为 === */}
                    {propertyTab === 'behavior' && (
                      <>
                        {/* 层级关系 */}
                        <div className="space-y-2">
                          <Label className="text-xs text-white flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" />
                            层级关系
                          </Label>
                          <div className="space-y-2">
                            <Select
                              value={displayElement.parentId || 'none'}
                              onValueChange={(v) => {
                                if (!currentScene) return;
                                if (v === 'none') {
                                  updateScenes(currentSceneId, 
                                    currentScene.elements.map(e => 
                                      e.id === displayElement.id ? { ...e, parentId: undefined } : e
                                    )
                                  );
                                } else {
                                  // 检查是否会形成循环引用
                                  const children = getAllChildren(displayElement.id, currentScene.elements);
                                  if (!children.some(c => c.id === v) && v !== displayElement.id) {
                                    updateScenes(currentSceneId, 
                                      currentScene.elements.map(e => 
                                        e.id === displayElement.id ? { ...e, parentId: v } : e
                                      )
                                    );
                                  }
                                }
                                setSaveStatus('unsaved');
                              }}
                            >
                              <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-sm">
                                <SelectValue placeholder="无父级" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                                <SelectItem value="none">无父级</SelectItem>
                                {currentScene?.elements
                                  .filter(e => e.id !== displayElement.id && !getAllChildren(displayElement.id, currentScene.elements).some(c => c.id === e.id))
                                  .map(e => (
                                    <SelectItem key={e.id} value={e.id}>
                                      {e.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {displayElement.parentId && (
                              <div className="flex items-center justify-between p-2 bg-zinc-700/50 rounded text-xs">
                                <span className="text-zinc-400">父级: {currentScene?.elements.find(e => e.id === displayElement.parentId)?.name}</span>
                                <button
                                  onClick={() => {
                                    if (!currentScene) return;
                                    updateScenes(currentSceneId, 
                                      currentScene.elements.map(e => 
                                        e.id === displayElement.id ? { ...e, parentId: undefined } : e
                                      )
                                    );
                                    setSaveStatus('unsaved');
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  解除
                                </button>
                              </div>
                            )}
                            {/* 显示子元素列表 */}
                            {(() => {
                              const children = currentScene?.elements.filter(e => e.parentId === displayElement.id) || [];
                              if (children.length > 0) {
                                return (
                                  <div className="p-2 bg-zinc-700/50 rounded text-xs">
                                    <span className="text-zinc-400">子元素 ({children.length}):</span>
                                    <div className="mt-1 space-y-1">
                                      {children.map(child => (
                                        <div key={child.id} className="flex items-center justify-between">
                                          <span 
                                            className="text-zinc-300 cursor-pointer hover:text-purple-400"
                                            onClick={() => setSelectedId(child.id)}
                                          >
                                            {child.name}
                                          </span>
                                          <button
                                            onClick={() => {
                                              if (!currentScene) return;
                                              updateScenes(currentSceneId, 
                                                currentScene.elements.map(e => 
                                                  e.id === child.id ? { ...e, parentId: undefined } : e
                                                )
                                              );
                                              setSaveStatus('unsaved');
                                            }}
                                            className="text-zinc-500 hover:text-red-400"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>

                        {/* 视频控件 - 参考截图设计 */}
                        {displayElement.type === 'video' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">显示即播放</span>
                              </div>
                              <Switch
                                checked={displayElement.playOnVisible ?? true}
                                onCheckedChange={(v) => updateElement({ playOnVisible: v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <EyeOff className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">不可见关闭</span>
                              </div>
                              <Switch
                                checked={displayElement.pauseOnHidden ?? true}
                                onCheckedChange={(v) => updateElement({ pauseOnHidden: v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">播放音频</span>
                              </div>
                              <Switch
                                checked={!displayElement.muted}
                                onCheckedChange={(v) => updateElement({ muted: !v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Repeat className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">循环播放</span>
                              </div>
                              <Switch
                                checked={displayElement.loop ?? false}
                                onCheckedChange={(v) => updateElement({ loop: v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <EyeOff className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">透明通道</span>
                              </div>
                              <Switch
                                checked={displayElement.enableTransparency !== false}
                                onCheckedChange={(v) => updateElement({ enableTransparency: v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>
                            <p className="text-xs text-zinc-500 -mt-1 px-1">支持 WebM 透明视频，推荐用于叠加效果</p>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <MousePointerClick className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">显示控制条</span>
                              </div>
                              <Switch
                                checked={displayElement.controls ?? false}
                                onCheckedChange={(v) => updateElement({ controls: v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Move className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">可拖拽</span>
                              </div>
                              <Switch
                                checked={displayElement.draggable ?? false}
                                onCheckedChange={(v) => updateElement({ draggable: v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* 图片行为 */}
                        {displayElement.type === 'image' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Move className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">可拖拽</span>
                              </div>
                              <Switch
                                checked={displayElement.draggable ?? false}
                                onCheckedChange={(v) => updateElement({ draggable: v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Maximize2 className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">点击放大</span>
                              </div>
                              <Switch
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* 按钮行为 */}
                        {displayElement.type === 'button' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">悬停放大</span>
                              </div>
                              <Switch
                                checked={(displayElement.hoverScale ?? 1) > 1}
                                onCheckedChange={(v) => updateElement({ hoverScale: v ? 1.05 : 1 })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <MousePointerClick className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">点击反馈</span>
                              </div>
                              <Switch
                                defaultChecked
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* 音频行为 */}
                        {displayElement.type === 'audio' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">自动播放</span>
                              </div>
                              <Switch
                                checked={displayElement.autoplay ?? false}
                                onCheckedChange={(v) => updateElement({ autoplay: v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Repeat className="w-4 h-4 text-zinc-300" />
                                <span className="text-sm">循环播放</span>
                              </div>
                              <Switch
                                checked={displayElement.loop ?? false}
                                onCheckedChange={(v) => updateElement({ loop: v })}
                                className="data-[state=checked]:bg-blue-500"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* === 事件 === */}
                    {propertyTab === 'event' && (
                      <>
                        {/* 交互事件 */}
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-white">交互事件</Label>
                          <Button
                            onClick={() => setShowEventDialog(true)}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            添加
                          </Button>
                        </div>
                        
                        {displayElement.events.length > 0 ? (
                          <div className="space-y-2">
                            {displayElement.events.map((event, idx) => (
                              <div key={idx} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-purple-400 flex items-center gap-2">
                                    {event.type === 'click' && <><MousePointerClick className="w-4 h-4" /> 点击时</>}
                                    {event.type === 'hover' && <><Eye className="w-4 h-4" /> 悬停时</>}
                                    {event.type === 'longPress' && <><MousePointer2 className="w-4 h-4" /> 长按时</>}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeEvent(idx)}
                                    className="w-6 h-6 text-zinc-400 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                                {event.actions.map((action, aIdx) => (
                                  <div key={aIdx} className="text-xs text-zinc-300 pl-6 py-1 flex items-center gap-1">
                                    <ChevronRight className="w-3 h-3" />
                                    {action.type === 'jumpScene' && `跳转到: ${scenes.find(s => s.id === action.targetSceneId)?.name}`}
                                    {action.type === 'showElement' && '显示元素'}
                                    {action.type === 'hideElement' && '隐藏元素'}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-zinc-400">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">暂无交互事件</p>
                            <p className="text-xs mt-1">点击添加按钮创建交互</p>
                          </div>
                        )}
                        
                        {/* 时间触发器 - 仅视频元素显示 */}
                        {displayElement.type === 'video' && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-white flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                时间触发器
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-zinc-300 hover:text-white"
                                onClick={() => {
                                  const newTrigger: VideoTimeTrigger = {
                                    id: `trigger-${Date.now()}`,
                                    time: 0,
                                    actions: [],
                                    description: '',
                                  };
                                  updateElement({ 
                                    timeTriggers: [...(displayElement.timeTriggers || []), newTrigger] 
                                  });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                添加
                              </Button>
                            </div>
                            
                            {/* 触发器列表 */}
                            {displayElement.timeTriggers && displayElement.timeTriggers.length > 0 && (
                              <div className="space-y-2">
                                {displayElement.timeTriggers.map((trigger, index) => (
                                  <div key={trigger.id} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs text-zinc-400">第</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        step={0.5}
                                        value={trigger.time}
                                        onChange={(e) => {
                                          const newTriggers = [...(displayElement.timeTriggers || [])];
                                          newTriggers[index] = { ...trigger, time: parseFloat(e.target.value) || 0 };
                                          updateElement({ timeTriggers: newTriggers });
                                        }}
                                        className="h-6 w-16 bg-white border-zinc-300 text-xs text-zinc-900"
                                      />
                                      <span className="text-xs text-zinc-400">秒时触发</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 ml-auto text-zinc-400 hover:text-red-400"
                                        onClick={() => {
                                          const newTriggers = (displayElement.timeTriggers || []).filter((_, i) => i !== index);
                                          updateElement({ timeTriggers: newTriggers });
                                        }}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    
                                    {/* 动作列表 */}
                                    <div className="space-y-2">
                                      {trigger.actions.map((action, actionIndex) => (
                                        <div key={action.id} className="bg-zinc-700/50 rounded p-2 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Select
                                              value={action.type}
                                              onValueChange={(v) => {
                                                const newTriggers = [...(displayElement.timeTriggers || [])];
                                                newTriggers[index] = {
                                                  ...trigger,
                                                  actions: trigger.actions.map((a, i) => 
                                                    i === actionIndex ? { ...a, type: v as EventActionType } : a
                                                  )
                                                };
                                                updateElement({ timeTriggers: newTriggers });
                                              }}
                                            >
                                              <SelectTrigger className="h-6 bg-white border-zinc-300 text-xs text-zinc-900">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="showElement">显示元素</SelectItem>
                                                <SelectItem value="hideElement">隐藏元素</SelectItem>
                                                <SelectItem value="toggleElement">切换元素</SelectItem>
                                                <SelectItem value="jumpScene">跳转场景</SelectItem>
                                                <SelectItem value="playAudio">播放音频</SelectItem>
                                                <SelectItem value="pauseAudio">暂停音频</SelectItem>
                                                <SelectItem value="playVideo">播放视频</SelectItem>
                                                <SelectItem value="pauseVideo">暂停视频</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400"
                                              onClick={() => {
                                                const newTriggers = [...(displayElement.timeTriggers || [])];
                                                newTriggers[index] = {
                                                  ...trigger,
                                                  actions: trigger.actions.filter((_, i) => i !== actionIndex)
                                                };
                                                updateElement({ timeTriggers: newTriggers });
                                              }}
                                            >
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </div>
                                          
                                          {/* 目标元素选择 */}
                                          {['showElement', 'hideElement', 'toggleElement', 'playVideo', 'pauseVideo', 'playAudio', 'pauseAudio'].includes(action.type) && (
                                            <Select
                                              value={action.targetElementId || ''}
                                              onValueChange={(v) => {
                                                const newTriggers = [...(displayElement.timeTriggers || [])];
                                                newTriggers[index] = {
                                                  ...trigger,
                                                  actions: trigger.actions.map((a, i) => 
                                                    i === actionIndex ? { ...a, targetElementId: v } : a
                                                  )
                                                };
                                                updateElement({ timeTriggers: newTriggers });
                                              }}
                                            >
                                              <SelectTrigger className="h-6 bg-white border-zinc-300 text-xs text-zinc-900">
                                                <SelectValue placeholder="选择元素" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {currentScene?.elements
                                                  .filter(e => e.id !== displayElement.id)
                                                  .map(e => (
                                                    <SelectItem key={e.id} value={e.id}>
                                                      {e.name} ({e.type})
                                                    </SelectItem>
                                                  ))}
                                              </SelectContent>
                                            </Select>
                                          )}
                                          
                                          {/* 目标场景选择 */}
                                          {action.type === 'jumpScene' && (
                                            <Select
                                              value={action.targetSceneId || ''}
                                              onValueChange={(v) => {
                                                const newTriggers = [...(displayElement.timeTriggers || [])];
                                                newTriggers[index] = {
                                                  ...trigger,
                                                  actions: trigger.actions.map((a, i) => 
                                                    i === actionIndex ? { ...a, targetSceneId: v } : a
                                                  )
                                                };
                                                updateElement({ timeTriggers: newTriggers });
                                              }}
                                            >
                                              <SelectTrigger className="h-6 bg-white border-zinc-300 text-xs text-zinc-900">
                                                <SelectValue placeholder="选择场景" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {scenes.map(s => (
                                                  <SelectItem key={s.id} value={s.id}>
                                                    {s.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          )}
                                        </div>
                                      ))}
                                      
                                      {/* 添加动作按钮 */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-full text-xs bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                                        onClick={() => {
                                          const newAction: EventAction = {
                                            id: `action-${Date.now()}`,
                                            type: 'showElement',
                                            targetElementId: '',
                                          };
                                          const newTriggers = [...(displayElement.timeTriggers || [])];
                                          newTriggers[index] = {
                                            ...trigger,
                                            actions: [...trigger.actions, newAction]
                                          };
                                          updateElement({ timeTriggers: newTriggers });
                                        }}
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        添加动作
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {(!displayElement.timeTriggers || displayElement.timeTriggers.length === 0) && (
                              <p className="text-xs text-zinc-500">视频播放到指定时间时触发动作</p>
                            )}
                          </div>
                        )}

                        {/* 路径动画 - 简化版，支持画布绘制 */}
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-white flex items-center gap-2">
                              <Route className="w-4 h-4" />
                              移动路径
                            </Label>
                            {displayElement.path && displayElement.path.points.length >= 2 ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-7 px-2 text-xs ${pathEditMode?.elementId === displayElement.id ? 'text-green-400 bg-green-500/20' : 'text-zinc-300 hover:text-white'}`}
                                  onClick={() => {
                                    if (pathEditMode?.elementId === displayElement.id) {
                                      setPathEditMode(null);
                                    } else {
                                      setPathDrawMode(null);
                                      setPathEditMode({ elementId: displayElement.id });
                                    }
                                  }}
                                >
                                  <Edit3 className="w-3 h-3 mr-1" />
                                  {pathEditMode?.elementId === displayElement.id ? '完成' : '编辑'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-zinc-400 hover:text-red-400"
                                  onClick={() => {
                                    updateElement({ path: undefined });
                                    setPathEditMode(null);
                                    setPathDrawMode(null);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-7 text-xs ${pathDrawMode?.elementId === displayElement.id ? 'bg-purple-500/30 border-purple-500 text-purple-300' : 'border-zinc-600 text-zinc-300 hover:text-white'}`}
                                onClick={() => {
                                  if (pathDrawMode?.elementId === displayElement.id) {
                                    setPathDrawMode(null);
                                  } else {
                                    setPathEditMode(null);
                                    setPathDrawMode({ elementId: displayElement.id });
                                  }
                                }}
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                {pathDrawMode?.elementId === displayElement.id ? '绘制中...' : '绘制路径'}
                              </Button>
                            )}
                          </div>

                          {/* 路径已存在 - 显示配置 */}
                          {displayElement.path && displayElement.path.points.length >= 2 && (
                            <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700 space-y-3">
                              {/* 路径信息 */}
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-zinc-400">路径点:</span>
                                <span className="text-white font-medium">{displayElement.path.points.length} 个</span>
                                <span className="text-zinc-500 mx-2">|</span>
                                <span className="text-green-400">●</span>
                                <span className="text-zinc-400">起点</span>
                                <span className="text-red-400 ml-1">●</span>
                                <span className="text-zinc-400">终点</span>
                              </div>
                              
                              {/* 动画参数 */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-zinc-400">持续时间(ms)</Label>
                                  <Input
                                    type="number"
                                    value={displayElement.path.duration || 3000}
                                    onChange={(e) => updateElement({ 
                                      path: { ...displayElement.path!, duration: parseInt(e.target.value) || 3000 } 
                                    })}
                                    className="h-7 text-xs bg-zinc-700 border-zinc-600"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-zinc-400">缓动</Label>
                                  <Select
                                    value={displayElement.path.easing || 'easeInOut'}
                                    onValueChange={(v) => updateElement({ 
                                      path: { ...displayElement.path!, easing: v as any } 
                                    })}
                                  >
                                    <SelectTrigger className="h-7 text-xs bg-zinc-700 border-zinc-600">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-600">
                                      <SelectItem value="linear">线性</SelectItem>
                                      <SelectItem value="ease">缓动</SelectItem>
                                      <SelectItem value="easeIn">缓入</SelectItem>
                                      <SelectItem value="easeOut">缓出</SelectItem>
                                      <SelectItem value="easeInOut">缓入缓出</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-zinc-400">循环模式</Label>
                                  <Select
                                    value={displayElement.path.loopMode || 'none'}
                                    onValueChange={(v) => updateElement({ 
                                      path: { ...displayElement.path!, loopMode: v as any } 
                                    })}
                                  >
                                    <SelectTrigger className="h-7 text-xs bg-zinc-700 border-zinc-600">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-600">
                                      <SelectItem value="none">不循环</SelectItem>
                                      <SelectItem value="loop">循环</SelectItem>
                                      <SelectItem value="alternate">往返</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-zinc-400">延迟(ms)</Label>
                                  <Input
                                    type="number"
                                    value={displayElement.path.delay || 0}
                                    onChange={(e) => updateElement({ 
                                      path: { ...displayElement.path!, delay: parseInt(e.target.value) || 0 } 
                                    })}
                                    className="h-7 text-xs bg-zinc-700 border-zinc-600"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={displayElement.path.autoPlay || false}
                                    onCheckedChange={(v) => updateElement({ 
                                      path: { ...displayElement.path!, autoPlay: v } 
                                    })}
                                  />
                                  <Label className="text-xs text-zinc-300">自动播放</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-7 text-xs ${pathPreviewState?.elementId === displayElement.id ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-zinc-600 text-zinc-300'}`}
                                    onClick={() => {
                                      if (pathPreviewState?.elementId === displayElement.id) {
                                        stopPathPreview();
                                      } else {
                                        previewPathAnimation(displayElement.id);
                                      }
                                    }}
                                  >
                                    <Play className="w-3 h-3 mr-1" />
                                    {pathPreviewState?.elementId === displayElement.id ? '停止' : '预览'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-zinc-600 text-zinc-300"
                                    onClick={() => {
                                      // 清空路径重新绘制
                                      stopPathPreview();
                                      updateElement({ 
                                        path: { ...displayElement.path!, points: [] } 
                                      });
                                      setPathEditMode(null);
                                      setPathDrawMode({ elementId: displayElement.id });
                                    }}
                                  >
                                    重绘
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 绘制模式提示 */}
                          {pathDrawMode?.elementId === displayElement.id && (
                            <div className="bg-purple-500/20 border border-purple-500/40 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-purple-400">🖊️</span>
                                <div className="text-xs text-purple-300">
                                  <p className="font-medium mb-1">路径绘制模式已开启</p>
                                  <p>在画布上点击添加路径点，元素将沿路径移动</p>
                                  <p className="mt-1 text-purple-400">按 ESC 或点击「绘制中...」按钮退出</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 编辑模式提示 */}
                          {pathEditMode?.elementId === displayElement.id && (
                            <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-green-400">✏️</span>
                                <div className="text-xs text-green-300">
                                  <p className="font-medium mb-1">路径编辑模式已开启</p>
                                  <p>拖拽路径点调整位置，拖拽控制点调整曲线形状</p>
                                  <p className="mt-1">🟢 出方向控制点 | 🩷 入方向控制点</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 无路径时的提示 */}
                          {(!displayElement.path || displayElement.path.points.length < 2) && pathDrawMode?.elementId !== displayElement.id && (
                            <p className="text-xs text-zinc-500">点击「绘制路径」在画布上绘制移动路径</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          ) : currentScene ? (
            /* 场景设置 */
            <>
              <div className="p-3 border-b border-zinc-700 bg-zinc-800">
                <h3 className="font-medium text-sm">场景设置</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-white">场景名称</Label>
                    <Input
                      value={currentScene.name}
                      onChange={(e) =>
                        setScenes(scenes.map((s) => (s.id === currentSceneId ? { ...s, name: e.target.value } : s)))
                      }
                      className="h-9 bg-zinc-700 border-zinc-600 text-sm"
                    />
                  </div>
                  
                  {/* 画布尺寸设置 */}
                  <div className="space-y-2">
                    <Label className="text-xs text-white flex items-center gap-2">
                      <Maximize2 className="w-4 h-4" />
                      画布尺寸
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CANVAS_PRESETS.slice(0, -1).map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setScenes(scenes.map((s) => 
                              s.id === currentSceneId 
                                ? { ...s, canvasWidth: preset.width, canvasHeight: preset.height } 
                                : s
                            ));
                            // 重置缩放和偏移以适应新尺寸
                            setZoom(0.5);
                            setOffset({ x: 100, y: 50 });
                            setSaveStatus('unsaved');
                          }}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            currentScene.canvasWidth === preset.width && currentScene.canvasHeight === preset.height
                              ? 'bg-purple-500/20 border-purple-500/50 text-white'
                              : 'bg-zinc-700/30 border-zinc-600 text-zinc-300 hover:bg-zinc-700/50'
                          }`}
                        >
                          <span className="text-lg" suppressHydrationWarning>{preset.icon}</span>
                          <p className="text-xs mt-1">{preset.name}</p>
                          <p className="text-[10px] text-zinc-400" suppressHydrationWarning>{preset.width}×{preset.height}</p>
                        </button>
                      ))}
                    </div>
                    
                    {/* 自定义尺寸 */}
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={currentScene.canvasWidth || 1920}
                        onChange={(e) => {
                          const newWidth = Math.max(100, Math.min(4096, parseInt(e.target.value) || 1920));
                          setScenes(scenes.map((s) => 
                            s.id === currentSceneId ? { ...s, canvasWidth: newWidth } : s
                          ));
                          setSaveStatus('unsaved');
                        }}
                        className="h-8 bg-zinc-700 border-zinc-600 text-xs"
                        placeholder="宽度"
                      />
                      <span className="text-zinc-400" suppressHydrationWarning>×</span>
                      <Input
                        type="number"
                        value={currentScene.canvasHeight || 1080}
                        onChange={(e) => {
                          const newHeight = Math.max(100, Math.min(4096, parseInt(e.target.value) || 1080));
                          setScenes(scenes.map((s) => 
                            s.id === currentSceneId ? { ...s, canvasHeight: newHeight } : s
                          ));
                          setSaveStatus('unsaved');
                        }}
                        className="h-8 bg-zinc-700 border-zinc-600 text-xs"
                        placeholder="高度"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">范围: 100-4096像素</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-white">背景颜色</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={currentScene.backgroundColor}
                        onChange={(e) =>
                          setScenes(scenes.map((s) => (s.id === currentSceneId ? { ...s, backgroundColor: e.target.value } : s)))
                        }
                        className="w-10 h-9 p-1 border-0 bg-transparent cursor-pointer"
                      />
                      <Input
                        value={currentScene.backgroundColor}
                        onChange={(e) =>
                          setScenes(scenes.map((s) => (s.id === currentSceneId ? { ...s, backgroundColor: e.target.value } : s)))
                        }
                        className="flex-1 h-9 bg-zinc-700 border-zinc-600 text-xs"
                      />
                    </div>
                  </div>

                  <Separator className="bg-zinc-700" />

                  <div className="space-y-2">
                    <Label className="text-xs text-white">转场效果</Label>
                    <Select
                      value={currentScene.transition}
                      onValueChange={(v) =>
                        setScenes(scenes.map((s) => (s.id === currentSceneId ? { ...s, transition: v as any } : s)))
                      }
                    >
                      <SelectTrigger className="h-9 bg-zinc-700 border-zinc-600 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-600 z-[200]">
                        <SelectItem value="fade">淡入淡出</SelectItem>
                        <SelectItem value="dissolve">叠化</SelectItem>
                        <SelectItem value="slide">滑动</SelectItem>
                        <SelectItem value="zoom">缩放</SelectItem>
                        <SelectItem value="wipe">擦除</SelectItem>
                        <SelectItem value="flip">翻转</SelectItem>
                        <SelectItem value="blur">模糊</SelectItem>
                        <SelectItem value="none">无</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : null}
        </aside>
      </div>

      {/* 添加场景弹窗 */}
      <Dialog open={showSceneDialog} onOpenChange={setShowSceneDialog}>
        <DialogContent className="bg-zinc-800 border-zinc-600">
          <DialogHeader>
            <DialogTitle className="text-white">添加场景</DialogTitle>
          </DialogHeader>
          <Input
            value={newSceneName}
            onChange={(e) => setNewSceneName(e.target.value)}
            placeholder="场景名称"
            className="bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-500"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSceneDialog(false)} className="border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900">
              取消
            </Button>
            <Button onClick={addScene} className="bg-purple-600 hover:bg-purple-700 text-white">
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加事件弹窗 - 支持多动作配置 */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-zinc-800 border-zinc-600 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">配置交互事件</DialogTitle>
            <DialogDescription className="text-zinc-300">
              为元素添加触发事件和执行动作
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* 添加新事件 */}
            {(!selectedElement || selectedElement.events.length === 0) && (
              <div className="space-y-2">
                <Label className="text-sm text-zinc-300">选择触发方式</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => addEvent('click')}
                    className="p-3 rounded-lg border border-zinc-600 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center text-zinc-300"
                  >
                    <MousePointerClick className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">点击</span>
                  </button>
                  <button
                    onClick={() => addEvent('hover')}
                    className="p-3 rounded-lg border border-zinc-600 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center text-zinc-300"
                  >
                    <Eye className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">悬停</span>
                  </button>
                  <button
                    onClick={() => addEvent('longPress')}
                    className="p-3 rounded-lg border border-zinc-600 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center text-zinc-300"
                  >
                    <MousePointer2 className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">长按</span>
                  </button>
                </div>
              </div>
            )}

            {/* 已有事件列表 */}
            {selectedElement && selectedElement.events.length > 0 && (
              <div className="space-y-4">
                {selectedElement.events.map((event, eventIndex) => (
                  <div key={eventIndex} className="border border-zinc-600 rounded-lg p-3 space-y-3">
                    {/* 事件头部 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {event.type === 'click' && <MousePointerClick className="w-4 h-4 text-purple-400" />}
                        {event.type === 'hover' && <Eye className="w-4 h-4 text-blue-400" />}
                        {event.type === 'longPress' && <MousePointer2 className="w-4 h-4 text-amber-400" />}
                        <span className="text-sm font-medium text-white">
                          {event.type === 'click' ? '点击事件' : event.type === 'hover' ? '悬停事件' : '长按事件'}
                        </span>
                      </div>
                      <button
                        onClick={() => removeEvent(eventIndex)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400"
                        title="删除事件"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 动作列表 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">执行动作序列</Label>
                      {event.actions.length > 0 ? (
                        <div className="space-y-2">
                          {event.actions.map((action, actionIndex) => (
                            <div key={action.id} className="bg-zinc-700/50 rounded p-2 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white">
                                  {actionIndex + 1}. {getActionLabel(action.type)}
                                </span>
                                <button
                                  onClick={() => removeActionFromEvent(eventIndex, action.id)}
                                  className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                  title="删除动作"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              
                              {/* 动作参数配置 */}
                              {renderActionConfig(eventIndex, action)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 text-center py-2">暂无动作，请添加</p>
                      )}
                    </div>

                    {/* 添加动作按钮 */}
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'jumpScene' })}
                      >
                        跳转场景
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'showElement' })}
                      >
                        显示元素
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'hideElement' })}
                      >
                        隐藏元素
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'toggleElement' })}
                      >
                        切换显示
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'playAudio' })}
                      >
                        播放音频
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'pauseAudio' })}
                      >
                        暂停音频
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'playVideo' })}
                      >
                        播放视频
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'pauseVideo' })}
                      >
                        暂停视频
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'stopMedia' })}
                      >
                        停止媒体
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'setOpacity', value: 1 })}
                      >
                        设置透明度
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'moveTo' })}
                      >
                        移动到
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'scaleTo', value: 1 })}
                      >
                        缩放到
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'rotateTo', value: 0 })}
                      >
                        旋转到
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'animate' })}
                      >
                        执行动画
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'setVolume', value: 100 })}
                      >
                        设置音量
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'seekTo', value: 0 })}
                      >
                        跳转播放位置
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'delay', delay: 1000 })}
                      >
                        延迟等待
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'setProperty' })}
                      >
                        设置属性
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-green-500 text-green-100 bg-green-700/80 hover:bg-green-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'addHealth', value: 10 })}
                      >
                        加血
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-500 text-red-100 bg-red-700/80 hover:bg-red-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'reduceHealth', value: 10 })}
                      >
                        减血
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-zinc-500 text-zinc-100 bg-zinc-700/80 hover:bg-zinc-600 hover:text-white"
                        onClick={() => addActionToEvent(eventIndex, { type: 'setHealth', value: 100 })}
                      >
                        设置血量
                      </Button>
                    </div>
                  </div>
                ))}

                {/* 添加新事件按钮 */}
                <Button
                  variant="outline"
                  className="w-full border-dashed border-zinc-600 text-zinc-300 hover:text-white"
                  onClick={() => {
                    const types: ('click' | 'hover' | 'longPress')[] = ['click', 'hover', 'longPress'];
                    const existingTypes = selectedElement.events.map(e => e.type);
                    const availableType = types.find(t => !existingTypes.includes(t)) || 'click';
                    addEvent(availableType);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加新事件
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowEventDialog(false)} className="bg-purple-600">
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 选择项动作配置弹窗 */}
      <Dialog open={!!showChoiceActionDialog} onOpenChange={(open) => !open && setShowChoiceActionDialog(null)}>
        <DialogContent className="bg-zinc-800 border-zinc-600 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              配置点击后执行的动作
            </DialogTitle>
            <DialogDescription className="text-zinc-300">
              选择该选项被点击后执行的动作序列
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* 当前动作列表 */}
            {(() => {
              const element = currentScene?.elements.find(el => el.id === showChoiceActionDialog?.elementId);
              const actions = element?.clickActions || [];
              
              // 获取场景中的血条元素列表
              const healthBars = currentScene?.elements.filter(el => el.type === 'healthBar') || [];
              // 获取所有场景列表
              const allScenes = scenes || [];
              // 获取所有可显示/隐藏的元素
              const toggleableElements = currentScene?.elements.filter(el => el.type !== 'choiceItem') || [];
              
              // 更新动作的辅助函数
              const updateAction = (actionIdx: number, updates: Partial<EventAction>) => {
                const currentActions = element?.clickActions || [];
                const newActions = [...currentActions];
                newActions[actionIdx] = { ...newActions[actionIdx], ...updates };
                updateElement({ clickActions: newActions });
              };
              
              return actions.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs text-white">已配置的动作</Label>
                  {actions.map((action, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-700/50 border border-zinc-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white font-medium">
                          {idx + 1}. {action.type === 'addHealth' ? '加血' : 
                            action.type === 'reduceHealth' ? '减血' :
                            action.type === 'setHealth' ? '设置血量' :
                            action.type === 'jumpScene' ? '跳转场景' :
                            action.type === 'showElement' ? '显示元素' :
                            action.type === 'hideElement' ? '隐藏元素' :
                            action.type === 'toggleElement' ? '切换显示' :
                            action.type === 'playAudio' ? '播放音频' :
                            action.type === 'pauseAudio' ? '暂停音频' :
                            action.type === 'playVideo' ? '播放视频' :
                            action.type === 'pauseVideo' ? '暂停视频' :
                            action.type === 'stopMedia' ? '停止媒体' :
                            action.type === 'setVolume' ? '设置音量' :
                            action.type === 'setOpacity' ? '设置透明度' :
                            action.type === 'moveTo' ? '移动到' :
                            action.type === 'scaleTo' ? '缩放到' :
                            action.type === 'rotateTo' ? '旋转到' :
                            action.type === 'delay' ? '延迟等待' :
                            action.type === 'setProperty' ? '设置属性' :
                            action.type}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-red-400 hover:text-red-300"
                          onClick={() => {
                            const currentActions = element?.clickActions || [];
                            const newActions = currentActions.filter((_, i) => i !== idx);
                            updateElement({ clickActions: newActions });
                          }}
                        >
                          删除
                        </Button>
                      </div>
                      
                      {/* 血量相关动作配置 */}
                      {['addHealth', 'reduceHealth', 'setHealth'].includes(action.type) && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-zinc-400">目标血条</Label>
                            <Select
                              value={action.targetElementId || ''}
                              onValueChange={(v) => updateAction(idx, { targetElementId: v })}
                            >
                              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white">
                                <SelectValue placeholder="选择血条" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-700 border-zinc-600">
                                {healthBars.map(hb => (
                                  <SelectItem key={hb.id} value={hb.id} className="text-xs">
                                    {hb.name || '血条'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-zinc-400">
                              {action.type === 'setHealth' ? '血量值' : '数值'}
                            </Label>
                            <Input
                              type="number"
                              value={action.value || 0}
                              onChange={(e) => updateAction(idx, { value: parseInt(e.target.value) || 0 })}
                              className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white"
                              min={0}
                              max={action.type === 'setHealth' ? undefined : undefined}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* 跳转场景配置 */}
                      {action.type === 'jumpScene' && (
                        <div className="space-y-1 mt-2">
                          <Label className="text-xs text-zinc-400">目标场景</Label>
                          <Select
                            value={action.targetSceneId || ''}
                            onValueChange={(v) => updateAction(idx, { targetSceneId: v })}
                          >
                            <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white">
                              <SelectValue placeholder="选择场景" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-700 border-zinc-600">
                              {allScenes.map(s => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {/* 显示/隐藏元素配置 */}
                      {['showElement', 'hideElement', 'toggleElement'].includes(action.type) && (
                        <div className="space-y-1 mt-2">
                          <Label className="text-xs text-zinc-400">目标元素</Label>
                          <Select
                            value={action.targetElementId || ''}
                            onValueChange={(v) => updateAction(idx, { targetElementId: v })}
                          >
                            <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white">
                              <SelectValue placeholder="选择元素" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-700 border-zinc-600">
                              {toggleableElements.map(el => (
                                <SelectItem key={el.id} value={el.id} className="text-xs">
                                  {el.name || el.type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {/* 设置透明度配置 */}
                      {action.type === 'setOpacity' && (
                        <div className="space-y-2 mt-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-zinc-400">目标元素</Label>
                            <Select
                              value={action.targetElementId || ''}
                              onValueChange={(v) => updateAction(idx, { targetElementId: v })}
                            >
                              <SelectTrigger className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white">
                                <SelectValue placeholder="选择元素" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-700 border-zinc-600">
                                {toggleableElements.map(el => (
                                  <SelectItem key={el.id} value={el.id} className="text-xs">
                                    {el.name || el.type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-zinc-400">透明度: {Math.round((action.value || 1) * 100)}%</Label>
                            <Input
                              type="range"
                              value={(action.value || 1) * 100}
                              onChange={(e) => updateAction(idx, { value: parseInt(e.target.value) / 100 })}
                              className="h-8"
                              min={0}
                              max={100}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* 延迟等待配置 */}
                      {action.type === 'delay' && (
                        <div className="space-y-1 mt-2">
                          <Label className="text-xs text-zinc-400">延迟时间 (毫秒)</Label>
                          <Input
                            type="number"
                            value={action.delay || 1000}
                            onChange={(e) => updateAction(idx, { delay: parseInt(e.target.value) || 1000 })}
                            className="h-8 bg-zinc-600 border-zinc-500 text-xs text-white"
                            min={0}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">暂无动作，请添加</p>
              );
            })()}

            <Separator className="bg-zinc-700" />

            {/* 添加动作 */}
            <div className="space-y-2">
              <Label className="text-xs text-white">添加动作</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: 'addHealth', label: '加血', color: 'bg-green-600' },
                  { type: 'reduceHealth', label: '减血', color: 'bg-red-600' },
                  { type: 'setHealth', label: '设置血量', color: 'bg-blue-600' },
                  { type: 'jumpScene', label: '跳转场景', color: 'bg-zinc-600' },
                  { type: 'showElement', label: '显示元素', color: 'bg-zinc-600' },
                  { type: 'hideElement', label: '隐藏元素', color: 'bg-zinc-600' },
                  { type: 'toggleElement', label: '切换显示', color: 'bg-zinc-600' },
                  { type: 'playAudio', label: '播放音频', color: 'bg-zinc-600' },
                  { type: 'pauseAudio', label: '暂停音频', color: 'bg-zinc-600' },
                  { type: 'playVideo', label: '播放视频', color: 'bg-zinc-600' },
                  { type: 'pauseVideo', label: '暂停视频', color: 'bg-zinc-600' },
                  { type: 'stopMedia', label: '停止媒体', color: 'bg-zinc-600' },
                  { type: 'setOpacity', label: '设置透明度', color: 'bg-zinc-600' },
                  { type: 'delay', label: '延迟等待', color: 'bg-zinc-600' },
                ].map(({ type, label, color }) => (
                  <Button
                    key={type}
                    size="sm"
                    className={`${color} text-white text-xs`}
                    onClick={() => {
                      const element = currentScene?.elements.find(el => el.id === showChoiceActionDialog?.elementId);
                      const currentActions = element?.clickActions || [];
                      const newAction: EventAction = {
                        id: genId(),
                        type: type as EventActionType,
                      };
                      updateElement({ clickActions: [...currentActions, newAction] });
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowChoiceActionDialog(null)} className="bg-purple-600">
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{/* 媒体导入弹窗 */}
      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent className="bg-zinc-800 border-zinc-600 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              导入{mediaType === 'image' ? '图片' : mediaType === 'video' ? '视频' : mediaType === 'panorama' ? '全景图' : mediaType === 'panoramaVideo' ? '全景视频' : '音频'}
            </DialogTitle>
            <DialogDescription className="text-zinc-300">
              选择上传方式
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* 文件上传 */}
            <div className="space-y-2">
              <Label className="text-sm">本地上传（最大 4MB）</Label>
              <div 
                className="border-2 border-dashed border-zinc-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = mediaType === 'audio' ? 'audio/*' : mediaType.includes('video') ? 'video/*' : 'image/*';
                  input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, mediaType);
                  input.click();
                }}
              >
                <Upload className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-sm text-zinc-300">点击选择文件</p>
                <p className="text-xs text-zinc-400 mt-1">
                  支持 {mediaType === 'audio' ? 'MP3, WAV, OGG' : mediaType.includes('video') ? 'MP4, WebM, MOV' : 'JPG, PNG, WebP'} 格式
                </p>
              </div>
              {(mediaType.includes('video') || mediaType === 'audio') && (
                <p className="text-xs text-amber-400">
                  💡 大于 4MB 的文件请压缩后上传，或使用下方「URL链接」导入外部资源
                </p>
              )}
            </div>

            {/* URL导入 */}
            <div className="space-y-2">
              <Label className="text-sm">URL链接导入（推荐大文件使用）</Label>
              <div className="flex gap-2">
                <Input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={mediaType === 'audio' ? '输入音频链接...' : '输入图片或视频链接...'}
                  className="bg-zinc-700 border-zinc-600"
                />
                <Button onClick={addMediaFromUrl} className="bg-purple-600 hover:bg-purple-700">
                  添加
                </Button>
              </div>
              <p className="text-xs text-zinc-400">
                支持外部图床、视频平台直链等
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 发布对话框 */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="bg-zinc-800 border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">发布作品</DialogTitle>
            <DialogDescription className="text-zinc-400">
              发布后作品将进入审核流程，审核通过后即可公开
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 作品描述 */}
            <div className="space-y-2">
              <Label className="text-zinc-300">作品描述</Label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="简要描述您的作品内容..."
                className="bg-zinc-700 border-zinc-600 text-zinc-300 min-h-[80px]"
              />
            </div>

            {/* 作品分类 */}
            <div className="space-y-2">
              <Label className="text-zinc-300">作品分类</Label>
              <Select value={projectCategory} onValueChange={setProjectCategory}>
                <SelectTrigger className="bg-zinc-700 border-zinc-600 text-zinc-300">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700 border-zinc-600">
                  <SelectItem value="horror">恐怖</SelectItem>
                  <SelectItem value="adventure">冒险</SelectItem>
                  <SelectItem value="campus">校园</SelectItem>
                  <SelectItem value="legal">普法</SelectItem>
                  <SelectItem value="romance">言情</SelectItem>
                  <SelectItem value="suspense">悬疑</SelectItem>
                  <SelectItem value="scifi">科幻</SelectItem>
                  <SelectItem value="fantasy">奇幻</SelectItem>
                  <SelectItem value="comedy">喜剧</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 价格设置 */}
            <div className="space-y-2">
              <Label className="text-zinc-300">观看价格（快乐豆）</Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 flex-1">
                  <span className="text-purple-400">💎</span>
                  <input
                    type="number"
                    value={beansPrice}
                    onChange={(e) => setBeansPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    max="9999"
                    className="bg-transparent text-white w-full outline-none"
                    placeholder="0"
                  />
                  <span className="text-zinc-400 text-sm">豆</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBeansPrice(0)}
                  className="border-zinc-600 text-zinc-400"
                >
                  免费
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                {beansPrice === 0 
                  ? '🆓 免费作品，所有用户均可观看'
                  : `💎 付费作品，观众购买后您可获得 ${Math.floor(beansPrice * 0.9)} 豆（90%）`
                }
              </p>
            </div>

            {/* 提示信息 */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-amber-300">
                ⚠️ 发布后作品将进入审核流程，审核通过后：
              </p>
              <ul className="text-xs text-zinc-400 mt-2 space-y-1">
                <li>• 作品将公开展示</li>
                <li>• 可获得发布奖励快乐豆</li>
                <li>• 付费作品可开始获得收入</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPublishDialog(false)}
              className="border-zinc-600 text-zinc-300 flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-1"
            >
              {isSharing ? (
                <>
                  <div className="w-4 h-4 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  发布中...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-1" />
                  确认发布
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分享对话框 */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-zinc-800 border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">发布成功</DialogTitle>
            <DialogDescription className="text-zinc-400">
              作品已提交审核，审核通过后将公开展示
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 审核状态 */}
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-300 font-medium">待审核</p>
                <p className="text-xs text-zinc-400">审核通过后将获得发布奖励</p>
              </div>
            </div>

            {/* 价格信息 */}
            <div className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg">
              <span className="text-zinc-300">观看价格</span>
              <span className={`font-medium ${beansPrice > 0 ? 'text-purple-400' : 'text-green-400'}`}>
                {beansPrice > 0 ? `💎 ${beansPrice} 豆` : '🆓 免费'}
              </span>
            </div>

            {/* 分类信息 */}
            <div className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg">
              <span className="text-zinc-300">作品分类</span>
              <span className="text-zinc-300 capitalize">{projectCategory}</span>
            </div>
            
            {/* 预览链接 */}
            <div className="space-y-2">
              <Label className="text-zinc-300">预览链接</Label>
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="bg-zinc-700 border-zinc-600 text-zinc-300"
                />
                <Button 
                  onClick={copyShareLink}
                  className={copySuccess ? 'bg-green-600 hover:bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}
                >
                  {copySuccess ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {copySuccess && (
                <p className="text-xs text-green-400">链接已复制到剪贴板</p>
              )}
            </div>

            <div className="pt-2 text-xs text-zinc-500">
              <p>💡 审核通过后作品将在首页展示</p>
              <p>💡 您可以在仪表盘查看审核状态</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowShareDialog(false)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
