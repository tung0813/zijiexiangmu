# 电商商品素材智能生成工具

基于 React、Node.js、TypeScript、火山引擎 OpenAPI 等技术栈，打造具备多轮对话能力与优质用户体验的电商商品素材生成工具，可自动化生成商品标题、卖点、主图氛围、讲解视频等营销素材。

## 技术栈

- **应用框架**: Next.js 16 (一体式前后端应用)
- **UI 组件**: Ant Design
- **数据库**: SQLite (本地持久化存储)
- **MaaS 平台**: 火山引擎 OpenAPI
- **语言**: TypeScript
- **代码规范**: ESLint + Prettier + Husky

## 核心功能

### 1. 多轮对话能力
- ✅ 支持创建多个独立对话会话
- ✅ 不同对话间数据完全隔离
- ✅ 对话历史持久化存储
- ✅ 支持基于上下文的迭代优化

### 2. 素材生成
- ✅ **商品标题**: 10-30字的吸引人标题
- ✅ **商品卖点**: 3-5个核心卖点提炼
- ✅ **主图氛围**: 简短有力的氛围文案
- ✅ **图片上传**: 支持上传商品图片辅助生成
- ✅ **水印功能**: 可为生成图片添加"抖音电商前端训练营"水印

### 3. 用户体验
- ✅ 流畅的对话界面
- ✅ 实时生成状态反馈
- ✅ 素材一键复制
- ✅ 响应式设计
- ✅ 优雅的动画过渡

### 4. 工程化
- ✅ TypeScript 类型安全
- ✅ ESLint + Prettier 代码规范
- ✅ Husky 提交前自动检查
- ✅ GitHub Actions CI/CD
- ✅ 支持 Vercel 一键部署

## 项目结构

```
ecommerce-material-generator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── conversations/ # 对话管理
│   │   │   ├── generate/      # 素材生成
│   │   │   ├── upload/        # 图片上传
│   │   │   └── watermark/     # 水印处理
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── ChatInterface.tsx  # 主界面
│   │   ├── ChatArea.tsx       # 对话区域
│   │   ├── ConversationList.tsx # 对话列表
│   │   └── MaterialCard.tsx   # 素材卡片
│   ├── lib/                   # 工具库
│   │   ├── database.ts        # 数据库初始化
│   │   ├── db-operations.ts   # 数据库操作
│   │   ├── volcengine.ts      # 火山引擎服务
│   │   └── watermark.ts       # 水印处理
│   └── types/                 # TypeScript 类型定义
├── public/                    # 静态资源
├── .github/                   # GitHub 配置
│   └── workflows/            # CI/CD 工作流
├── .env.local                # 环境变量 (不提交)
├── .env.example              # 环境变量示例
└── package.json              # 项目配置
```

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd ecommerce-material-generator
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，并填写火山引擎配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# 火山引擎配置
VOLCENGINE_API_KEY=your_api_key_here
VOLCENGINE_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3
VOLCENGINE_MODEL=ep-20241121xxxxx-xxxxx

# 数据库配置
DATABASE_PATH=./data/database.sqlite
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 5. 构建生产版本

```bash
npm run build
npm start
```

## 使用指南

### 创建对话

1. 点击左侧"新建对话"按钮
2. 新对话会自动创建并切换

### 生成素材

1. 点击上传图片按钮，上传商品主图（可选）
2. 在输入框中描述商品信息，例如：
   ```
   雪莲果，来自云南高原，脆爽清甜，水润多汁，经过超200项检测，坏果包赔
   ```
3. 点击发送，AI 将自动生成：
   - 商品标题
   - 商品卖点
   - 主图氛围文案

### 迭代优化

如果对生成结果不满意，可以继续在当前对话中提出修改意见：

```
标题太长了，简化到20字以内，突出"云南高原"和"清甜脆爽"
```

### 复制素材

点击每个素材卡片右上角的"复制"按钮，即可将内容复制到剪贴板。

## 代码规范

### 运行 Lint

```bash
npm run lint
```

### 格式化代码

```bash
npm run format
```

### 检查格式

```bash
npm run format:check
```

## 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量（与 `.env.local` 相同）
4. 点击部署

### 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

- `VOLCENGINE_API_KEY`
- `VOLCENGINE_ENDPOINT`
- `VOLCENGINE_MODEL`

## CI/CD

项目已配置 GitHub Actions 自动化流程：

- **Pull Request**: 运行 Lint 和 Build 检查
- **Push to main**: 自动部署到 Vercel

需要在 GitHub 仓库的 Secrets 中配置：

- `VOLCENGINE_API_KEY`
- `VOLCENGINE_ENDPOINT`
- `VOLCENGINE_MODEL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 开发计划

- [ ] 支持讲解视频生成
- [ ] 支持更多素材类型（详情页、海报等）
- [ ] 支持切换不同 AI 模型
- [ ] 支持导出素材包
- [ ] 支持批量生成

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
