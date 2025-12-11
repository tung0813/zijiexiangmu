import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import dotenv from 'dotenv';

// 尝试加载环境变量
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const SYSTEM_PROMPT = `
你是一个资深电商视觉设计师。请分析用户发送的商品图片（如果有）或文本描述。
目标：提取商品核心卖点，并生成用于贴在图片上的简短文案。

请严格输出以下 JSON 格式（不要Markdown代码块，直接返回JSON）：
{
  "title": "商品短标题(10字内)",
  "sellingPoints": ["核心卖点1(5字内)", "核心卖点2(5字内)", "核心卖点3(5字内)"],
  "atmosphere": "氛围短句(用于图片居中展示，如'极简美学', 4字以内)",
  "videoScript": "简单分镜描述"
}
`;

// 🔥 核心修改：定义支持图片的模型列表
// 我们假设你的 ID_three 是支持 Vision 的
const VISION_CAPABLE_MODELS = ['doubao-pro', 'doubao-latest']; 

export async function POST(request: NextRequest) {
  try {
    const API_KEY = process.env.DOUBAO_API_KEY;
    const BASE_URL = process.env.DOUBAO_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";

    if (!API_KEY) {
      return NextResponse.json({ error: '服务端未配置 API Key' }, { status: 500 });
    }

    const client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });

    // 读取前端发送的数据
    const { user_message, images, model = 'doubao-pro', history = [] } = await request.json();

    // 🔥 核心修改：模型映射
    // doubao-pro -> 第一个 (ID)
    // doubao-latest -> 最后一个 (ID_three)
    const MODEL_MAP: Record<string, string | undefined> = {
      'doubao-pro': process.env.DOUBAO_MODEL_ID,
      'doubao-latest': process.env.DOUBAO_MODEL_ID_three, 
    };
    
    const targetModelId = MODEL_MAP[model];

    if (!targetModelId) {
      return NextResponse.json({ error: `未找到模型 ${model} 的 ID 配置，请检查环境变量是否包含 DOUBAO_MODEL_ID_three` }, { status: 500 });
    }

    // 检查模型是否支持图片
    const hasImages = images && Array.isArray(images) && images.length > 0;
    const isVisionModel = VISION_CAPABLE_MODELS.includes(model);

    if (hasImages && !isVisionModel) {
      return NextResponse.json({ 
        error: `当前选择的模型不支持图片识别，请切换其他模型。` 
      }, { status: 400 });
    }

    // 构建消息体
    let userContent: any[] = [{ type: 'text', text: user_message || "请分析商品信息，生成营销素材" }];

    if (hasImages && isVisionModel) {
      images.forEach((imgUrl: string) => {
        userContent.push({
          type: "image_url",
          image_url: {
            url: imgUrl 
          }
        });
      });
    }

    // 处理历史记录
    const cleanHistory = history.map((h: any) => ({
      role: h.role,
      content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content).slice(0, 200) + '...'
    }));

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...cleanHistory,
      { role: 'user', content: userContent }
    ];

    console.log(`[请求AI] 模型: ${model}, 图片数: ${hasImages ? images.length : 0}`);

    // 调用大模型
    const response = await client.chat.completions.create({
      model: targetModelId,
      messages: messages as any,
      temperature: 0.7,
    });

    const aiContent = response.choices[0]?.message?.content || "{}";
    
    // 解析返回的 JSON
    let cleanJson = aiContent;
    let materialsData;

    try {
      cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
      materialsData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("JSON解析失败，原始返回:", aiContent);
      materialsData = { 
        title: "生成解析失败", 
        sellingPoints: ["请重试"], 
        atmosphere: "系统繁忙", 
        videoScript: aiContent 
      };
    }

    return NextResponse.json({
      message_id: Date.now().toString(),
      materials: [
        { type: 'title', content: materialsData.title },
        { type: 'selling_point', content: materialsData.sellingPoints }, 
        { type: 'atmosphere', content: materialsData.atmosphere },
        { type: 'video_script', content: materialsData.videoScript }
      ],
      rawContent: cleanJson
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: `API调用失败: ${error.message}` }, { status: 500 });
  }
}