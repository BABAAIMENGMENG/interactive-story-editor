"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Pause, 
  Play, 
  X, 
  File, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Link2,
  Zap,
  HardDrive,
  Globe
} from "lucide-react";
import { useChunkedUpload, UploadTask } from "@/hooks/useChunkedUpload";
import { isElectron, selectLocalFiles, importFile, LocalFile } from "@/lib/localFileService";

type MediaType = 'image' | 'video' | 'panorama' | 'panoramaVideo' | 'audio';

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaType: MediaType;
  onUploadComplete: (result: { fileUrl: string; fileName: string; fileSize: number; isLocal?: boolean }) => void;
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// 格式化速度
function formatSpeed(bytesPerSecond: number): string {
  return `${formatSize(bytesPerSecond)}/s`;
}

// 格式化时间
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "--:--";
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${Math.round(seconds % 60)}秒`;
  return `${Math.floor(seconds / 3600)}小时${Math.round((seconds % 3600) / 60)}分`;
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  mediaType,
  onUploadComplete,
}: MediaUploadDialogProps) {
  const [url, setUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // 追踪已处理的上传结果，避免重复调用 onUploadComplete
  const processedResultsRef = useRef<Set<string>>(new Set());
  
  // 在线版本使用分片上传
  const { 
    tasks, 
    results,
    addTask,
    startUpload, 
    pauseUpload, 
    resumeUpload, 
    cancelUpload, 
    clearCompleted,
  } = useChunkedUpload();

  // 检测运行环境
  useEffect(() => {
    setIsDesktop(isElectron());
  }, []);

  // 弹窗打开时重置已处理结果的追踪
  useEffect(() => {
    if (open) {
      processedResultsRef.current.clear();
    }
  }, [open]);

  // 获取媒体类型对应的文件 accept
  const getAccept = useCallback(() => {
    switch (mediaType) {
      case 'audio':
        return 'audio/*';
      case 'video':
      case 'panoramaVideo':
        return 'video/*';
      case 'image':
      case 'panorama':
      default:
        return 'image/*';
    }
  }, [mediaType]);

  // 获取媒体类型名称
  const getMediaTypeName = useCallback(() => {
    switch (mediaType) {
      case 'image': return '图片';
      case 'video': return '视频';
      case 'panorama': return '全景图';
      case 'panoramaVideo': return '全景视频';
      case 'audio': return '音频';
    }
  }, [mediaType]);

  // 处理文件选择
  const handleFiles = useCallback(async (files: FileList | LocalFile[]) => {
    // Electron 环境：直接导入本地文件
    if (isDesktop) {
      for (const file of files) {
        const localFile = 'path' in file ? file : {
          path: (file as File).name,
          name: file.name,
          size: file.size,
          ext: '.' + file.name.split('.').pop(),
          type: mediaType === 'audio' ? 'audio' : mediaType.includes('video') ? 'video' : 'image',
        };
        
        const result = await importFile(localFile as LocalFile);
        
        if (result.success) {
          onUploadComplete({
            fileUrl: result.url,
            fileName: result.name,
            fileSize: result.size,
            isLocal: result.isLocal,
          });
        }
      }
      return;
    }

    // 浏览器环境：使用分片上传
    const fileArray = Array.from(files as FileList);
    for (const file of fileArray) {
      const taskId = await addTask(file);
      startUpload(taskId);
    }
  }, [isDesktop, mediaType, addTask, startUpload, onUploadComplete]);

  // 监听上传完成（仅浏览器环境）
  useEffect(() => {
    if (isDesktop) return;
    
    for (const result of results) {
      // 跳过已处理的结果
      if (processedResultsRef.current.has(result.id)) continue;
      
      const task = tasks.find(t => t.id === result.id);
      if (task?.status === 'completed') {
        // 标记为已处理
        processedResultsRef.current.add(result.id);
        
        onUploadComplete({
          fileUrl: result.fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          isLocal: false,
        });
      }
    }
  }, [isDesktop, results, tasks, onUploadComplete]);

  // 添加 URL
  const handleAddUrl = useCallback(() => {
    if (!url.trim()) return;
    
    onUploadComplete({
      fileUrl: url.trim(),
      fileName: url.split('/').pop() || '外部资源',
      fileSize: 0,
      isLocal: false,
    });
    
    setUrl("");
    onOpenChange(false);
  }, [url, onUploadComplete, onOpenChange]);

  // 打开系统文件选择器
  const handleSelectClick = useCallback(async () => {
    if (isDesktop) {
      // Electron：使用系统文件选择器
      const files = await selectLocalFiles({
        accept: getAccept(),
        multiple: true,
      });
      
      if (files.length > 0) {
        handleFiles(files);
      }
    } else {
      // 浏览器：触发 input
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = getAccept();
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) handleFiles(files);
      };
      input.click();
    }
  }, [isDesktop, getAccept, handleFiles]);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // 当前活跃的任务（仅浏览器环境）
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-800 border-zinc-600 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            导入{getMediaTypeName()}
            {isDesktop && (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                <HardDrive className="w-3 h-3 mr-1" />
                桌面版
              </Badge>
            )}
            {!isDesktop && (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                <Globe className="w-3 h-3 mr-1" />
                在线版
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-zinc-300">
            {isDesktop 
              ? '选择本地文件，无需上传，秒级导入' 
              : '选择上传方式，大文件建议使用 URL 导入'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* 上传进度显示（仅浏览器环境） */}
          {!isDesktop && activeTasks.length > 0 && (
            <div className="space-y-2 p-3 bg-zinc-700/50 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-300">正在上传...</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearCompleted}
                  className="text-xs text-zinc-400"
                >
                  清除已完成
                </Button>
              </div>
              
              {activeTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onPause={() => pauseUpload(task.id)}
                  onResume={() => resumeUpload(task.id)}
                  onCancel={() => cancelUpload(task.id)}
                />
              ))}
            </div>
          )}

          {/* 文件选择区域 */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              {isDesktop ? (
                <>
                  <HardDrive className="w-4 h-4 text-green-400" />
                  本地文件（秒级导入）
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  本地上传（支持大文件）
                </>
              )}
            </Label>
            <div 
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-all duration-200
                ${isDragOver 
                  ? "border-purple-500 bg-purple-500/10" 
                  : "border-zinc-600 hover:border-purple-500/50"
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleSelectClick}
            >
              {isDesktop ? (
                <>
                  <Zap className="w-10 h-10 mx-auto text-green-400 mb-2" />
                  <p className="text-sm text-zinc-300 font-medium">点击选择本地文件</p>
                  <p className="text-xs text-green-400 mt-1">
                    ⚡ 无需上传，直接读取本地磁盘，秒级完成
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                  <p className="text-sm text-zinc-300">点击选择文件或拖拽到此处</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    支持 {mediaType === 'audio' ? 'MP3, WAV, OGG' : mediaType.includes('video') ? 'MP4, WebM, MOV' : 'JPG, PNG, WebP'} 格式
                  </p>
                  <p className="text-xs text-purple-400 mt-1">
                    ✨ 支持断点续传，大文件秒传
                  </p>
                </>
              )}
            </div>
          </div>

          {/* URL导入 */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              URL链接导入
            </Label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={`输入${getMediaTypeName()}链接...`}
                className="bg-zinc-700 border-zinc-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddUrl();
                }}
              />
              <Button onClick={handleAddUrl} className="bg-purple-600 hover:bg-purple-700">
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
  );
}

// 任务项组件
function TaskItem({ 
  task, 
  onPause, 
  onResume, 
  onCancel 
}: { 
  task: UploadTask;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}) {
  const estimatedTime = task.uploadSpeed > 0 
    ? (task.fileSize - task.uploadedSize) / task.uploadSpeed 
    : 0;

  const isInstantUpload = task.endTime && task.startTime && task.endTime - task.startTime < 1000;

  const getStatusIcon = () => {
    switch (task.status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return isInstantUpload 
          ? <CheckCircle2 className="h-4 w-4 text-purple-500" />
          : <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case "pending":
        return "等待中";
      case "uploading":
        return `上传中 ${task.progress.toFixed(1)}%`;
      case "paused":
        return `已暂停 ${task.progress.toFixed(1)}%`;
      case "completed":
        return isInstantUpload ? "秒传成功" : "上传完成";
      case "error":
        return `失败: ${task.error || "未知错误"}`;
      default:
        return "未知状态";
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-xs text-zinc-400 truncate flex-1">{task.fileName}</span>
        <span className="text-xs text-zinc-400">{formatSize(task.fileSize)}</span>
      </div>
      
      {task.status !== "completed" && task.status !== "error" && (
        <>
          <Progress value={task.progress} className="h-1.5" />
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{getStatusText()}</span>
            <div className="flex items-center gap-2">
              {task.uploadSpeed > 0 && (
                <>
                  <span>{formatSpeed(task.uploadSpeed)}</span>
                  {estimatedTime > 0 && (
                    <span>剩余 {formatTime(estimatedTime)}</span>
                  )}
                </>
              )}
              <div className="flex items-center gap-1">
                {task.status === "uploading" && (
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onPause}>
                    <Pause className="h-3 w-3" />
                  </Button>
                )}
                {task.status === "paused" && (
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onResume}>
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {(task.status === "completed" || task.status === "error") && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{getStatusText()}</span>
          {isInstantUpload && task.status === 'completed' && (
            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
              秒传
            </span>
          )}
        </div>
      )}
    </div>
  );
}
