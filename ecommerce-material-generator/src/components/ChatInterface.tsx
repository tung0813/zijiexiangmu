'use client';

import { useState, useEffect } from 'react';
import { Layout, message as antdMessage, Select, Typography } from 'antd'; // 新增 Select, Typography
import { ConversationList } from './ConversationList';
import { ChatArea } from './ChatArea';
import { Conversation } from '@/types';

const { Sider, Content } = Layout;
const { Text } = Typography;

// 定义支持的模型选项 (必须与后端 route.ts 里的 key 对应)
const MODEL_OPTIONS = [
  { value: 'doubao-pro', label: '🟢 豆包 Pro (通用默认)' },
  { value: 'doubao-flash', label: '⚡ 豆包 Flash (极速版)' },
  { value: 'doubao-dream', label: '🧠 豆包 Seedream (高智商)' },
  { value: 'deepseek-v3', label: '🦈 DeepSeek R1 (火山引擎版)' },
];

export function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- 新增：模型选择状态 ---
  const [selectedModel, setSelectedModel] = useState('doubao-pro');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      
      if (data.conversations) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !currentConversationId) {
          setCurrentConversationId(data.conversations[0].id);
        }
      }
    } catch (error) {
      antdMessage.error('加载对话列表失败');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新对话' }),
      });
      
      const data = await response.json();
      
      if (data.conversation) {
        setConversations([data.conversation, ...conversations]);
        setCurrentConversationId(data.conversation.id);
        antdMessage.success('创建新对话成功');
      }
    } catch (error) {
      antdMessage.error('创建对话失败');
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        width={280}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* --- 新增：模型选择区域 --- */}
        <div style={{ padding: '20px 16px 0 16px' }}>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <Text strong style={{ fontSize: 14 }}>AI 模型选择</Text>
          </div>
          <Select
            value={selectedModel}
            onChange={setSelectedModel}
            style={{ width: '100%', marginBottom: 16 }}
            options={MODEL_OPTIONS}
            size="large"
          />
          <div style={{ height: 1, background: '#f0f0f0', marginBottom: 16 }} />
        </div>

        {/* 原有的对话列表 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
            <ConversationList
            conversations={conversations}
            currentId={currentConversationId}
            onSelect={setCurrentConversationId}
            onNew={createNewConversation}
            loading={loading}
            />
        </div>
      </Sider>

      <Content style={{ background: '#f5f5f5' }}>
        {currentConversationId ? (
          <ChatArea 
            conversationId={currentConversationId} 
            // @ts-ignore (暂时忽略类型报错，等你发给我 ChatArea 代码后修复)
            model={selectedModel}  
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}
          >
            选择或创建一个对话开始
          </div>
        )}
      </Content>
    </Layout>
  );
}