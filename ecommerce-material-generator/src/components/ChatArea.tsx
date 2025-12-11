'use client';

import '@ant-design/v5-patch-for-react-19';
import { useState, useEffect, useRef } from 'react';
import { Input, Button, Upload, Card, Tag, Space, Checkbox, message as antdMessage } from 'antd';
import { SendOutlined, PictureOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { Message, Material } from '@/types';
import { MaterialCard } from './MaterialCard';

const { TextArea } = Input;

interface ChatAreaProps {
  conversationId: string;
  model?: string;
}

// 辅助函数：将文件转为 Base64 字符串
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export function ChatArea({ conversationId, model = 'doubao-pro' }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [materials, setMaterials] = useState<Record<string, Material[]>>({});
  const [input, setInput] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [aiHistory, setAiHistory] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // === 1. 持久化逻辑：加载数据 ===
  useEffect(() => {
    const storageKey = `chat_data_${conversationId}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setMessages(parsed.messages || []);
        setMaterials(parsed.materials || {});
        setAiHistory(parsed.aiHistory || []);
        // 延时滚动到底部，确保渲染完成
        setTimeout(() => scrollToBottom(), 100);
      } catch (e) { console.error("读取缓存失败", e); }
    } else {
      setMessages([]);
      setMaterials({});
      setAiHistory([]);
    }
  }, [conversationId]);

  // === 2. 持久化逻辑：保存数据 ===
  useEffect(() => {
    if (!conversationId) return;
    const storageKey = `chat_data_${conversationId}`;
    try {
        // 注意：LocalStorage 只有 5MB，如果存太多高清大图可能会满
        localStorage.setItem(storageKey, JSON.stringify({ messages, materials, aiHistory }));
    } catch (e) {
        console.warn("浏览器缓存已满，无法保存更多记录");
    }
  }, [messages, materials, aiHistory, conversationId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 查找当前消息之前的最近一张用户图片，用于合成效果展示
  const findLatestImage = (currentMsgIndex: number) => {
    for (let i = currentMsgIndex; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'user' && msg.images && msg.images.length > 0) {
        return msg.images[0];
      }
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim() && fileList.length === 0) {
      antdMessage.warning('请输入内容或上传图片');
      return;
    }

    setGenerating(true);
    const tempUserMsgId = Date.now().toString();
    const currentInput = input;
    
    // 1. 前端处理图片转 Base64 (不经过服务器上传，直接由浏览器处理)
    const base64Images: string[] = [];
    try {
        for (const file of fileList) {
            if (file.originFileObj) {
                const base64 = await fileToBase64(file.originFileObj);
                base64Images.push(base64);
            }
        }
    } catch (e) {
        antdMessage.error("图片处理失败");
        setGenerating(false);
        return;
    }

    // 2. 构造用户消息对象
    const tempUserMsg: Message = {
        id: tempUserMsgId,
        conversation_id: conversationId,
        role: 'user',
        content: currentInput,
        images: base64Images, 
        created_at: Date.now()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInput('');
    setFileList([]); // 发送后清空上传列表

    try {
      // 3. 调用 AI 生成接口
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: currentInput,
          images: base64Images.length > 0 ? base64Images : undefined,
          model: model, 
          history: aiHistory
        }),
      });

      const data = await response.json();

      if (data.error) {
        antdMessage.error(data.error);
      } else {
        const aiMsgId = data.message_id || Date.now().toString();
        
        const aiMsg: Message = {
            id: aiMsgId,
            conversation_id: conversationId,
            role: 'assistant',
            content: '已生成素材', 
            created_at: Date.now()
        };

        // 处理素材数据，确保格式正确
        const newMaterials = data.materials.map((m: any, idx: number) => ({
            ...m,
            id: m.id || `${aiMsgId}-${idx}`,
            message_id: aiMsgId,
            conversation_id: conversationId,
            // 兼容性处理：如果后端返回数组，转为字符串显示
            content: Array.isArray(m.content) ? m.content.join(' · ') : m.content
        }));

        setMaterials(prev => ({ ...prev, [aiMsgId]: newMaterials }));
        setMessages(prev => [...prev, aiMsg]);

        // 更新 AI 上下文历史
        setAiHistory(prev => [
            ...prev,
            { role: 'user', content: currentInput },
            { role: 'assistant', content: data.rawContent || "{}" } 
        ]);
      }
    } catch (error: any) {
      antdMessage.error(error.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {messages.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            <div style={{ textAlign: 'center' }}>
              <h2>欢迎使用电商素材生成工具</h2>
              <p>当前会话 ID：<Tag>{conversationId}</Tag></p>
              <p>您的聊天数据和图片将安全地保存在本地浏览器中</p>
            </div>
          </div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {messages.map((msg, index) => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'user' ? (
                  <Card style={{ maxWidth: '70%', backgroundColor: '#1890ff', color: 'white' }} bodyStyle={{ padding: '12px' }}>
                    <div>{msg.content}</div>
                    {msg.images && msg.images.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {msg.images.map((img, idx) => (
                          <img key={idx} src={img} alt="上传图片" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', display: 'block', marginTop: 4 }} />
                        ))}
                      </div>
                    )}
                  </Card>
                ) : (
                  <div style={{ maxWidth: '85%', minWidth: '300px' }}>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      
                      {/* === 图片合成效果展示区 === */}
                      {(() => {
                        const relatedImage = findLatestImage(index);
                        // 寻找类型为 atmosphere (氛围词) 的素材
                        const atmosphereMat = materials[msg.id]?.find(m => m.type === 'atmosphere');
                        
                        if (relatedImage && atmosphereMat) {
                          return (
                            <div style={{ 
                              position: 'relative', 
                              borderRadius: '12px', 
                              overflow: 'hidden', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              border: '1px solid #eee',
                              display: 'inline-block' // 自适应图片宽度
                            }}>
                              <img src={relatedImage} alt="合成预览" style={{ maxWidth: '100%', maxHeight:'400px', display: 'block' }} />
                              
                              {/* 中间氛围词贴片 */}
                              <div style={{
                                position: 'absolute',
                                bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(4px)',
                                padding: '8px 20px',
                                borderRadius: '30px',
                                color: '#be123c', fontWeight: 'bold', fontSize: '16px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                whiteSpace: 'nowrap', zIndex: 10
                              }}>
                                {atmosphereMat.content}
                              </div>

                              {/* 右下角水印 */}
                              {showWatermark && (
                                <div style={{
                                  position: 'absolute', bottom: '10px', right: '10px',
                                  color: 'rgba(255,255,255,0.95)', fontSize: '12px',
                                  textShadow: '0 1px 3px rgba(0,0,0,0.8)', zIndex: 5,
                                  fontWeight: 600, letterSpacing: '0.5px'
                                }}>
                                  抖音电商前端训练营
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* 常规素材卡片 */}
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

      {/* 底部输入区 */}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 24px', background: 'white' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false} // 禁止自动上传，交由 handleSend 处理
              accept="image/*"
              maxCount={3}
            >
              {fileList.length < 3 && (
                <div><PictureOutlined /><div style={{ marginTop: 8 }}>加图</div></div>
              )}
            </Upload>
            <Checkbox 
              checked={showWatermark} 
              onChange={(e) => setShowWatermark(e.target.checked)}
            >
              生成水印效果
            </Checkbox>
          </div>
          
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`[${model}] 描述商品或直接发送图片...`}
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
              style={{ height: 'auto' }}
            >
              {generating ? '生成中' : '发送'}
            </Button>
          </Space.Compact>
        </Space>
      </div>
    </div>
  );
}