import { NextRequest, NextResponse } from 'next/server';
import { createMessage, createMaterial, getMessages } from '@/lib/db-operations';
import { volcengineService } from '@/lib/volcengine';

export async function POST(request: NextRequest) {
  try {
    const { conversation_id, user_message, images } = await request.json();

    if (!conversation_id || !user_message) {
      return NextResponse.json(
        { error: '会话ID和用户消息不能为空' },
        { status: 400 }
      );
    }

    // 保存用户消息
    const userMsg = createMessage({
      conversation_id,
      role: 'user',
      content: user_message,
      images,
    });

    // 获取历史消息用于上下文
    const previousMessages = getMessages(conversation_id);
    const hasHistory = previousMessages.length > 1;

    let materialsData;
    
    if (hasHistory) {
      // 如果有历史消息，说明是迭代优化
      const lastAssistantMsg = previousMessages
        .filter(m => m.role === 'assistant')
        .pop();
      
      const previousContent = lastAssistantMsg?.content || '';
      materialsData = await volcengineService.refineMaterials(
        previousContent,
        user_message
      );
    } else {
      // 首次生成
      materialsData = await volcengineService.generateMaterials(
        user_message,
        images
      );
    }

    // 构造助手回复
    const assistantContent = JSON.stringify(materialsData, null, 2);
    const assistantMsg = createMessage({
      conversation_id,
      role: 'assistant',
      content: assistantContent,
    });

    // 保存生成的素材
    const materials = [];
    
    // 保存标题
    if (materialsData.title) {
      materials.push(createMaterial({
        conversation_id,
        message_id: assistantMsg.id,
        type: 'title',
        content: materialsData.title,
      }));
    }

    // 保存卖点
    if (materialsData.sellingPoints && materialsData.sellingPoints.length > 0) {
      materials.push(createMaterial({
        conversation_id,
        message_id: assistantMsg.id,
        type: 'selling_point',
        content: materialsData.sellingPoints.join(' · '),
        metadata: { points: materialsData.sellingPoints },
      }));
    }

    // 保存氛围文案
    if (materialsData.atmosphere) {
      materials.push(createMaterial({
        conversation_id,
        message_id: assistantMsg.id,
        type: 'atmosphere',
        content: materialsData.atmosphere,
      }));
    }

    return NextResponse.json({
      message_id: assistantMsg.id,
      materials,
    });
  } catch (error: any) {
    console.error('Generate materials error:', error);
    return NextResponse.json(
      { error: error.message || '生成素材失败' },
      { status: 500 }
    );
  }
}
