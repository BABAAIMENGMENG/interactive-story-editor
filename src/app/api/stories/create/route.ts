import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 创建新剧本
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, coverImage } = body;

    const client = getSupabaseClient();

    // 创建剧本
    const { data: story, error: storyError } = await client
      .from('stories')
      .insert({
        title,
        description: description || '',
        cover_image: coverImage || null,
        is_published: false,
      })
      .select()
      .single();

    if (storyError) {
      return NextResponse.json({ error: storyError.message }, { status: 500 });
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    );
  }
}
