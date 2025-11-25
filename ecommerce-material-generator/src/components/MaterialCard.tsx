'use client';

import { Card, Tag, Space, Button, message } from 'antd';
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { Material } from '@/types';

interface MaterialCardProps {
  material: Material;
}

const materialTypeMap = {
  title: { label: '商品标题', color: 'blue' },
  selling_point: { label: '商品卖点', color: 'green' },
  atmosphere: { label: '氛围文案', color: 'orange' },
  video: { label: '讲解视频', color: 'purple' },
};

export function MaterialCard({ material }: MaterialCardProps) {
  const typeConfig = materialTypeMap[material.type];

  const handleCopy = () => {
    navigator.clipboard.writeText(material.content);
    message.success('已复制到剪贴板');
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopy}
        >
          复制
        </Button>
      }
      style={{ borderRadius: '8px' }}
    >
      {material.type === 'selling_point' && material.metadata?.points ? (
        <Space wrap>
          {(material.metadata.points as string[]).map((point, idx) => (
            <Tag key={idx} color="success">
              {point}
            </Tag>
          ))}
        </Space>
      ) : (
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          {material.content}
        </div>
      )}
    </Card>
  );
}
