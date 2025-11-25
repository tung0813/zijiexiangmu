import path from 'path';
import fs from 'fs';
import { Conversation, Message, Material } from '@/types';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.json');
const dbDir = path.dirname(dbPath);

// 确保数据库目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

interface Database {
  conversations: Conversation[];
  messages: Message[];
  materials: Material[];
}

// 初始化数据库
function initDatabase(): Database {
  if (!fs.existsSync(dbPath)) {
    const initialData: Database = {
      conversations: [],
      messages: [],
      materials: [],
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
}

export function readDB(): Database {
  return initDatabase();
}

export function writeDB(data: Database): void {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export default { readDB, writeDB };
