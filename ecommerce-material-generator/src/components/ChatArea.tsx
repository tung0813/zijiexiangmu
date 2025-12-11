'use client';

// 引入补丁修复 Antd 报错
import '@ant-design/v5-patch-for-react-19';
import { useState, useEffect, useRef } from 'react';
import { Input, Button, Upload, Spin, Card, Tag, Space, Checkbox, message as antdMessage } from 'antd';
import { SendOutlined, PictureOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { Message, Material } from '@/types';
import { MaterialCard } from './MaterialCard';

const { TextArea } = Input;

interface ChatAreaProps {
  conversationId: string;
  model?: string;
}

export function ChatArea({ conversationId, model = 'doubao-pro' }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [materials, setMaterials] = useState<Record<string, Material[]>>({});
  const [input, setInput] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);

  // 存储给 AI 看的纯文本历史
  const [aiHistory, setAiHistory] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    
    // 1. 界面立即显示用户消息
    const tempUserMsg: Message = {
        id: tempUserMsgId,
        conversation_id: conversationId,
        role: 'user',
        content: currentInput,
        images: [], 
        created_at: Date.now()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setInput('');

    try {
      // 图片上传
      const imageUrls: string[] = [];
      for (const file of fileList) {
        if (file.originFileObj) {
          const formData = new FormData();
          formData.append('file', file.originFileObj);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();
          if (uploadData.url) imageUrls.push(uploadData.url);
        }
      }
      
      if (imageUrls.length > 0) {
          setMessages(prev => prev.map(m => m.id === tempUserMsgId ? {...m, images: imageUrls} : m));
      }

      // 2. 发送请求 (带上 History)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: currentInput,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          model: model, 
          history: aiHistory // 把历史记录发给后端
        }),
      });

      const data = await response.json();

      if (data.error) {
        antdMessage.error(data.error);
      } else {
        const aiMsgId = data.message_id || Date.now().toString();
        
        // 更新 AI 消息界面
        const aiMsg: Message = {
            id: aiMsgId,
            conversation_id: conversationId,
            role: 'assistant',
            content: '已生成素材', 
            created_at: Date.now()
        };

        const newMaterials = data.materials.map((m: any, idx: number) => ({
            ...m,
            id: m.id || `${aiMsgId}-${idx}`,
            message_id: aiMsgId,
            conversation_id: conversationId
        }));

        setMaterials(prev => ({ ...prev, [aiMsgId]: newMaterials }));
        setMessages(prev => [...prev, aiMsg]);

        // ✅✅✅ 关键修正点 ✅✅✅
        // 我们必须存入 data.rawContent (原始 JSON 字符串)
        // 而不是 JSON.stringify(data.materials) (那是前端加工过的数组，AI 看不懂)
        const aiResponseContent = data.rawContent || JSON.stringify({ 
            title: "生成内容丢失", 
            sellingPoints: ["请重试"], 
            atmosphere: "系统提示" 
        });

        setAiHistory(prev => [
            ...prev,
            { role: 'user', content: currentInput },
            { role: 'assistant', content: aiResponseContent } 
        ]);

        setFileList([]);
        // antdMessage.success('生成成功！'); // 不需要每次都弹窗，体验更好
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
              <p>当前模型：<Tag color="blue">{model}</Tag></p>
              <p>上传商品图片并描述商品信息，AI 将为您生成营销素材</p>
            </div>
          </div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {messages.map((msg, index) => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'user' ? (
                  <Card style={{ maxWidth: '70%', backgroundColor: '#1890ff', color: 'white' }}>
                    <div>{msg.content}</div>
                    {msg.images && msg.images.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        {msg.images.map((img, idx) => (
                          <img key={idx} src={img} alt="商品图" style={{ maxWidth: '200px', borderRadius: '8px', marginRight: '8px' }} />
                        ))}
                      </div>
                    )}
                  </Card>
                ) : (
                  <div style={{ maxWidth: '80%', minWidth: '300px' }}>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      
                      {(() => {
                        const relatedImage = findLatestImage(index);
                        const atmosphereMat = materials[msg.id]?.find(m => m.type === 'atmosphere');
                        
                        if (relatedImage && atmosphereMat) {
                          return (
                            <div style={{ 
                              position: 'relative', 
                              borderRadius: '12px', 
                              overflow: 'hidden', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              border: '1px solid #eee'
                            }}>
                              <img src={relatedImage} alt="预览" style={{ width: '100%', display: 'block' }} />
                              <div style={{
                                position: 'absolute',
                                bottom: '40px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(255, 255, 255, 0.85)',
                                backdropFilter: 'blur(4px)',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                color: '#be123c',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                whiteSpace: 'nowrap',
                                zIndex: 10
                              }}>
                                {atmosphereMat.content}
                              </div>
                              {showWatermark && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '10px',
                                  right: '10px',
                                  color: 'rgba(255,255,255,0.8)',
                                  fontSize: '10px',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                  zIndex: 5
                                }}>
                                  抖音电商前端训练营
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

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

      <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 24px', background: 'white' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              accept="image/*"
            >
              {fileList.length < 3 && (
                <div><PictureOutlined /><div style={{ marginTop: 8 }}>上传图片</div></div>
              )}
            </Upload>
            <Checkbox 
              checked={showWatermark} 
              onChange={(e) => setShowWatermark(e.target.checked)}
            >
              生成图片水印 (加分项)
            </Checkbox>
          </div>
          
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`[${model}] 描述您的商品信息...`}
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