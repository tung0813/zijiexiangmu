import { NextRequest, NextResponse } from 'next/server';
import { createConversation, getConversations } from '@/lib/db-operations';

export async function GET() {
  try {
    // 获取所有对话列表
    const conversations = getConversations();
    return NextResponse.json({ conversations });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: '标题不能为空' },
        { status: 400 }
      );
    }

    // 创建新对话
    const conversation = createConversation(title);
    return NextResponse.json({ conversation });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}