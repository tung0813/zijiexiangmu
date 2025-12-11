import { NextRequest, NextResponse } from 'next/server';
// 注意：请确保你的 db-operations.ts 中确实导出了 getConversations
// 如果没有，这行代码会报错，但根据你之前的反馈，你应该已经修正了这里。
import { createConversation, getConversations } from '@/lib/db-operations';

export async function GET() {
  try {
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

    const conversation = createConversation(title);
    return NextResponse.json({ conversation });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}