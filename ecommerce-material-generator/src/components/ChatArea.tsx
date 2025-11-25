'use client';

import { useState, useEffect, useRef } from 'react';
import { Input, Button, Upload, Spin, Card, Tag, Space, message as antdMessage } from 'antd';
import { SendOutlined, PictureOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { Message, Material } from '@/types';
import { MaterialCard } from './MaterialCard';

const { TextArea } = Input;

interface ChatAreaProps {
  conversationId: string;
}

export function ChatArea({ conversationId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [materials, setMaterials] = useState<Record<string, Material[]>>({});
  const [input, setInput] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      
      if (data.messages) {
        setMessages(data.messages);
        
        // 加载每条助手消息的素材
        const materialsMap: Record<string, Material[]> = {};
        for (const msg of data.messages) {
          if (msg.role === 'assistant') {
            try {
              const content = JSON.parse(msg.content);
              const mats: Material[] = [];
              
              if (content.title) {
                mats.push({
                  id: `${msg.id}-title`,
                  conversation_id: conversationId,
                  message_id: msg.id,
                  type: 'title',
                  content: content.title,
                  created_at: msg.created_at,
                });
              }
              
              if (content.sellingPoints) {
                mats.push({
                  id: `${msg.id}-points`,
                  conversation_id: conversationId,
                  message_id: msg.id,
                  type: 'selling_point',
                  content: content.sellingPoints.join(' · '),
                  metadata: { points: content.sellingPoints },
                  created_at: msg.created_at,
                });
              }
              
              if (content.atmosphere) {
                mats.push({
                  id: `${msg.id}-atmosphere`,
                  conversation_id: conversationId,
                  message_id: msg.id,
                  type: 'atmosphere',
                  content: content.atmosphere,
                  created_at: msg.created_at,
                });
              }
              
              materialsMap[msg.id] = mats;
            } catch (e) {
              // 解析失败忽略
            }
          }
        }
        setMaterials(materialsMap);
      }
    } catch (error) {
      antdMessage.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && fileList.length === 0) {
      antdMessage.warning('请输入内容或上传图片');
      return;
    }

    setGenerating(true);

    try {
      // 上传图片
      const imageUrls: string[] = [];
      for (const file of fileList) {
        if (file.originFileObj) {
          const formData = new FormData();
          formData.append('file', file.originFileObj);
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            imageUrls.push(uploadData.url);
          }
        }
      }

      // 发送消息生成素材
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: input,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        antdMessage.error(data.error);
      } else {
        antdMessage.success('素材生成成功');
        setInput('');
        setFileList([]);
        await loadMessages();
      }
    } catch (error: any) {
      antdMessage.error(error.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 消息区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2>欢迎使用电商素材生成工具</h2>
              <p>上传商品图片并描述商品信息，AI 将为您生成营销素材</p>
            </div>
          </div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'user' ? (
                  <Card
                    style={{
                      maxWidth: '70%',
                      backgroundColor: '#1890ff',
                      color: 'white',
                    }}
                  >
                    <div>{msg.content}</div>
                    {msg.images && msg.images.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {msg.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="商品图"
                            style={{
                              maxWidth: '200px',
                              borderRadius: '8px',
                              marginRight: '8px',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </Card>
                ) : (
                  <div style={{ maxWidth: '80%' }}>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {materials[msg.id]?.map((material) => (
                        <MaterialCard key={material.id} material={material} />
                      ))}
                    </Space>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </Space>
        )}
      </div>

      {/* 输入区域 */}
      <div
        style={{
          borderTop: '1px solid #f0f0f0',
          padding: '16px 24px',
          background: 'white',
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
            accept="image/*"
          >
            {fileList.length < 3 && (
              <div>
                <PictureOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
          
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="描述您的商品信息，或对生成的素材提出修改意见..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={generating}
            />
            <Button
              type="primary"
              icon={generating ? <LoadingOutlined /> : <SendOutlined />}
              onClick={handleSend}
              disabled={generating}
              size="large"
            >
              {generating ? '生成中...' : '发送'}
            </Button>
          </Space.Compact>
        </Space>
      </div>
    </div>
  );
}
