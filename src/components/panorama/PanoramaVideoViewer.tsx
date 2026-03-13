'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// 流媒体网站域名列表
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

// 验证视频URL
function validateVideoUrl(url: string | undefined | null): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: false, error: '无效的视频链接' };
  }
  
  if (url.startsWith('blob:')) {
    return { isValid: false, error: '无效的临时链接' };
  }
  
  const isValidFormat = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  if (!isValidFormat) {
    return { isValid: false, error: '无效的URL格式' };
  }
  
  // 流媒体网站检查
  try {
    const urlObj = new URL(url, url.startsWith('/') ? 'http://localhost' : undefined);
    const hostname = urlObj.hostname.toLowerCase();
    
    for (const domain of STREAMING_SITE_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return { isValid: false, error: '流媒体网站链接不可用，请使用直链视频地址' };
      }
    }
  } catch {
    // URL解析失败，继续验证
  }
  
  return { isValid: true };
}

interface PanoramaVideoViewerProps {
  videoUrl: string;
  onHotspotClick?: (hotspotId: string) => void;
  hotspots?: Array<{
    id: string;
    position: { x: number; y: number; z: number };
    label: string;
    backgroundColor?: string;
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
    iconName?: string;
    rotation?: number;
    scale?: number;
    fontSize?: number;
    borderRadius?: number;
  }>;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export default function PanoramaVideoViewer({
  videoUrl,
  onHotspotClick,
  hotspots = [],
  autoPlay = true,
  loop = true,
  muted = true,
}: PanoramaVideoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);
  const isUserInteracting = useRef(false);
  const lon = useRef(0);
  const lat = useRef(0);
  const onPointerDownLon = useRef(0);
  const onPointerDownLat = useRef(0);
  const onPointerDownMouseX = useRef(0);
  const onPointerDownMouseY = useRef(0);
  const phi = useRef(0);
  const theta = useRef(0);

  const hotspotSprites = useRef<THREE.Sprite[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    
    // 使用新的验证函数检查视频URL
    const validation = validateVideoUrl(videoUrl);
    if (!validation.isValid) {
      setError(validation.error || '无效的视频链接');
      return;
    }

    // 初始化场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 初始化相机
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    // 初始化渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 创建视频元素
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.loop = loop;
    video.muted = isMuted;
    video.playsInline = true;
    
    // 添加错误处理
    video.onerror = () => {
      console.warn('全景视频无法加载:', videoUrl?.substring(0, 50) + '...');
      setError('视频加载失败');
    };
    
    videoRef.current = video;

    // 创建视频纹理
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    textureRef.current = texture;

    // 创建球体
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 自动播放
    if (autoPlay) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }

    // 创建热点标记
    hotspots.forEach((hotspot) => {
      const sprite = createHotspotSprite(hotspot);
      sprite.position.set(hotspot.position.x, hotspot.position.y, hotspot.position.z);
      sprite.userData = { id: hotspot.id };
      scene.add(sprite);
      hotspotSprites.current.push(sprite);
    });

    // 窗口大小调整
    const onWindowResize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // 动画循环
    const animate = () => {
      if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;

      if (isUserInteracting.current === false) {
        lon.current += 0.02;
      }

      lat.current = Math.max(-85, Math.min(85, lat.current));
      phi.current = THREE.MathUtils.degToRad(90 - lat.current);
      theta.current = THREE.MathUtils.degToRad(lon.current);

      const x = 500 * Math.sin(phi.current) * Math.cos(theta.current);
      const y = 500 * Math.cos(phi.current);
      const z = 500 * Math.sin(phi.current) * Math.sin(theta.current);

      cameraRef.current.lookAt(x, y, z);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    renderer.setAnimationLoop(animate);

    // 清理函数
    return () => {
      window.removeEventListener('resize', onWindowResize);
      renderer.dispose();
      if (textureRef.current) {
        textureRef.current.dispose();
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [videoUrl, hotspots, autoPlay, loop, isMuted]);

  // 如果有错误，不渲染任何内容
  if (error) {
    return null;
  }

  // 创建热点精灵
  const createHotspotSprite = (hotspot: {
    label: string;
    backgroundColor?: string;
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
    iconName?: string;
    rotation?: number;
    scale?: number;
    fontSize?: number;
    borderRadius?: number;
  }): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;

    const bgColor = hotspot.backgroundColor || 'rgba(0, 0, 0, 0.7)';
    const textColor = hotspot.color || 'white';
    const opacity = hotspot.opacity ?? 1;
    const fontSize = hotspot.fontSize || 32;
    const borderRadius = hotspot.borderRadius ?? 16;

    // 图标映射 - 使用Unicode符号
    const iconMap: Record<string, string> = {
      '箭头': '→',
      '星星': '★',
      '爱心': '♥',
      '对号': '✓',
      '太阳': '☀',
      '月亮': '☽',
      '点赞': '👍',
      '播放': '▶',
    };

    const iconSymbol = hotspot.iconName ? iconMap[hotspot.iconName] || '' : '';
    const hasIcon = !!iconSymbol;

    context.globalAlpha = opacity;
    context.fillStyle = bgColor;
    context.beginPath();
    context.roundRect(0, 0, 256, 128, borderRadius);
    context.fill();

    if (hotspot.borderColor && hotspot.borderWidth && hotspot.borderWidth > 0) {
      context.strokeStyle = hotspot.borderColor;
      context.lineWidth = hotspot.borderWidth * 2;
      context.stroke();
    }

    context.globalAlpha = 1;
    context.fillStyle = textColor;

    if (hasIcon && hotspot.label) {
      context.font = `bold ${Math.round(fontSize * 0.875)}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`${iconSymbol} ${hotspot.label}`, 128, 64);
    } else if (hasIcon) {
      context.font = `bold ${Math.round(fontSize * 1.5)}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(iconSymbol, 128, 64);
    } else {
      context.font = `bold ${fontSize}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(hotspot.label, 128, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    
    // 应用缩放
    const scale = hotspot.scale ?? 1;
    sprite.scale.set(50 * scale, 25 * scale, 1);
    
    // 应用旋转（Three.js使用弧度）
    if (hotspot.rotation) {
      sprite.material.rotation = (hotspot.rotation * Math.PI) / 180;
    }

    return sprite;
  };

  // 鼠标/触摸交互
  const onPointerDown = (event: React.PointerEvent) => {
    isUserInteracting.current = true;
    onPointerDownMouseX.current = event.clientX;
    onPointerDownMouseY.current = event.clientY;
    onPointerDownLon.current = lon.current;
    onPointerDownLat.current = lat.current;
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!isUserInteracting.current) return;

    lon.current = (onPointerDownMouseX.current - event.clientX) * 0.1 + onPointerDownLon.current;
    lat.current = (event.clientY - onPointerDownMouseY.current) * 0.1 + onPointerDownLat.current;
  };

  const onPointerUp = () => {
    isUserInteracting.current = false;
  };

  const onWheel = (event: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const fov = cameraRef.current.fov + event.deltaY * 0.05;
    cameraRef.current.fov = THREE.MathUtils.clamp(fov, 10, 75);
    cameraRef.current.updateProjectionMatrix();
  };

  // 点击检测
  const onClick = (event: React.MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(hotspotSprites.current);

    if (intersects.length > 0) {
      const hotspotId = intersects[0].object.userData.id;
      onHotspotClick?.(hotspotId);
    }
  };

  // 播放/暂停控制
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 静音控制
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onClick={onClick}
    >
      {/* 控制按钮 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        <button
          onClick={togglePlay}
          className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-colors"
        >
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button
          onClick={toggleMute}
          className="bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-colors"
        >
          {isMuted ? '取消静音' : '静音'}
        </button>
      </div>
    </div>
  );
}
