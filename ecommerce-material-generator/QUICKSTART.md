
# 快速启动指南

## 🚀 立即开始

### 第一步：安装依赖

```bash
cd ecommerce-material-generator
npm install
```

等待依赖安装完成（约 1-2 分钟）。

### 第二步：配置火山引擎 API

1. 前往 [火山引擎控制台](https://console.volcengine.com/ark)
2. 创建或获取 API 密钥
3. 复制环境变量配置文件：

```bash
cp .env.example .env.local
```

4. 编辑 `.env.local`，填入你的配置：

```env
VOLCENGINE_API_KEY=your_actual_api_key_here
VOLCENGINE_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3
VOLCENGINE_MODEL=your_model_endpoint_id
```

### 第三步：启动开发服务器

```bash
npm run dev
```

看到以下输出表示启动成功：

```
✓ Ready in xxxx ms
- Local:   http://localhost:3000
```

### 第四步：访问应用

打开浏览器访问：**http://localhost:3000**

## 📱 使用示例

### 1. 创建对话

点击左侧"新建对话"按钮。

### 2. 上传商品图片（可选）

点击上传区域，选择商品主图。

### 3. 输入商品描述

示例文案：

```
雪莲果，来自云南高原海拔3000米，脆爽清甜，水润多汁。
经过超200项农残检测，坏果包赔，新鲜直达。
适合全家人的健康水果。
```

### 4. 查看生成结果

AI 将自动生成：

**商品标题（示例）**
```
东方甄选自营雪莲果脆爽清甜水润多汁新鲜水果坏果包赔
```

**商品卖点（示例）**
- 清甜脆嫩多汁
- 超 200 项检测
- 云南高原种植
- 坏果包赔

**主图氛围（示例）**
```
美好生活，尽在东方甄选
```

### 5. 迭代优化

如果对结果不满意，继续输入修改建议：

```
标题太长了，精简到 20 字以内，突出"云南高原"和"清甜"
```

AI 会基于之前的内容进行优化。

## 🔧 常用命令

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 启动生产服务
npm start

# 代码检查
npm run lint

# 代码格式化
npm run format

# 检查格式
npm run format:check
```

## ⚠️ 常见问题

### Q1: 启动失败，提示模块未找到

**解决方案：** 重新安装依赖

```bash
rm -rf node_modules package-lock.json
npm install
```

### Q2: 生成素材失败

**原因可能是：**
- 火山引擎 API 密钥未配置或错误
- API 余额不足
- 网络连接问题

**解决方案：**
1. 检查 `.env.local` 配置
2. 查看控制台错误信息
3. 确认火山引擎账户状态

### Q3: 数据库错误

**解决方案：** 删除数据库重新初始化

```bash
rm -rf data/
npm run dev
```

### Q4: 端口被占用

**解决方案：** 更改端口

```bash
PORT=3001 npm run dev
```

## 📚 更多文档

- [完整使用说明](./USAGE.md)
- [项目总结](./PROJECT_SUMMARY.md)
- [技术文档](./README.md)

## 🎯 下一步

1. ✅ 配置好火山引擎 API
2. ✅ 尝试生成第一个商品素材
3. ✅ 测试迭代优化功能
4. ✅ 探索更多使用场景

## 💡 提示

- 首次启动会自动创建数据库
- 上传的图片保存在 `public/uploads/`
- 对话历史自动保存
- 支持多张图片上传（最多 3 张）
- 可以随时创建新对话开始新的任务

## 🆘 需要帮助？

- 查看项目文档
- 提交 GitHub Issue
- 查看控制台错误日志

祝使用愉快！🎉
