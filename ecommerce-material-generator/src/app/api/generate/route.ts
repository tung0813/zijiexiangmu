import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import dotenv from 'dotenv';

// 尝试加载环境变量
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const SYSTEM_PROMPT = `
你是一个电商营销专家。请根据用户输入生成商品素材。
必须严格输出以下 JSON 格式（不要包含 markdown 代码块，直接返回 JSON 字符串）：
{
  "title": "商品标题(15-30字)",
  "sellingPoints": ["卖点1", "卖点2", "卖点3"],
  "atmosphere": "主图氛围文案(短句, 如'美好生活')",
  "videoScript": "短视频脚本大纲(分镜描述)"
}
`;

export async function POST(request: NextRequest) {
  try {
    // 1. 在请求处理内部读取 Key，防止启动时崩溃
    const API_KEY = process.env.DOUBAO_API_KEY;
    const BASE_URL = process.env.DOUBAO_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";

    // 2. 检查 Key 是否存在
    if (!API_KEY) {
      console.error("❌ 【错误】未读取到 API Key。");
      console.error("请确认 .env 文件内容不为空，且编码为 UTF-8。");
      return NextResponse.json({ 
        error: '服务端配置错误: 未读取到 API Key (请检查 .env 文件编码)' 
      }, { status: 500 });
    }

    // 3. 动态初始化客户端
    const client = new OpenAI({
      apiKey: API_KEY,
      baseURL: BASE_URL,
    });

    const { conversation_id, user_message, images, model = 'doubao-pro', history = [] } = await request.json();

    if (!user_message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    // 4. 定义模型映射
    const MODEL_MAP: Record<string, string | undefined> = {
      'doubao-pro': process.env.DOUBAO_MODEL_ID,
      'doubao-flash': process.env.DOUBAO_FLASH_MODEL_ID,
      'doubao-dream': process.env.DOUBAO_DREAM_MODEL_ID,
      'deepseek-v3': process.env.DEEPSEEK_MODEL_ID,
    };

    const targetModelId = MODEL_MAP[model];
    
    console.log(`[请求] 模型: ${model} | ID: ${targetModelId || "❌ 未找到"}`);

    if (!targetModelId) {
      return NextResponse.json({ 
        error: `未找到模型配置: ${model}。请检查 .env 文件是否包含对应 ID。` 
      }, { status: 500 });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history, 
      { role: 'user', content: user_message }
    ];

    // 5. 调用 API
    const response = await client.chat.completions.create({
      model: targetModelId,
      messages: messages as any,
      temperature: 0.7,
    });

    const aiContent = response.choices[0]?.message?.content || "{}";
    
    // 6. 解析结果
    let cleanJson = aiContent;
    let materialsData;

    try {
      cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
      materialsData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("JSON解析失败:", aiContent);
      materialsData = { title: "生成格式异常", sellingPoints: [aiContent], atmosphere: "系统提示" };
    }

    return NextResponse.json({
      message_id: Date.now().toString(), 
      materials: [
        { type: 'title', content: materialsData.title },
        { type: 'selling_point', content: materialsData.sellingPoints?.join(' · ') },
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