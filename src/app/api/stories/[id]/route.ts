import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取剧本详情（包含场景和节点）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    // 获取剧本信息
    const { data: story, error: storyError } = await client
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // 获取所有场景
    const { data: scenes, error: scenesError } = await client
      .from('scenes')
      .select('*')
      .eq('story_id', id)
      .order('order_index', { ascending: true });

    if (scenesError) {
      return NextResponse.json({ error: scenesError.message }, { status: 500 });
    }

    // 获取所有节点
    const { data: nodes, error: nodesError } = await client
      .from('story_nodes')
      .select('*')
      .in('scene_id', scenes?.map(s => s.id) || [])
      .order('order_index', { ascending: true });

    if (nodesError) {
      return NextResponse.json({ error: nodesError.message }, { status: 500 });
    }

    // 获取所有选择
    const { data: choices, error: choicesError } = await client
      .from('choices')
      .select('*')
      .in('node_id', nodes?.map(n => n.id) || []);

    if (choicesError) {
      return NextResponse.json({ error: choicesError.message }, { status: 500 });
    }

    // 获取角色信息
    const characterIds = nodes?.filter(n => n.character_id).map(n => n.character_id) || [];
    const { data: characters } = await client
      .from('characters')
      .select('*')
      .in('id', characterIds);

    return NextResponse.json({
      story,
      scenes,
      nodes,
      choices,
      characters: characters || [],
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story' },
      { status: 500 }
    );
  }
}
