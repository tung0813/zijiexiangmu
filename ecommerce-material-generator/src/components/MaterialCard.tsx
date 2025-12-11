'use client';

import { Card, Tag, Space, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { Material } from '@/types';

interface MaterialCardProps {
  material: Material;
}

// 1. 在这里配置不同素材类型的 标签名 和 颜色
// 键名必须和 types/index.ts 里的 MaterialType 一致
const materialTypeMap: Record<string, { label: string; color: string }> = {
  title: { label: '商品标题', color: 'blue' },
  selling_point: { label: '商品卖点', color: 'green' },
  atmosphere: { label: '氛围文案', color: 'orange' },
  video: { label: '生成视频', color: 'purple' }, // 原有的 video 类型
  video_script: { label: '🎥 视频脚本', color: 'magenta' }, // ✅ 新增：粉色标签
};

export function MaterialCard({ material }: MaterialCardProps) {
  // 获取配置，如果没有匹配到则使用默认值
  const typeConfig = materialTypeMap[material.type] || { label: '未知类型', color: 'default' };

  const handleCopy = () => {
    navigator.clipboard.writeText(material.content);
    message.success('已复制到剪贴板');
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          {/* 渲染彩色标签 */}
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
      {/* 针对卖点类型的特殊渲染（显示为多个绿色小标签） */}
      {material.type === 'selling_point' && material.metadata?.points ? (
        <Space wrap>
          {(material.metadata.points as string[]).map((point, idx) => (
            <Tag key={idx} color="success">
              {point}
            </Tag>
          ))}
        </Space>
      ) : (
        /* 通用渲染：加上 whiteSpace: 'pre-wrap' 以保留换行格式（对视频脚本很重要） */
        <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {material.content}
        </div>
      )}
    </Card>
  );
}