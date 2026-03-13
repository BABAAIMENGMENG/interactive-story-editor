import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取用户进度
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const storyId = request.nextUrl.searchParams.get('story_id');
    
    const client = getSupabaseClient();
    
    let query = client
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (storyId) {
      query = query.eq('story_id', storyId);
    }
    
    const { data: progress, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// 保存用户进度
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const body = await request.json();
    const { storyId, currentNodeId, choicesMade, itemsCollected, progress } = body;

    const client = getSupabaseClient();

    // 检查是否已有进度
    const { data: existing } = await client
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .single();

    if (existing) {
      // 更新进度
      const { data, error } = await client
        .from('user_progress')
        .update({
          current_node_id: currentNodeId,
          choices_made: choicesMade,
          items_collected: itemsCollected,
          progress: progress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ progress: data });
    } else {
      // 创建新进度
      const { data, error } = await client
        .from('user_progress')
        .insert({
          user_id: userId,
          story_id: storyId,
          current_node_id: currentNodeId,
          choices_made: choicesMade,
          items_collected: itemsCollected,
          progress: progress,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ progress: data });
    }
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}
