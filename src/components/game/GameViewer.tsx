'use client';

import { useState, useEffect, useCallback } from 'react';
import TransparentVideo from '@/components/ui/transparent-video';
import { Check, Heart } from 'lucide-react';

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

// 计算背景颜色（带透明度）
function getBackgroundColor(element: any): string {
  // 图片和透明视频使用透明背景
  if (element.type === 'image' || (element.type === 'video' && element.enableTransparency !== false)) {
    return 'transparent';
  }
  // 血条和选择项使用透明背景
  if (element.type === 'healthBar' || element.type === 'choiceItem') {
    return 'transparent';
  }
  
  const bgColor = element.backgroundColor || 'transparent';
  const bgOpacity = element.backgroundOpacity ?? 1;
  
  if (bgColor === 'transparent' || bgOpacity === 0) return 'transparent';
  if (bgOpacity === 1) return bgColor;
  
  // 如果已经是 rgba 格式，直接修改 alpha
  if (bgColor.startsWith('rgba')) {
    return bgColor.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/, `rgba($1, $2, $3, ${bgOpacity})`);
  }
  
  return hexToRgba(bgColor, bgOpacity);
}

interface Scene {
  id: string;
  name: string;
  elements: any[];
  panoramaImage?: string;
  panoramaVideo?: string;
  backgroundType?: 'color' | 'image' | 'video' | 'panorama' | 'panoramaVideo';
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
}

interface GameViewerProps {
  scenes: Scene[];
  canvasWidth?: number;
  canvasHeight?: number;
  globalVariables?: any[];
}

export function GameViewer({ 
  scenes, 
  canvasWidth = 1920, 
  canvasHeight = 1080,
  globalVariables = [] 
}: GameViewerProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 血条状态管理 - 存储每个血条的当前血量
  const [healthValues, setHealthValues] = useState<Record<string, number>>({});
  
  // 反馈消息
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const currentScene = scenes[currentSceneIndex];

  // 初始化血条状态
  useEffect(() => {
    const initialHealth: Record<string, number> = {};
    scenes.forEach(scene => {
      scene.elements?.forEach((element: any) => {
        if (element.type === 'healthBar') {
          initialHealth[element.id] = element.healthValue ?? element.maxHealth ?? 100;
        }
      });
    });
    setHealthValues(initialHealth);
  }, [scenes]);

  // 处理场景切换
  const handleSceneChange = (sceneId: string) => {
    const index = scenes.findIndex(s => s.id === sceneId);
    if (index !== -1 && index !== currentSceneIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSceneIndex(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // 更新血条血量
  const updateHealth = useCallback((healthBarId: string, change: number) => {
    setHealthValues(prev => {
      const currentValue = prev[healthBarId] ?? 100;
      const element = scenes.flatMap(s => s.elements || []).find((e: any) => e.id === healthBarId);
      const maxHealth = element?.maxHealth ?? 100;
      const newValue = Math.max(0, Math.min(maxHealth, currentValue + change));
      return { ...prev, [healthBarId]: newValue };
    });
  }, [scenes]);

  // 处理选择项点击
  const handleChoiceClick = useCallback((element: any) => {
    const isCorrect = element.isCorrectChoice;
    
    // 显示反馈消息
    setFeedbackMessage({
      text: isCorrect ? (element.correctFeedback || '回答正确！') : (element.wrongFeedback || '回答错误！'),
      type: isCorrect ? 'success' : 'error',
    });
    
    // 3秒后隐藏反馈消息
    setTimeout(() => setFeedbackMessage(null), 3000);
    
    // 更新关联血条
    if (element.targetHealthBarId) {
      const healthChange = isCorrect 
        ? (element.healthChangeOnCorrect || 0) 
        : -(element.healthChangeOnWrong || 0);
      updateHealth(element.targetHealthBarId, healthChange);
    }
  }, [updateHealth]);

  // 执行事件动作
  const executeActions = useCallback((actions: any[]) => {
    actions.forEach((action: any) => {
      switch (action.type) {
        case 'addHealth':
          if (action.targetElementId) {
            updateHealth(action.targetElementId, action.value || 10);
          }
          break;
        case 'reduceHealth':
          if (action.targetElementId) {
            updateHealth(action.targetElementId, -(action.value || 10));
          }
          break;
        case 'setHealth':
          if (action.targetElementId) {
            setHealthValues(prev => ({
              ...prev,
              [action.targetElementId]: action.value ?? 100,
            }));
          }
          break;
        case 'jumpScene':
          if (action.targetSceneId) {
            handleSceneChange(action.targetSceneId);
          }
          break;
        // 其他动作类型可以在这里添加
      }
    });
  }, [updateHealth, handleSceneChange]);

  // 处理元素点击事件
  const handleElementClick = useCallback((element: any) => {
    // 如果是选择项，使用特殊逻辑
    if (element.type === 'choiceItem') {
      handleChoiceClick(element);
      return;
    }
    
    // 执行元素的事件动作
    if (element.events && element.events.length > 0) {
      const clickEvent = element.events.find((e: any) => e.type === 'click');
      if (clickEvent && clickEvent.actions) {
        executeActions(clickEvent.actions);
      }
    }
  }, [handleChoiceClick, executeActions]);

  // 计算缩放比例
  useEffect(() => {
    const updateScale = () => {
      const container = document.getElementById('game-container');
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scaleX = containerWidth / canvasWidth;
      const scaleY = containerHeight / canvasHeight;
      const scale = Math.min(scaleX, scaleY);

      container.style.setProperty('--scale', `${scale}`);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasWidth, canvasHeight]);

  if (!currentScene) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">场景加载失败</p>
      </div>
    );
  }

  return (
    <div 
      id="game-container"
      className="w-screen h-screen overflow-hidden bg-black relative"
      style={{
        '--scale': '1',
      } as any}
    >
      {/* 画布 */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center transition-opacity duration-300"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `translate(-50%, -50%) scale(var(--scale))`,
          opacity: isTransitioning ? 0 : 1,
        }}
      >
        {/* 背景 */}
        <div className="absolute inset-0">
          {currentScene.backgroundType === 'color' && (
            <div 
              className="w-full h-full"
              style={{ backgroundColor: currentScene.backgroundColor || '#1a1a2e' }}
            />
          )}
          {currentScene.backgroundType === 'image' && currentScene.backgroundImage && (
            <img 
              src={currentScene.backgroundImage}
              alt="背景"
              className="w-full h-full object-cover"
            />
          )}
          {currentScene.backgroundType === 'video' && currentScene.backgroundVideo && (
            <video 
              src={currentScene.backgroundVideo}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
        </div>

        {/* 元素层 */}
        <div className="absolute inset-0 pointer-events-none">
          {currentScene.elements?.map((element: any) => {
            // 计算锚点偏移
            let offsetX = 0;
            let offsetY = 0;
            let transformOrigin = '50% 50%';
            
            if (element.anchorX !== undefined && element.anchorY !== undefined) {
              offsetX = (element.anchorX / 100) * element.width;
              offsetY = (element.anchorY / 100) * element.height;
              transformOrigin = `${element.anchorX}% ${element.anchorY}%`;
            } else if (element.anchorPoint) {
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
            }
            
            // 将像素值转换为百分比（减去锚点偏移）
            const xPercent = ((element.x - offsetX) / canvasWidth) * 100;
            const yPercent = ((element.y - offsetY) / canvasHeight) * 100;
            const widthPercent = (element.width / canvasWidth) * 100;
            const heightPercent = (element.height / canvasHeight) * 100;
            
            // 计算文字阴影
            const textShadow = element.shadowColor && element.shadowColor !== 'transparent' 
              ? `${element.shadowOffsetX || 0}px ${element.shadowOffsetY || 0}px ${element.shadowBlur || 0}px ${element.shadowColor}`
              : undefined;
            
            // 计算文字描边
            const textStroke = element.textStrokeSize && element.textStrokeSize > 0
              ? `${element.textStrokeSize}px ${element.textStrokeColor || '#000000'}`
              : undefined;
            
            return (
            <div
              key={element.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                zIndex: currentScene.elements.indexOf(element) + 10,
                opacity: element.opacity ?? 1,
                transform: `rotate(${element.rotation || 0}deg) scale(${element.scale || 1})`,
                transformOrigin: transformOrigin,
              }}
            >
              {/* 按钮 */}
              {element.type === 'button' && (
                <button
                  className="w-full h-full text-white rounded-lg text-sm font-medium transition-colors hover:opacity-80 active:scale-95"
                  style={{
                    backgroundColor: getBackgroundColor(element),
                    fontSize: `${element.fontSize || 14}px`,
                    borderRadius: `${element.borderRadius || 8}px`,
                    color: element.color || '#ffffff',
                    textShadow: textShadow,
                    WebkitTextStroke: textStroke,
                  }}
                  onClick={() => handleElementClick(element)}
                >
                  {element.content || element.text || '按钮'}
                </button>
              )}

              {/* 文本 */}
              {element.type === 'text' && (
                <p
                  className="w-full h-full"
                  style={{
                    backgroundColor: getBackgroundColor(element),
                    color: element.color || '#ffffff',
                    fontSize: `${element.fontSize || 16}px`,
                    fontWeight: element.fontWeight || '500',
                    fontFamily: element.fontFamily || 'inherit',
                    textAlign: element.textAlign || 'center',
                    lineHeight: element.lineHeight || 1.5,
                    borderRadius: `${element.borderRadius || 0}px`,
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: element.textAlign === 'left' ? 'flex-start' : element.textAlign === 'right' ? 'flex-end' : 'center',
                    textShadow: textShadow,
                    WebkitTextStroke: textStroke,
                  }}
                >
                  {element.content || element.text || '文本内容'}
                </p>
              )}

              {/* 图片 */}
              {element.type === 'image' && element.src && (
                <img
                  src={element.src}
                  alt={element.name || '图片'}
                  className="w-full h-full object-contain"
                />
              )}

              {/* 视频 */}
              {element.type === 'video' && element.src && (
                <TransparentVideo
                  src={element.src}
                  className="w-full h-full"
                  objectFit={element.objectFit || 'contain'}
                  loop={element.loop ?? false}
                  muted={element.muted ?? true}
                  autoplay={element.autoplay ?? false}
                  controls={element.controls ?? true}
                  playsInline
                  enableTransparency={element.enableTransparency !== false}
                />
              )}

              {/* 面板 */}
              {element.type === 'panel' && (
                <div
                  className="w-full h-full p-2"
                  style={{
                    backgroundColor: getBackgroundColor(element),
                    borderRadius: `${element.borderRadius || 8}px`,
                    border: element.borderColor ? `1px solid ${element.borderColor}` : 'none',
                  }}
                >
                  {element.content}
                </div>
              )}

              {/* 血条 */}
              {element.type === 'healthBar' && (() => {
                const currentHealth = healthValues[element.id] ?? element.healthValue ?? 100;
                const maxHealth = element.maxHealth ?? 100;
                const healthPercent = (currentHealth / maxHealth) * 100;
                const isLowHealth = healthPercent <= (element.lowHealthThreshold ?? 30);
                const barColor = isLowHealth 
                  ? (element.lowHealthColor || '#EF4444') 
                  : (element.healthBarColor || '#22C55E');
                const scale = canvasWidth / 1920; // 缩放比例
                
                return (
                  <div 
                    className="w-full h-full flex items-center gap-2"
                    style={{ padding: `${4 * scale}px` }}
                  >
                    {/* 心形图标 */}
                    <Heart 
                      className="shrink-0" 
                      style={{ 
                        width: `${16 * scale}px`, 
                        height: `${16 * scale}px`,
                        color: barColor,
                        fill: barColor,
                      }} 
                    />
                    {/* 血条背景 */}
                    <div 
                      className="flex-1 h-full rounded overflow-hidden relative"
                      style={{ 
                        backgroundColor: element.healthBarBgColor || '#374151',
                        borderRadius: `${4 * scale}px`,
                      }}
                    >
                      {/* 当前血量 */}
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${healthPercent}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                    {/* 血量文字 */}
                    {element.showHealthText !== false && (
                      <span 
                        className="shrink-0 font-medium"
                        style={{ 
                          color: element.color || '#FFFFFF', 
                          fontSize: `${12 * scale}px`,
                          minWidth: `${50 * scale}px`,
                          textAlign: 'right',
                        }}
                      >
                        {currentHealth}/{maxHealth}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* 选择项 */}
              {element.type === 'choiceItem' && (() => {
                const scale = canvasWidth / 1920;
                return (
                  <button
                    className="w-full h-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all rounded-lg border-2 border-white/30 cursor-pointer"
                    style={{
                      borderRadius: `${8 * scale}px`,
                      border: `${2 * scale}px solid rgba(255,255,255,0.3)`,
                    }}
                    onClick={() => handleChoiceClick(element)}
                  >
                    <div 
                      className={`rounded border-2 flex items-center justify-center shrink-0 ${
                        element.isCorrectChoice ? 'border-green-400' : 'border-zinc-400'
                      }`}
                      style={{
                        width: `${16 * scale}px`,
                        height: `${16 * scale}px`,
                        borderWidth: `${2 * scale}px`,
                      }}
                    >
                      {element.isCorrectChoice && (
                        <Check style={{ width: `${12 * scale}px`, height: `${12 * scale}px`, color: '#22C55E' }} />
                      )}
                    </div>
                    <span 
                      className="font-medium truncate"
                      style={{ 
                        fontSize: `${14 * scale}px`,
                        color: element.color || '#E5E7EB',
                      }}
                    >
                      {element.content || '选项文字'}
                    </span>
                  </button>
                );
              })()}
            </div>
          );})}
        </div>
      </div>

      {/* 转场动画 */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black z-50" />
      )}

      {/* 反馈消息 */}
      {feedbackMessage && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-4 rounded-xl text-xl font-bold animate-bounce"
          style={{
            backgroundColor: feedbackMessage.type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {feedbackMessage.text}
        </div>
      )}
    </div>
  );
}

export default GameViewer;
