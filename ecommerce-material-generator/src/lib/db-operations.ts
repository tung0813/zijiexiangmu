// src/lib/db-operations.ts

// ---------------------------------------------------------
// 🚨 Vercel 适配版数据库 (Mock DB)
// ---------------------------------------------------------

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

// ---------------------------------------------------------
// 核心函数 (Mock)
// ---------------------------------------------------------

// 1. 获取会话列表 (兼容两个名字)
export function getConversations() { return []; }
export const getAllConversations = getConversations; // <--- 关键修复：加了这个别名

// 2. 获取消息列表
export function getMessages(conversationId: string) { return []; }

// 3. 创建消息
export function createMessage(data: any) { 
  return { id: Date.now().toString(), created_at: Date.now(), ...data }; 
}

// 4. 创建素材
export function createMaterial(data: any) { 
  return { id: Date.now().toString(), created_at: Date.now(), ...data }; 
}

// 5. 创建会话
export function createConversation(title: string) { 
  return { id: Date.now().toString(), title: title || '新会话', created_at: Date.now() }; 
}

// 6. 获取素材
export function getMaterials(messageId: string) { return []; }