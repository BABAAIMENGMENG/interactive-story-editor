'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Play, BookOpen, Settings, ArrowLeft } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  description: string;
  cover_image?: string;
  is_published: boolean;
  created_at: string;
  scenes_count?: number;
  nodes_count?: number;
}

export default function CreatePage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([
    {
      id: 'demo',
      title: '迷失的时空',
      description: '一个关于时间与空间的冒险故事',
      is_published: true,
      created_at: new Date().toISOString(),
      scenes_count: 2,
      nodes_count: 5,
    },
  ]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStory, setNewStory] = useState({
    title: '',
    description: '',
  });

  const handleCreateStory = async () => {
    if (!newStory.title.trim()) return;

    // 创建新剧本
    const story: Story = {
      id: `story-${Date.now()}`,
      title: newStory.title,
      description: newStory.description,
      is_published: false,
      created_at: new Date().toISOString(),
      scenes_count: 0,
      nodes_count: 0,
    };

    setStories([...stories, story]);
    setNewStory({ title: '', description: '' });
    setIsCreateOpen(false);

    // 跳转到编辑器
    router.push(`/create/editor/${story.id}`);
  };

  const handleDeleteStory = (id: string) => {
    if (confirm('确定要删除这个剧本吗？此操作不可恢复。')) {
      setStories(stories.filter(s => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      {/* 导航栏 */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
                返回首页
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-bold text-white">创作中心</h1>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Plus className="mr-2 h-4 w-4" />
                  创建新剧本
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="text-white">创建新剧本</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    填写剧本基本信息，创建后可添加场景和剧情节点
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">剧本名称</Label>
                    <Input
                      id="title"
                      value={newStory.title}
                      onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                      placeholder="输入剧本名称"
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">剧本简介</Label>
                    <Textarea
                      id="description"
                      value={newStory.description}
                      onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
                      placeholder="描述你的故事背景和主题"
                      className="border-white/10 bg-white/5 text-white min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-white/20 bg-transparent text-white">
                    取消
                  </Button>
                  <Button onClick={handleCreateStory} className="bg-gradient-to-r from-purple-500 to-pink-500">
                    创建并编辑
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-white">{stories.length}</CardTitle>
              <CardDescription className="text-gray-400">我的剧本</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-white">
                {stories.filter(s => s.is_published).length}
              </CardTitle>
              <CardDescription className="text-gray-400">已发布</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-white">
                {stories.reduce((sum, s) => sum + (s.scenes_count || 0), 0)}
              </CardTitle>
              <CardDescription className="text-gray-400">场景总数</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* 剧本列表 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">我的剧本</h2>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">还没有剧本</h3>
            <p className="text-gray-400 mb-6">点击上方按钮创建你的第一个互动短剧</p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
              <Plus className="mr-2 h-4 w-4" />
              创建剧本
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Card
                key={story.id}
                className="group overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-purple-500/50"
              >
                {/* 封面 */}
                <div className="relative h-40 bg-gradient-to-br from-purple-600/50 to-pink-600/50">
                  {story.cover_image && (
                    <img
                      src={story.cover_image}
                      alt={story.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {story.is_published ? (
                      <Badge className="bg-green-500/90">已发布</Badge>
                    ) : (
                      <Badge className="bg-yellow-500/90 text-black">草稿</Badge>
                    )}
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-white">{story.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-gray-400">
                    {story.description || '暂无简介'}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{story.scenes_count || 0} 个场景</span>
                    <span>•</span>
                    <span>{story.nodes_count || 0} 个节点</span>
                  </div>
                </CardContent>

                <CardFooter className="justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteStory(story.id)}
                      className="border-red-500/50 bg-transparent text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/20 bg-transparent text-gray-400 hover:bg-white/10 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {story.is_published && (
                      <Link href={`/game?story=${story.id}`}>
                        <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                          <Play className="mr-1 h-3 w-3" />
                          预览
                        </Button>
                      </Link>
                    )}
                    <Link href={`/create/editor/${story.id}`}>
                      <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500">
                        <Edit className="mr-1 h-3 w-3" />
                        编辑
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
