import { readDB, writeDB } from './database';
import { Conversation, Message, Material } from '@/types';
import { nanoid } from 'nanoid';

// 对话管理
export function createConversation(title: string): Conversation {
  const db = readDB();
  const id = nanoid();
  const now = Date.now();
  
  const conversation: Conversation = { id, title, created_at: now, updated_at: now };
  db.conversations.push(conversation);
  writeDB(db);
  
  return conversation;
}

export function getConversation(id: string): Conversation | null {
  const db = readDB();
  return db.conversations.find(c => c.id === id) || null;
}

export function getAllConversations(): Conversation[] {
  const db = readDB();
  return db.conversations.sort((a, b) => b.updated_at - a.updated_at);
}

export function updateConversation(id: string, updates: Partial<Conversation>) {
  const db = readDB();
  const index = db.conversations.findIndex(c => c.id === id);
  
  if (index !== -1) {
    db.conversations[index] = {
      ...db.conversations[index],
      ...updates,
      updated_at: Date.now(),
    };
    writeDB(db);
  }
}

export function deleteConversation(id: string) {
  const db = readDB();
  db.conversations = db.conversations.filter(c => c.id !== id);
  db.messages = db.messages.filter(m => m.conversation_id !== id);
  db.materials = db.materials.filter(m => m.conversation_id !== id);
  writeDB(db);
}

// 消息管理
export function createMessage(message: Omit<Message, 'id' | 'created_at'>): Message {
  const db = readDB();
  const id = nanoid();
  const now = Date.now();
  
  const newMessage: Message = {
    ...message,
    id,
    created_at: now,
  };
  
  db.messages.push(newMessage);
  updateConversation(message.conversation_id, { updated_at: now });
  writeDB(db);
  
  return newMessage;
}

export function getMessages(conversationId: string): Message[] {
  const db = readDB();
  return db.messages
    .filter(m => m.conversation_id === conversationId)
    .sort((a, b) => a.created_at - b.created_at);
}

export function getMessage(id: string): Message | null {
  const db = readDB();
  return db.messages.find(m => m.id === id) || null;
}

// 素材管理
export function createMaterial(material: Omit<Material, 'id' | 'created_at'>): Material {
  const db = readDB();
  const id = nanoid();
  const now = Date.now();
  
  const newMaterial: Material = {
    ...material,
    id,
    created_at: now,
  };
  
  db.materials.push(newMaterial);
  writeDB(db);
  
  return newMaterial;
}

export function getMaterialsByConversation(conversationId: string): Material[] {
  const db = readDB();
  return db.materials
    .filter(m => m.conversation_id === conversationId)
    .sort((a, b) => b.created_at - a.created_at);
}

export function getMaterialsByMessage(messageId: string): Material[] {
  const db = readDB();
  return db.materials
    .filter(m => m.message_id === messageId)
    .sort((a, b) => a.created_at - b.created_at);
}
