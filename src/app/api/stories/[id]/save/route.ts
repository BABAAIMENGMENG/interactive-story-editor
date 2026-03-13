import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 保存完整剧本（场景、节点、选择等）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      title, 
      description, 
      coverImage, 
      isPublished,
      scenes, 
      nodes, 
      choices, 
      characters 
    } = body;

    const client = getSupabaseClient();

    // 更新剧本基本信息
    const { error: storyError } = await client
      .from('stories')
      .update({
        title,
        description,
        cover_image: coverImage,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (storyError) {
      return NextResponse.json({ error: storyError.message }, { status: 500 });
    }

    // 保存场景
    if (scenes && scenes.length > 0) {
      // 先删除旧场景
      await client.from('scenes').delete().eq('story_id', id);
      
      // 插入新场景
      const scenesData = scenes.map((s: any, index: number) => ({
        id: s.id,
        story_id: id,
        title: s.title,
        panorama_image: s.panoramaImage || '',
        order_index: index,
      }));
      
      await client.from('scenes').insert(scenesData);
    }

    // 保存角色
    if (characters && characters.length > 0) {
      // 先删除旧角色（这里简化处理，实际可能需要更复杂的逻辑）
      // 然后插入新角色
      const charactersData = characters.map((c: any) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar || null,
      }));
      
      await client.from('characters').upsert(charactersData);
    }

    // 保存节点
    if (nodes && nodes.length > 0) {
      // 先删除旧节点
      const sceneIds = scenes.map((s: any) => s.id);
      if (sceneIds.length > 0) {
        await client.from('story_nodes').delete().in('scene_id', sceneIds);
      }
      
      // 插入新节点
      const nodesData = nodes.map((n: any, index: number) => ({
        id: n.id,
        scene_id: n.sceneId,
        title: n.title,
        content: n.content || '',
        node_type: n.nodeType,
        character_id: n.characterId || null,
        order_index: index,
      }));
      
      await client.from('story_nodes').insert(nodesData);
    }

    // 保存选择
    if (choices && choices.length > 0) {
      // 先删除旧选择
      const nodeIds = nodes.map((n: any) => n.id);
      if (nodeIds.length > 0) {
        await client.from('choices').delete().in('node_id', nodeIds);
      }
      
      // 插入新选择
      const choicesData = choices.map((c: any, index: number) => ({
        id: c.id,
        node_id: c.nodeId,
        choice_text: c.choiceText,
        next_node_id: c.nextNodeId || null,
        order_index: index,
      }));
      
      await client.from('choices').insert(choicesData);
    }

    return NextResponse.json({ success: true, storyId: id });
  } catch (error) {
    console.error('Error saving story:', error);
    return NextResponse.json(
      { error: 'Failed to save story' },
      { status: 500 }
    );
  }
}
