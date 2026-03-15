import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { faqList, systemPrompt } from '@/config/faq';

// 匹配 FAQ
function matchFAQ(userMessage: string): string | null {
  const lowerMessage = userMessage.toLowerCase();
  
  for (const faq of faqList) {
    // 检查关键词匹配
    const keywordMatch = faq.keywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    // 检查问题相似度（简单包含匹配）
    const questionMatch = lowerMessage.includes(faq.question.replace('？', '').toLowerCase()) ||
                          faq.question.toLowerCase().includes(lowerMessage.replace('？', ''));
    
    if (keywordMatch || questionMatch) {
      return faq.answer;
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: '消息不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. 先尝试匹配 FAQ
    const faqAnswer = matchFAQ(message);
    
    if (faqAnswer) {
      // 使用 SSE 流式返回 FAQ 答案（模拟打字机效果）
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // 分段发送 FAQ 答案
          const chunks = faqAnswer.split('');
          for (let i = 0; i < chunks.length; i++) {
            const data = JSON.stringify({ content: chunks[i], done: false });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            // 添加小延迟模拟打字效果
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          // 发送完成信号
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`));
          controller.close();
        },
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 2. FAQ 未匹配，调用 LLM
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建消息历史
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // 添加历史消息
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // 添加当前消息
    messages.push({ role: 'user', content: message });

    // 流式调用 LLM
    const llmStream = client.stream(messages, {
      model: 'doubao-seed-1-6-flash-250615', // 使用快速模型
      temperature: 0.7,
    });

    // 转换为 SSE 流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              const data = JSON.stringify({ content: text, done: false });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          // 发送完成信号
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '', done: true })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('LLM streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'AI 服务暂时不可用，请稍后重试' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: '服务器错误，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
