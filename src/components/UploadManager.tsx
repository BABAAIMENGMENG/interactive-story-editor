"use client";

import React, { useState, useCallback, memo, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Pause, 
  Play, 
  X, 
  File, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import { useChunkedUpload, UploadTask } from "@/hooks/useChunkedUpload";

interface UploadManagerProps {
  onUploadComplete?: (result: { fileUrl: string; fileName: string; fileSize: number }) => void;
  maxFiles?: number;
  maxFileSize?: number; // MB
  acceptedTypes?: string[];
  className?: string;
}

// 优化：使用 memo 包裹任务项，避免不必要的重渲染
const UploadTaskItem = memo(function UploadTaskItem({
  task,
  onPause,
  onResume,
  onCancel,
}: {
  task: UploadTask;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}) {
  // 格式化文件大小
  const formatSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }, []);

  // 格式化速度
  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    return `${formatSize(bytesPerSecond)}/s`;
  }, [formatSize]);

  // 格式化时间
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return "--:--";
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${Math.round(seconds % 60)}秒`;
    return `${Math.floor(seconds / 3600)}小时${Math.round((seconds % 3600) / 60)}分`;
  }, []);

  // 计算剩余时间
  const estimatedTime = useMemo(() => {
    if (task.uploadSpeed <= 0 || task.uploadedSize >= task.fileSize) return 0;
    return (task.fileSize - task.uploadedSize) / task.uploadSpeed;
  }, [task.uploadSpeed, task.uploadedSize, task.fileSize]);

  // 获取状态图标
  const StatusIcon = useMemo(() => {
    switch (task.status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  }, [task.status]);

  // 获取状态文本
  const statusText = useMemo(() => {
    switch (task.status) {
      case "pending":
        return "等待中";
      case "uploading":
        return `上传中 ${task.progress.toFixed(1)}%`;
      case "paused":
        return `已暂停 ${task.progress.toFixed(1)}%`;
      case "completed":
        return "上传完成";
      case "error":
        return `失败: ${task.error || "未知错误"}`;
      default:
        return "未知状态";
    }
  }, [task.status, task.progress, task.error]);

  // 计算分片进度
  const chunkProgress = useMemo(() => {
    if (!task.chunks) return null;
    const completed = task.chunks.filter(c => c.status === 'completed').length;
    return `${completed}/${task.chunks.length}`;
  }, [task.chunks]);

  return (
    <div className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* 状态图标 */}
        <div className="mt-0.5">
          {StatusIcon}
        </div>

        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">{task.fileName}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatSize(task.fileSize)}
            </span>
          </div>

          {/* 进度条 */}
          {task.status !== "completed" && task.status !== "error" && (
            <>
              <Progress value={task.progress} className="h-1.5 mb-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{statusText}</span>
                <div className="flex items-center gap-3">
                  {task.uploadSpeed > 0 && (
                    <span>{formatSpeed(task.uploadSpeed)}</span>
                  )}
                  {estimatedTime > 0 && (
                    <span>剩余 {formatTime(estimatedTime)}</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 完成或错误状态 */}
          {(task.status === "completed" || task.status === "error") && (
            <p className="text-sm text-muted-foreground">{statusText}</p>
          )}

          {/* 分片进度 */}
          {task.status === "uploading" && chunkProgress && (
            <p className="text-xs text-muted-foreground mt-1">
              分片: {chunkProgress}
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          {task.status === "uploading" && (
            <Button size="icon" variant="ghost" onClick={onPause} title="暂停">
              <Pause className="h-4 w-4" />
            </Button>
          )}
          {task.status === "paused" && (
            <Button size="icon" variant="ghost" onClick={onResume} title="继续">
              <Play className="h-4 w-4" />
            </Button>
          )}
          {task.status !== "completed" && (
            <Button size="icon" variant="ghost" onClick={onCancel} title="取消">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，减少不必要的重渲染
  const prev = prevProps.task;
  const next = nextProps.task;
  
  return (
    prev.id === next.id &&
    prev.status === next.status &&
    prev.progress === next.progress &&
    prev.uploadSpeed === next.uploadSpeed &&
    prev.error === next.error
  );
});

export function UploadManager({
  onUploadComplete,
  maxFiles = 5,
  maxFileSize = 1024, // 1GB
  acceptedTypes = ["video/*", "image/*", "audio/*"],
  className = "",
}: UploadManagerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
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

  // 已完成的任务数
  const completedCount = useMemo(() => 
    tasks.filter(t => t.status === 'completed').length, 
    [tasks]
  );

  // 处理文件选择
  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // 检查文件数量
    if (tasks.length + fileArray.length > maxFiles) {
      alert(`最多同时上传 ${maxFiles} 个文件`);
      return;
    }

    // 过滤文件类型和大小（使用 Array.every 提前终止）
    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (validFiles.length + tasks.length >= maxFiles) break;
      
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", ""));
        }
        return file.type === type;
      });

      const isValidSize = file.size <= maxFileSize * 1024 * 1024;

      if (isValidType && isValidSize) {
        validFiles.push(file);
      }
    }

    // 批量添加任务（减少渲染次数）
    const taskIds: string[] = [];
    for (const file of validFiles) {
      const taskId = await addTask(file);
      taskIds.push(taskId);
    }
    
    // 并行开始上传
    taskIds.forEach(id => startUpload(id));
  }, [tasks.length, maxFiles, acceptedTypes, maxFileSize, addTask, startUpload]);

  // 监听上传完成
  React.useEffect(() => {
    const completedResults = results.filter(r => 
      tasks.some(t => t.id === r.id && t.status === 'completed')
    );
    
    for (const result of completedResults) {
      if (onUploadComplete) {
        onUploadComplete({
          fileUrl: result.fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
        });
      }
    }
  }, [results, tasks, onUploadComplete]);

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

  // 计算总进度
  const overallProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return totalProgress / tasks.length;
  }, [tasks]);

  // 格式化文件大小（静态）
  const formatMaxSize = useMemo(() => {
    if (maxFileSize >= 1024) return `${maxFileSize / 1024}GB`;
    return `${maxFileSize}MB`;
  }, [maxFileSize]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            文件上传
          </CardTitle>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                总进度: {overallProgress.toFixed(1)}%
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearCompleted}
                disabled={completedCount === 0}
              >
                清除已完成
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* 拖拽上传区域 */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200
            ${isDragOver 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept = acceptedTypes.join(",");
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) handleFiles(files);
            };
            input.click();
          }}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            拖拽文件到此处，或点击选择
          </p>
          <p className="text-xs text-muted-foreground">
            最大 {formatMaxSize}，最多 {maxFiles} 个文件
          </p>
        </div>

        {/* 上传任务列表 - 使用虚拟化或分页可以进一步优化 */}
        {tasks.length > 0 && (
          <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {tasks.map((task) => (
              <UploadTaskItem
                key={task.id}
                task={task}
                onPause={() => pauseUpload(task.id)}
                onResume={() => resumeUpload(task.id)}
                onCancel={() => cancelUpload(task.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
