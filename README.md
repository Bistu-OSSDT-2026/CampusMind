# CampusMind - 校园学业规划助手

![CampusMind Logo](https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20education%20app%20icon%20with%20graduation%20cap%20and%20calendar&image_size=square)

CampusMind 是一款面向大学生的智能学业规划助手，帮助学生高效管理课程、追踪死线、生成个性化复习计划。

## ✨ 功能特性

### 📚 课程管理
- 查询今日课程安排
- 查询下节课信息
- 完整课表展示
- 添加新课程

### ⏰ 死线管理
- 自动识别紧迫死线（7天内）
- 支持作业、考试等多种类型
- 标记完成/延期操作
- 倒计时提醒

### 📋 智能复习计划
- 根据考试日期自动生成复习计划
- 分析薄弱知识点
- 每日学习任务分配
- 避开课程时段

### 💬 自然语言交互
- 支持中文自然语言查询
- 智能意图识别
- 多轮对话支持
- 上下文理解

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 14 (App Router) |
| 前端语言 | TypeScript |
| 样式方案 | Tailwind CSS 3 |
| 状态管理 | React Hooks |
| 数据库 | PostgreSQL (Prisma ORM) |
| 缓存 | Redis |
| AI集成 | OpenAI GPT-4o-mini |
| 部署 | Docker + GitHub Actions |

## 📁 项目结构

```
CampusMind/
├── app/
│   ├── api/           # API路由
│   │   ├── courses/   # 课程接口
│   │   ├── deadlines/ # 死线接口
│   │   └── dialog/    # 对话接口
│   ├── layout.tsx     # 布局组件
│   └── page.tsx       # 主页面
├── components/        # 前端组件
│   ├── Sidebar.tsx    # 侧边栏
│   ├── ChatInput.tsx  # 聊天输入
│   ├── MessageList.tsx # 消息列表
│   └── ChatMessage.tsx # 消息气泡
├── lib/               # 核心逻辑
│   ├── api.ts         # API封装
│   ├── intent.ts      # 意图识别
│   ├── orchestrator.ts # 编排引擎
│   ├── llm.ts         # LLM调用
│   ├── prisma.ts      # Prisma客户端
│   ├── redis.ts       # Redis客户端
│   └── logger.ts      # 日志工具
├── types/             # TypeScript类型定义
├── prisma/            # Prisma配置
└── public/            # 静态资源
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9
- PostgreSQL (可选，用于生产环境)
- Redis (可选，用于缓存)

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/Bistu-OSSDT-2026/CampusMind.git
cd CampusMind

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env
```

### 环境变量配置

编辑 `.env` 文件：

```env
# 数据库配置（可选）
DATABASE_URL="postgresql://user:password@localhost:5432/campusmind"

# Redis配置（可选）
REDIS_URL="redis://localhost:6379"

# OpenAI API Key（启用AI功能）
OPENAI_API_KEY="your-openai-api-key"

# 用户ID（测试用）
NEXT_PUBLIC_USER_ID="test-user-1"
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 📖 使用说明

### 基础对话指令

| 指令示例 | 功能 |
|----------|------|
| "下节课是什么？" | 查询下节课信息 |
| "今天有几节课？" | 查询今日课程 |
| "周五考高数" | 创建考试死线 |
| "帮我生成复习计划" | 生成复习计划 |
| "今天有什么任务？" | 今日概览 |
| "今天看完了" | 打卡反馈 |

### 死线管理

1. 在侧边栏查看紧迫死线列表
2. 点击死线卡片展开操作按钮
3. 点击「标记完成」移除已完成任务
4. 点击「延期一天」延长截止日期

### 课程查询

- 通过对话查询课程信息
- 支持查询今日课程和下节课
- 自动避开课程时段安排复习

## 🧪 测试用例

### 功能测试

| 测试场景 | 输入 | 预期输出 |
|----------|------|----------|
| 查询下节课 | "下节课是什么？" | 返回下节课名称、地点、时间 |
| 创建死线 | "周五考高数" | 创建高数考试死线，显示倒计时 |
| 生成计划 | "帮我生成复习计划" | 生成详细复习计划 |
| 今日概览 | "今天有什么任务？" | 显示课程和死线汇总 |
| 标记完成 | 点击「标记完成」 | 死线从列表移除 |

### 边界测试

| 测试场景 | 输入 | 预期输出 |
|----------|------|----------|
| 无课程 | "今天有课吗？" | 返回"今天没有课程安排" |
| 无死线 | "帮我生成复习计划" | 提示创建死线 |
| 空输入 | "" | 不发送消息 |
| 超长消息 | 1000字符以上 | 正常处理 |
| 边界问题 | "食堂在哪？" | 友好的边界回复 |

## 🐳 Docker部署

### 启动服务

```bash
docker-compose up -d
```

### 停止服务

```bash
docker-compose down
```

### 查看日志

```bash
docker-compose logs -f
```

## 🔄 CI/CD

项目使用 GitHub Actions 自动构建和部署：

- **推送main分支**：自动执行构建和测试
- **创建Release**：自动部署到生产环境

## 📝 API文档

### 课程接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/courses` | 查询全部课程 |
| GET | `/api/courses/today` | 查询今日课程 |
| GET | `/api/courses/next` | 查询下节课 |
| POST | `/api/courses` | 创建课程 |

### 死线接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/deadlines` | 查询全部死线 |
| GET | `/api/deadlines/urgent` | 查询紧迫死线 |
| POST | `/api/deadlines` | 创建死线 |
| PUT | `/api/deadlines/:id` | 更新死线 |
| PUT | `/api/deadlines/:id/complete` | 标记完成 |
| DELETE | `/api/deadlines/:id` | 删除死线 |

### 对话接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/dialog/message` | 发送消息 |
| GET | `/api/dialog/history` | 查询历史 |
| POST | `/api/dialog/session` | 创建会话 |

## 🤝 贡献指南

1. Fork 仓库
2. 创建分支 `git checkout -b feature/xxx`
3. 提交更改 `git commit -m "feat: xxx"`
4. 推送到远程 `git push origin feature/xxx`
5. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。