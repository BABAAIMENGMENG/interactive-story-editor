'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Save,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  workCount: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: '言情', icon: '💕', slug: 'romance', sortOrder: 1, isActive: true, workCount: 23 },
  { id: '2', name: '悬疑', icon: '🔍', slug: 'suspense', sortOrder: 2, isActive: true, workCount: 18 },
  { id: '3', name: '科幻', icon: '🚀', slug: 'scifi', sortOrder: 3, isActive: true, workCount: 15 },
  { id: '4', name: '奇幻', icon: '✨', slug: 'fantasy', sortOrder: 4, isActive: true, workCount: 12 },
  { id: '5', name: '冒险', icon: '🗺️', slug: 'adventure', sortOrder: 5, isActive: true, workCount: 8 },
  { id: '6', name: '校园', icon: '🎓', slug: 'campus', sortOrder: 6, isActive: true, workCount: 10 },
  { id: '7', name: '普法', icon: '⚖️', slug: 'legal', sortOrder: 7, isActive: true, workCount: 5 },
  { id: '8', name: '喜剧', icon: '😄', slug: 'comedy', sortOrder: 8, isActive: true, workCount: 14 },
  { id: '9', name: '其他', icon: '📖', slug: 'other', sortOrder: 99, isActive: true, workCount: 7 },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    icon: '📁',
    slug: '',
    sortOrder: 0,
    isActive: true,
  });

  // 开始编辑
  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({ ...category });
  };

  // 保存编辑
  const handleSave = () => {
    if (!editingId) return;
    setCategories(categories.map((c) =>
      c.id === editingId ? { ...c, ...editForm } : c
    ));
    setEditingId(null);
    setEditForm({});
  };

  // 取消编辑
  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 删除分类
  const handleDelete = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category?.workCount && category.workCount > 0) {
      alert(`该分类下有 ${category.workCount} 个作品，请先迁移作品后再删除。`);
      return;
    }
    if (confirm('确定要删除这个分类吗？')) {
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  // 添加新分类
  const handleAdd = () => {
    if (!newCategory.name || !newCategory.slug) {
      alert('请填写分类名称和标识');
      return;
    }
    const maxOrder = Math.max(...categories.map((c) => c.sortOrder));
    const newCat: Category = {
      id: Date.now().toString(),
      name: newCategory.name || '',
      icon: newCategory.icon || '📁',
      slug: newCategory.slug || '',
      sortOrder: newCategory.sortOrder || maxOrder + 1,
      isActive: newCategory.isActive ?? true,
      workCount: 0,
    };
    setCategories([...categories, newCat]);
    setIsAdding(false);
    setNewCategory({
      name: '',
      icon: '📁',
      slug: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  // 切换状态
  const handleToggleActive = (id: string) => {
    setCategories(categories.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ));
  };

  // 上移
  const handleMoveUp = (id: string) => {
    const index = categories.findIndex((c) => c.id === id);
    if (index <= 0) return;
    const newCategories = [...categories];
    [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    // 更新排序
    newCategories.forEach((c, i) => {
      c.sortOrder = i + 1;
    });
    setCategories(newCategories);
  };

  // 下移
  const handleMoveDown = (id: string) => {
    const index = categories.findIndex((c) => c.id === id);
    if (index >= categories.length - 1) return;
    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    // 更新排序
    newCategories.forEach((c, i) => {
      c.sortOrder = i + 1;
    });
    setCategories(newCategories);
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">
          管理作品分类，拖拽调整排序
        </p>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          添加分类
        </Button>
      </div>

      {/* 添加新分类 */}
      {isAdding && (
        <div className="bg-gray-800 rounded-lg p-4 border border-purple-500">
          <h3 className="text-white font-medium mb-3">添加新分类</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">图标</label>
              <input
                type="text"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="输入emoji"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">名称</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="分类名称"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">标识</label>
              <input
                type="text"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="英文标识"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
                添加
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 分类列表 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium w-10"></th>
              <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">分类信息</th>
              <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">标识</th>
              <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">作品数</th>
              <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">状态</th>
              <th className="px-4 py-3 text-left text-gray-400 text-xs font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {categories
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((category, index) => (
                <tr key={category.id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveUp(category.id)}
                        disabled={index === 0}
                        className="text-gray-500 hover:text-white disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveDown(category.id)}
                        disabled={index === categories.length - 1}
                        className="text-gray-500 hover:text-white disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === category.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editForm.icon}
                          onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                          className="w-12 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-white">{category.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-sm"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">{category.slug}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">{category.workCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(category.id)}
                      className={`px-2 py-0.5 rounded text-xs ${
                        category.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-600 text-gray-400'
                      }`}
                    >
                      {category.isActive ? '启用' : '禁用'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === category.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleSave}
                          className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1.5 text-gray-400 hover:bg-gray-600 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                          title="删除"
                          disabled={category.workCount > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
