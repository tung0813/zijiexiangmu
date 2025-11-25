'use client';

import { useState, useEffect } from 'react';
import { Layout, message as antdMessage } from 'antd';
import { ConversationList } from './ConversationList';
import { ChatArea } from './ChatArea';
import { Conversation } from '@/types';

const { Sider, Content } = Layout;

export function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        }}
      >
        <ConversationList
          conversations={conversations}
          currentId={currentConversationId}
          onSelect={setCurrentConversationId}
          onNew={createNewConversation}
          loading={loading}
        />
      </Sider>
      <Content style={{ background: '#f5f5f5' }}>
        {currentConversationId ? (
          <ChatArea conversationId={currentConversationId} />
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
