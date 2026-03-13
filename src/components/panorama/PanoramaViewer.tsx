'use client';

import { useEffect, useRef, useState } from 'react';
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
  // 圆角
  borderRadius?: number;
}

interface PanoramaViewerProps {
  imageUrl: string;
  onHotspotClick?: (hotspotId: string) => void;
  hotspots?: Hotspot[];
  autoRotate?: boolean; // 是否自动旋转，默认 true
}

export default function PanoramaViewer({ imageUrl, onHotspotClick, hotspots = [], autoRotate = true }: PanoramaViewerProps) {
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
  const animationFrameId = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const autoRotateRef = useRef(autoRotate); // 使用 ref 存储 autoRotate 值

  // 更新 ref
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      console.log('PanoramaViewer: container is null');
      return;
    }

    // 防止重复初始化（React Strict Mode 会调用两次 useEffect）
    if (isInitialized.current) {
      console.log('PanoramaViewer: 已初始化，跳过');
      return;
    }
    isInitialized.current = true;

    // 确保容器有尺寸
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    console.log('PanoramaViewer: 容器初始尺寸=', width, 'x', height);
    
    // 如果容器尺寸为0，使用窗口尺寸
    if (width === 0 || height === 0) {
      width = window.innerWidth;
      height = window.innerHeight;
      console.log('PanoramaViewer: 使用窗口尺寸=', width, 'x', height);
    }

    console.log('PanoramaViewer: 初始化, imageUrl=', imageUrl?.substring(0, 80), ', autoRotate=', autoRotate);

    // 初始化场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // 设置黑色背景
    sceneRef.current = scene;

    // 初始化相机
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    camera.position.set(0, 0, 0.1); // 相机位置稍微偏移
    cameraRef.current = camera;

    // 初始化渲染器
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1); // 黑色背景
    
    // 清空容器并添加canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 让 Canvas 不拦截鼠标事件，事件由父容器处理
    renderer.domElement.style.pointerEvents = 'none';
    
    console.log('PanoramaViewer: 渲染器已创建, size=', width, 'x', height);

    // 动画循环 - 使用 requestAnimationFrame 方式
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      
      if (!camera || !renderer || !scene) return;

      // 只有在自动旋转开启且用户没有交互时才旋转
      if (autoRotateRef.current && !isUserInteracting.current) {
        lon.current += 0.05;
      }

      lat.current = Math.max(-85, Math.min(85, lat.current));
      phi.current = THREE.MathUtils.degToRad(90 - lat.current);
      theta.current = THREE.MathUtils.degToRad(lon.current);

      const x = 500 * Math.sin(phi.current) * Math.cos(theta.current);
      const y = 500 * Math.cos(phi.current);
      const z = 500 * Math.sin(phi.current) * Math.sin(theta.current);

      camera.lookAt(x, y, z);
      renderer.render(scene, camera);
    };
    
    // 启动动画循环
    animate();

    // 加载全景纹理
    const textureLoader = new THREE.TextureLoader();
    console.log('PanoramaViewer: 开始加载纹理, url=', imageUrl?.substring(0, 80));
    
    textureLoader.load(
      imageUrl, 
      (texture) => {
        console.log('PanoramaViewer: 纹理加载成功, 尺寸=', texture.image?.width, 'x', texture.image?.height);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        // 创建球体 - scale(-1, 1, 1) 反转x轴让法线指向内部，这样从内部看就能看到纹理
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
        
        const material = new THREE.MeshBasicMaterial({ 
          map: texture
          // 不需要 side: THREE.BackSide，因为 scale(-1, 1, 1) 已经让法线指向内部
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        console.log('PanoramaViewer: 球体已添加到场景');
        
        // 立即渲染一帧
        renderer.render(scene, camera);
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log('PanoramaViewer: 加载进度', percent + '%');
        }
      },
      (error) => {
        console.error('PanoramaViewer: 纹理加载失败', error);
        // 创建一个简单的测试球体 - 橙色
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ 
          color: 0xff6600
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        renderer.render(scene, camera);
      }
    );

    // 创建热点标记
    hotspots.forEach((hotspot) => {
      const sprite = createHotspotSprite(hotspot);
      sprite.position.set(hotspot.position.x, hotspot.position.y, hotspot.position.z);
      sprite.userData = { id: hotspot.id };
      scene.add(sprite);
      hotspotSprites.current.push(sprite);
    });

    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0 && camera && renderer) {
          console.log('PanoramaViewer: ResizeObserver 触发, 新尺寸=', newWidth, 'x', newHeight);
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

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

    // 清理函数
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', onWindowResize);
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      isInitialized.current = false;
    };
  }, [imageUrl, hotspots]);

  // 创建热点精灵
  const createHotspotSprite = (hotspot: Hotspot): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;

    // 使用样式属性
    const bgColor = hotspot.backgroundColor || 'rgba(0, 0, 0, 0.7)';
    const textColor = hotspot.color || 'white';
    const opacity = hotspot.opacity !== undefined ? hotspot.opacity : 1;
    const borderColor = hotspot.borderColor;
    const borderWidth = hotspot.borderWidth || 0;
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
    if (borderColor && borderWidth > 0) {
      context.strokeStyle = borderColor;
      context.lineWidth = borderWidth * 2;
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
    console.log('PanoramaViewer: onPointerDown');
    isUserInteracting.current = true;
    onPointerDownMouseX.current = event.clientX;
    onPointerDownMouseY.current = event.clientY;
    onPointerDownLon.current = lon.current;
    onPointerDownLat.current = lat.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!isUserInteracting.current) return;

    lon.current = (onPointerDownMouseX.current - event.clientX) * 0.1 + onPointerDownLon.current;
    lat.current = (event.clientY - onPointerDownMouseY.current) * 0.1 + onPointerDownLat.current;
  };

  const onPointerUp = (event: React.PointerEvent) => {
    console.log('PanoramaViewer: onPointerUp');
    isUserInteracting.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onWheel = (event: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const fov = cameraRef.current.fov + event.deltaY * 0.05;
    cameraRef.current.fov = THREE.MathUtils.clamp(fov, 10, 75);
    cameraRef.current.updateProjectionMatrix();
  };

  // 点击检测
  const onClick = (event: React.MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(hotspotSprites.current);

    if (intersects.length > 0) {
      const hotspotId = intersects[0].object.userData.id;
      onHotspotClick?.(hotspotId);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onClick={onClick}
    >
      {/* Canvas 会在这里被 Three.js 添加 */}
    </div>
  );
}
