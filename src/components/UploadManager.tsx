"use client";

import React, { useState, useCallback } from "react";
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

  // 处理文件选择
  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // 检查文件数量
    if (tasks.length + fileArray.length > maxFiles) {
      alert(`最多同时上传 ${maxFiles} 个文件`);
      return;
    }

    // 过滤文件类型和大小
    const validFiles = fileArray.filter(file => {
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", ""));
        }
        return file.type === type;
      });

      const isValidSize = file.size <= maxFileSize * 1024 * 1024;

      if (!isValidType) {
        console.warn(`文件类型不支持: ${file.name} (${file.type})`);
      }
      if (!isValidSize) {
        console.warn(`文件过大: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      }

      return isValidType && isValidSize;
    });

    // 开始上传
    for (const file of validFiles) {
      const taskId = await addTask(file);
      await startUpload(taskId);
    }
    
    // 检查是否有完成的结果
    const completedResults = results.filter(r => 
      validFiles.some(f => f.name === r.fileName)
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
  }, [tasks.length, maxFiles, acceptedTypes, maxFileSize, addTask, startUpload, results, onUploadComplete]);

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  // 格式化速度
  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatSize(bytesPerSecond)}/s`;
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return "--:--";
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${Math.round(seconds % 60)}秒`;
    return `${Math.floor(seconds / 3600)}小时${Math.round((seconds % 3600) / 60)}分`;
  };

  // 计算总进度
  const getOverallProgress = (): number => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return totalProgress / tasks.length;
  };

  // 获取状态图标
  const getStatusIcon = (status: UploadTask["status"]) => {
    switch (status) {
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
  };

  // 获取状态文本
  const getStatusText = (task: UploadTask): string => {
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
  };

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
                总进度: {getOverallProgress().toFixed(1)}%
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearCompleted}
                disabled={!tasks.some(t => t.status === "completed")}
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
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
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
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            拖拽文件到此处，或点击选择文件
          </p>
          <p className="text-xs text-muted-foreground">
            支持 {acceptedTypes.join(", ")}，最大 {maxFileSize}MB，最多 {maxFiles} 个文件
          </p>
        </div>

        {/* 上传任务列表 */}
        {tasks.length > 0 && (
          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* 状态图标 */}
                  <div className="mt-0.5">
                    {getStatusIcon(task.status)}
                  </div>

                  {/* 文件信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{task.file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatSize(task.file.size)}
                      </span>
                    </div>

                    {/* 进度条 */}
                    {task.status !== "completed" && task.status !== "error" && (
                      <>
                        <Progress value={task.progress} className="h-1.5 mb-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{getStatusText(task)}</span>
                          <div className="flex items-center gap-3">
                            {task.uploadSpeed > 0 && (
                              <span>{formatSpeed(task.uploadSpeed)}</span>
                            )}
                            {task.uploadSpeed > 0 && task.uploadedSize > 0 && (
                              <span>剩余 {formatTime((task.fileSize - task.uploadedSize) / task.uploadSpeed)}</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* 完成或错误状态 */}
                    {(task.status === "completed" || task.status === "error") && (
                      <p className="text-sm text-muted-foreground">
                        {getStatusText(task)}
                      </p>
                    )}

                    {/* 分片进度 */}
                    {task.status === "uploading" && task.chunks && (
                      <p className="text-xs text-muted-foreground mt-1">
                        分片: {task.chunks.filter(c => c.status === 'completed').length}/{task.chunks.length}
                      </p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1">
                    {task.status === "uploading" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => pauseUpload(task.id)}
                        title="暂停"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {task.status === "paused" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => resumeUpload(task.id)}
                        title="继续"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {task.status !== "completed" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => cancelUpload(task.id)}
                        title="取消"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
