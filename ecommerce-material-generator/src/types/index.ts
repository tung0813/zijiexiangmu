export interface Conversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  created_at: number;
}

export interface Material {
  id: string;
  conversation_id: string;
  message_id: string;
  // ✅ 核心修改：添加了 'video_script'，保留原有的 'video' 以防万一
  type: 'title' | 'selling_point' | 'atmosphere' | 'video' | 'video_script';
  content: string;
  metadata?: Record<string, any>;
  created_at: number;
}

export interface GenerateMaterialRequest {
  conversation_id: string;
  user_message: string;
  images?: string[];
  // ✅ 核心修改：添加 model 字段，支持前端传模型参数
  model?: string;
}

export interface GenerateMaterialResponse {
  message_id: string;
  materials: Material[];
}

export interface VolcengineMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface VolcengineRequest {
  model: string;
  messages: VolcengineMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface VolcengineResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}