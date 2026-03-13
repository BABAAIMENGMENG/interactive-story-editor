'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface Hotspot {
  id: string;
  position: { x: number; y: number; z: number };
  label: string;
  // 样式属性
  backgroundColor?: string;
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  // 图标
  iconName?: string;
  // 变换
  rotation?: number;
  scale?: number;
  // 文字大小
  fontSize?: number;
  // 圆角（0-100的百分比值）
  borderRadius?: number;
}

interface EditorPanoramaViewerProps {
  imageUrl: string;
  hotspots?: Hotspot[];
  onHotspotClick?: (hotspotId: string) => void;
  onHotspotAdd?: (position: { x: number; y: number; z: number }) => void;
  isHotspotMode?: boolean;
}

export default function EditorPanoramaViewer({
  imageUrl,
  hotspots = [],
  onHotspotClick,
  onHotspotAdd,
  isHotspotMode = false,
}: EditorPanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
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
  const hasDragged = useRef(false);
  const pointerDownTime = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // 获取容器尺寸，如果为0则使用默认值
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    // 如果容器尺寸为0，尝试使用计算样式或默认值
    if (width === 0 || height === 0) {
      const style = window.getComputedStyle(container);
      width = parseInt(style.width) || 1920;
      height = parseInt(style.height) || 1080;
    }

    // 清理旧的渲染器
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
    }

    // 初始化场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 初始化相机 - 使用容器尺寸
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    // 初始化渲染器 - 使用容器尺寸
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 加载全景纹理
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;

      // 创建球体
      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);

      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    });

    // 容器尺寸变化监听
    const resizeObserver = new ResizeObserver((entries) => {
      if (!cameraRef.current || !rendererRef.current) return;
      const entry = entries[0];
      if (entry) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    // 动画循环
    const animate = () => {
      if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;

      if (isUserInteracting.current === false) {
        // 编辑器模式下不自动旋转
        // lon.current += 0.02;
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
      resizeObserver.disconnect();
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [imageUrl]);

  // 更新热点
  useEffect(() => {
    if (!sceneRef.current) return;

    // 移除旧的热点
    hotspotSprites.current.forEach(sprite => {
      sceneRef.current?.remove(sprite);
    });
    hotspotSprites.current = [];

    // 添加新的热点
    hotspots.forEach((hotspot) => {
      const sprite = createHotspotSprite(hotspot);
      sprite.position.set(hotspot.position.x, hotspot.position.y, hotspot.position.z);
      sprite.userData = { id: hotspot.id };
      sceneRef.current?.add(sprite);
      hotspotSprites.current.push(sprite);
    });
  }, [hotspots]);

  // 创建热点精灵
  const createHotspotSprite = (hotspot: Hotspot): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;

    // 解析背景颜色
    const bgColor = hotspot.backgroundColor || 'rgba(139, 92, 246, 0.8)';
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

    // 绘制背景
    context.globalAlpha = opacity;
    context.fillStyle = bgColor;
    context.beginPath();
    context.roundRect(0, 0, 256, 128, borderRadius);
    context.fill();

    // 绘制边框
    if (hotspot.borderWidth && hotspot.borderWidth > 0 && hotspot.borderColor) {
      context.strokeStyle = hotspot.borderColor;
      context.lineWidth = hotspot.borderWidth * 2;
      context.stroke();
    }

    // 绘制图标和文字
    context.globalAlpha = 1;
    context.fillStyle = textColor;
    
    if (hasIcon && hotspot.label) {
      // 有图标也有文字
      context.font = `bold ${Math.round(fontSize * 0.875)}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`${iconSymbol} ${hotspot.label}`, 128, 64);
    } else if (hasIcon) {
      // 只有图标
      context.font = `bold ${Math.round(fontSize * 1.5)}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(iconSymbol, 128, 64);
    } else {
      // 只有文字
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
    event.stopPropagation(); // 阻止事件冒泡到画布
    event.preventDefault();
    isUserInteracting.current = true;
    hasDragged.current = false;
    pointerDownTime.current = Date.now();
    onPointerDownMouseX.current = event.clientX;
    onPointerDownMouseY.current = event.clientY;
    onPointerDownLon.current = lon.current;
    onPointerDownLat.current = lat.current;
  };

  const onPointerMove = (event: React.PointerEvent) => {
    event.stopPropagation(); // 阻止事件冒泡到画布
    
    const dx = Math.abs(event.clientX - onPointerDownMouseX.current);
    const dy = Math.abs(event.clientY - onPointerDownMouseY.current);
    if (dx > 5 || dy > 5) {
      hasDragged.current = true;
    }

    if (!isUserInteracting.current) return;

    lon.current = (onPointerDownMouseX.current - event.clientX) * 0.1 + onPointerDownLon.current;
    lat.current = (event.clientY - onPointerDownMouseY.current) * 0.1 + onPointerDownLat.current;
  };

  const onPointerUp = (event?: React.PointerEvent) => {
    if (event) {
      event.stopPropagation();
    }
    isUserInteracting.current = false;
  };

  const onWheel = (event: React.WheelEvent) => {
    event.stopPropagation(); // 阻止事件冒泡到画布
    if (!cameraRef.current) return;
    const fov = cameraRef.current.fov + event.deltaY * 0.05;
    cameraRef.current.fov = THREE.MathUtils.clamp(fov, 10, 75);
    cameraRef.current.updateProjectionMatrix();
  };

  // 点击事件 - 添加热点或选择热点
  const onClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡到画布
    
    // 检查是否是拖拽
    if (hasDragged.current) return;
    
    // 检查是否是快速点击（小于200ms）
    const clickDuration = Date.now() - pointerDownTime.current;
    if (clickDuration > 200) return;

    if (!cameraRef.current || !sceneRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 使用容器尺寸计算鼠标位置
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);

    // 如果是热点模式，添加热点
    if (isHotspotMode) {
      // 计算射线与球体的交点
      const sphereRadius = 500;
      const direction = new THREE.Vector3();
      raycaster.ray.direction.normalize();
      direction.copy(raycaster.ray.direction);

      // 热点位置在球体表面
      const hotspotPosition = {
        x: direction.x * sphereRadius * 0.9,
        y: direction.y * sphereRadius * 0.9,
        z: direction.z * sphereRadius * 0.9,
      };

      onHotspotAdd?.(hotspotPosition);
      return;
    }

    // 否则检查是否点击了热点
    const intersects = raycaster.intersectObjects(hotspotSprites.current);
    if (intersects.length > 0) {
      const hotspotId = intersects[0].object.userData.id;
      onHotspotClick?.(hotspotId);
    }
  }, [isHotspotMode, onHotspotAdd, onHotspotClick]);

  // 获取当前视角
  const getCurrentViewDirection = useCallback(() => {
    return {
      lon: lon.current,
      lat: lat.current,
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-20 ${isHotspotMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onClick={onClick}
    >
      {/* 热点模式提示 */}
      {isHotspotMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-600/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm z-50 pointer-events-none">
          点击全景图添加热点
        </div>
      )}
      
      {/* 操作提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm z-50 pointer-events-none">
        拖拽旋转 | 滚轮缩放
      </div>
    </div>
  );
}
