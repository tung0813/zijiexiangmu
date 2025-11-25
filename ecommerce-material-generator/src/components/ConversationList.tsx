'use client';

import { Button, List, Spin } from 'antd';
import { PlusOutlined, MessageOutlined } from '@ant-design/icons';
import { Conversation } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface ConversationListProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  loading: boolean;
}

export function ConversationList({
  conversations,
  currentId,
  onSelect,
  onNew,
  loading,
}: ConversationListProps) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onNew}
          block
          size="large"
        >
          新建对话
        </Button>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : (
          <List
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: currentId === conv.id ? '#e6f7ff' : 'transparent',
                  borderLeft: currentId === conv.id ? '3px solid #1890ff' : '3px solid transparent',
                  padding: '12px 16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (currentId !== conv.id) {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentId !== conv.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <List.Item.Meta
                  avatar={<MessageOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                  title={conv.title}
                  description={dayjs(conv.updated_at).fromNow()}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
