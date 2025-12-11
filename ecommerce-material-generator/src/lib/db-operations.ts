// src/lib/db-operations.ts

// ✅ 这里的代码只为了欺骗编译器和防止 Vercel 报错
// 真正的存储我们放在前端 (ChatArea.tsx) 做

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  created_at: number;
}

export interface Material {
  id: string;
  message_id: string;
  conversation_id: string;
  type: 'title' | 'selling_point' | 'atmosphere' | 'video_script';
  content: string;
  created_at: number;
}

// 所有函数都返回“假成功”，什么都不做
export function getMessages(conversationId: string) { return []; }
export function createMessage(data: any) { return { id: Date.now().toString(), ...data }; }
export function createMaterial(data: any) { return { id: Date.now().toString(), ...data }; }
export function getConversations() { return []; }
export function createConversation(title: string) { return { id: Date.now().toString(), title }; }
export function getMaterials(messageId: string) { return []; }