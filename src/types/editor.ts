// 元素类型
export type ElementType =
  | 'button'
  | 'text'
  | 'image'
  | 'hotspot'
  | 'panel'
  | 'video'
  | 'audio'
  | 'shape';

// 元素样式
export interface ElementStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  boxShadow?: string;
  padding?: number;
}

// 动画类型
export interface Animation {
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'scale' | 'bounce' | 'rotate' | 'pulse';
  duration: number;
  delay: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

// 事件类型
export type EventType =
  | 'click'
  | 'hover'
  | 'longPress'
  | 'doubleClick'
  | 'touchStart'
  | 'touchEnd';

// 动作类型
export type ActionType =
  | 'jumpScene'
  | 'showElement'
  | 'hideElement'
  | 'toggleElement'
  | 'playAudio'
  | 'pauseAudio'
  | 'playVideo'
  | 'pauseVideo'
  | 'startAnimation'
  | 'delay'
  | 'custom';

// 事件动作
export interface EventAction {
  type: ActionType;
  targetId?: string;
  targetSceneId?: string;
  animationId?: string;
  audioUrl?: string;
  delay?: number;
  customCode?: string;
}

// 元素事件
export interface ElementEvent {
  id: string;
  type: EventType;
  actions: EventAction[];
}

// 画布元素
export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  style: ElementStyle;
  content?: string;
  src?: string;
  animations: Animation[];
  events: ElementEvent[];
  children?: CanvasElement[];
}

// 场景
export interface Scene {
  id: string;
  name: string;
  thumbnail?: string;
  panoramaImage?: string;
  backgroundAudio?: string;
  backgroundColor?: string;
  elements: CanvasElement[];
  transition?: 'fade' | 'slide' | 'zoom' | 'none';
  transitionDuration?: number;
}

// 项目
export interface Project {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  scenes: Scene[];
  globalVariables: Record<string, any>;
  settings: {
    width: number;
    height: number;
    fps: number;
  };
}
