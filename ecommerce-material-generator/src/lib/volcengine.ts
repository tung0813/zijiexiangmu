import axios from 'axios';
import { VolcengineRequest, VolcengineResponse, VolcengineMessage } from '@/types';

const API_KEY = process.env.VOLCENGINE_API_KEY || '';
const ENDPOINT = process.env.VOLCENGINE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3';
const MODEL = process.env.VOLCENGINE_MODEL || '';

export class VolcengineService {
  private apiKey: string;
  private endpoint: string;
  private model: string;

  constructor(apiKey?: string, endpoint?: string, model?: string) {
    this.apiKey = apiKey || API_KEY;
    this.endpoint = endpoint || ENDPOINT;
    this.model = model || MODEL;
  }

  async chat(messages: VolcengineMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    try {
      const request: VolcengineRequest = {
        model: this.model,
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 2000,
      };

      const apiUrl = `${this.endpoint}/chat/completions`;
      
      const response = await axios.post<VolcengineResponse>(
        apiUrl,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 60000,
        }
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Volcengine API Error:', error.response?.data || error.message);
      throw new Error(`AI 服务调用失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateMaterials(productDescription: string, images?: string[]): Promise<{
    title: string;
    sellingPoints: string[];
    atmosphere: string;
  }> {
    // 如果没有配置 API Key，返回模拟数据
    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      console.warn('使用模拟数据：未配置火山引擎 API');
      return {
        title: `${productDescription.substring(0, 20)}精选好物`,
        sellingPoints: ['品质保证', '新鲜直达', '坏果包赔'],
        atmosphere: '好物推荐，值得信赖',
      };
    }

    const systemPrompt = `你是一个专业的电商商品文案撰写助手。你的任务是根据用户提供的商品信息和图片，生成吸引人的商品营销素材。

请按照以下格式返回 JSON：
{
  "title": "10-30字的商品标题，需要包含关键卖点",
  "sellingPoints": ["卖点1", "卖点2", "卖点3"],
  "atmosphere": "主图氛围文案，简短有力"
}

注意：
1. 标题要简洁、吸引人，突出核心卖点
2. 卖点要具体、可量化，每个5-10字
3. 氛围文案要有感染力，8-15字
4. 必须返回标准的 JSON 格式`;

    const userContent: any = {
      type: 'text',
      text: `商品描述：${productDescription}\n\n请生成商品营销素材。`,
    };

    const messages: VolcengineMessage[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: images && images.length > 0 
          ? [
              userContent,
              ...images.map(img => ({
                type: 'image_url' as const,
                image_url: { url: img }
              }))
            ]
          : userContent.text
      },
    ];

    const response = await this.chat(messages, { temperature: 0.8 });
    
    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          title: data.title || '',
          sellingPoints: Array.isArray(data.sellingPoints) ? data.sellingPoints : [],
          atmosphere: data.atmosphere || '',
        };
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }

    // 如果解析失败，返回默认值
    return {
      title: '精选商品',
      sellingPoints: ['品质保证', '快速发货'],
      atmosphere: '好物推荐',
    };
  }

  async refineMaterials(
    previousContent: string,
    refinementRequest: string
  ): Promise<{
    title: string;
    sellingPoints: string[];
    atmosphere: string;
  }> {
    const systemPrompt = `你是一个专业的电商商品文案撰写助手。用户对之前生成的内容不满意，需要你根据用户的反馈进行优化。

请按照以下格式返回 JSON：
{
  "title": "优化后的商品标题",
  "sellingPoints": ["优化后的卖点1", "优化后的卖点2", "优化后的卖点3"],
  "atmosphere": "优化后的主图氛围文案"
}`;

    const messages: VolcengineMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: previousContent },
      { role: 'user', content: refinementRequest },
    ];

    const response = await this.chat(messages, { temperature: 0.8 });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          title: data.title || '',
          sellingPoints: Array.isArray(data.sellingPoints) ? data.sellingPoints : [],
          atmosphere: data.atmosphere || '',
        };
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }

    return {
      title: '精选商品',
      sellingPoints: ['品质保证', '快速发货'],
      atmosphere: '好物推荐',
    };
  }
}

export const volcengineService = new VolcengineService();
