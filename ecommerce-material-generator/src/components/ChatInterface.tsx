'use client';

import { useState, useEffect } from 'react';
import { Layout, message as antdMessage, Select, Typography, Button, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { ChatArea } from './ChatArea';
import { Conversation } from '@/types';

const { Sider, Content } = Layout;
const { Text } = Typography;

// 🔥 只保留你需要的两个模型
const MODEL_OPTIONS = [
  { value: 'doubao-pro', label: '🟢 豆包 Pro (基础版)' },
  { value: 'doubao-plus', label: '🚀 豆包 Pro (新版/增强版)' }, 
];

export function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('doubao-pro');

  // === 1. 初始化：从 LocalStorage 加载对话列表 ===
  useEffect(() => {
    const savedList = localStorage.getItem('chat_list_index');
    if (savedList) {
      try {
        const parsedList = JSON.parse(savedList);
        setConversations(parsedList);
        
        // 尝试恢复上次选中的会话
        const lastId = localStorage.getItem('last_active_id');
        if (lastId && parsedList.find((c: Conversation) => c.id === lastId)) {
          setCurrentConversationId(lastId);
        } else if (parsedList.length > 0) {
          setCurrentConversationId(parsedList[0].id);
        }
      } catch (e) {
        console.error("加载列表失败", e);
      }
    }
  }, []);

  // === 2. 监听：当 ID 变化时，记录到缓存 ===
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem('last_active_id', currentConversationId);
    }
  }, [currentConversationId]);

  // === 3. 动作：创建新对话 ===
  const createNewConversation = () => {
    const newId = Date.now().toString();
    const now = Date.now();
    
    // 🔥 修复点：添加 updated_at 字段以满足 TypeScript 类型定义
    const newConversation: Conversation = {
      id: newId,
      title: '新对话', 
      created_at: now,
      updated_at: now // <--- 补上了这个必须的字段
    };

    const newList = [newConversation, ...conversations];
    setConversations(newList);
    setCurrentConversationId(newId);
    
    // 保存列表到 LocalStorage
    localStorage.setItem('chat_list_index', JSON.stringify(newList));
    antdMessage.success('新对话已创建');
  };

  // === 4. 动作：清空当前对话 ===
  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    
    const newList = conversations.filter(c => c.id !== id);
    setConversations(newList);
    localStorage.setItem('chat_list_index', JSON.stringify(newList));
    
    // 清除该对话的具体内容
    localStorage.removeItem(`chat_data_${id}`);

    if (id === currentConversationId) {
      if (newList.length > 0) {
        setCurrentConversationId(newList[0].id);
      } else {
        setCurrentConversationId(null);
      }
    }
    antdMessage.success('删除成功');
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
        {/* 模型选择区 */}
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

        {/* 对话列表区 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 12px' }}>
            <Button 
                type="dashed" 
                block 
                icon={<PlusOutlined />} 
                onClick={createNewConversation}
                style={{ marginBottom: '12px' }}
            >
                新建对话
            </Button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {conversations.map(conv => (
                    <div 
                        key={conv.id}
                        onClick={() => setCurrentConversationId(conv.id)}
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: currentConversationId === conv.id ? '#e6f7ff' : '#f5f5f5',
                            border: currentConversationId === conv.id ? '1px solid #91d5ff' : '1px solid transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {conv.title}
                        </div>
                        {currentConversationId === conv.id && (
                            <Popconfirm
                                title="确定删除此对话？"
                                onConfirm={(e) => e && deleteConversation(e, conv.id)}
                                onCancel={(e) => e?.stopPropagation()}
                                okText="是"
                                cancelText="否"
                            >
                                <DeleteOutlined 
                                    style={{ color: '#ff4d4f', marginLeft: '8px' }} 
                                    onClick={(e) => e.stopPropagation()} 
                                />
                            </Popconfirm>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </Sider>

      <Content style={{ background: '#f5f5f5' }}>
        {currentConversationId ? (
          <ChatArea 
            conversationId={currentConversationId} 
            // @ts-ignore
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
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div>👈 请在左侧新建一个对话</div>
          </div>
        )}
      </Content>
    </Layout>
  );
}