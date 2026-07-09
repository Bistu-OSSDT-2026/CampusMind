# CampusMind 校园学业规划助手

一款帮助大学生制定学期学习计划、追踪课程进度的轻量工具。

---

## 功能特性

- 📅 **课表管理** - 手动录入课程，查询今日课程、下节课
- ⏰ **死线提醒** - 登记作业/考试截止时间，阶梯提醒
- 🤖 **智能计划** - LLM辅助生成复习计划，自动编排时间
- 💬 **对话交互** - 自然语言交互，多工具串联执行
- 📊 **学情复盘** - 学习进度追踪，薄弱点分析

---

## 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript + Tailwind CSS 3
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **LLM**: OpenAI API

---

## 快速开始

### 方法一：Docker一键启动（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/Bistu-OSSDT-2026/CampusMind
cd CampusMind

# 2. 启动所有服务（数据库 + Redis + 应用）
docker-compose up

# 3. 访问应用
# 前端: http://localhost:3000
# Prisma Studio: http://localhost:5555
```

### 方法二：本地开发

#### 环境要求

- Node.js >= 20
- npm >= 10
- Docker Desktop（用于数据库）

#### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/Bistu-OSSDT-2026/CampusMind
cd CampusMind

# 2. 安装依赖
npm install

# 3. 启动数据库
docker-compose up -d postgres redis

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，填写 OPENAI_API_KEY（可选）

# 5. 数据库迁移
npx prisma migrate dev

# 6. 预置Mock数据（可选）
npx prisma db seed

# 7. 运行开发服务器
npm run dev
```

#### 访问地址

- 前端: http://localhost:3000
- Prisma Studio: http://localhost:5555

---

## 项目结构

```
CampusMind/
├── app/                    # Next.js 应用目录
│   ├── courses/            # 课表模块 API
│   ├── deadlines/          # 死线模块 API
│   ├── dialog/             # 对话模块 API
│   ├── plans/             # 计划模块 API
│   ├── components/        # 前端组件
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 布局组件
│   └── page.tsx           # 首页
├── lib/                   # 工具函数
│   ├── prisma.ts          # Prisma 客户端
│   ├── redis.ts           # Redis 客户端
│   ├── intent.ts          # 意图识别
│   ├── orchestrator.ts    # 工具编排引擎
│   ├── llm.ts            # LLM 服务
│   ├── api.ts            # 前端 API 客户端
│   └── logger.ts         # 日志工具
├── prisma/                # Prisma 配置
│   ├── schema.prisma      # 数据模型
│   └── seed.ts           # Mock数据预置
├── types/                 # TypeScript 类型定义
├── .github/               # GitHub 配置
│   ├── workflows/         # CI 工作流
│   ├── ISSUE_TEMPLATE/    # Issue 模板
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
├── docker-compose.yml     # Docker 配置（一键启动）
├── Dockerfile             # Docker 应用镜像
├── .env.example          # 环境变量模板
├── CONTRIBUTING.md       # 贡献指南
└── TASKS.md              # 开发任务清单
```

---

## 核心场景测试

| 用例 | 用户输入 | 预期结果 |
|------|---------|---------|
| TC-01 | "下节课是什么" | 返回下节课信息 |
| TC-02 | "周五考高数" | 创建死线提醒 |
| TC-03 | "周五考高数，帮我生成复习计划" | 编排执行并生成计划 |
| TC-04 | "今天食堂有啥" | 礼貌拒绝并引导 |
| TC-05 | "帮我生成计划" | 追问必要参数 |

---

## 环境变量

```bash
# .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/guardgpa?schema=public"
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="your-openai-api-key"      # 可选，不填则使用Mock数据
NEXT_PUBLIC_USER_ID="test-user-1"
NODE_ENV="development"
```

---

## 开发工作流

### 分支管理

```
main (保护分支)
    ↓
feature/d1-2-course-module (开发分支)
    ↓
创建 Pull Request → 代码审查 → 合并到 main
```

### 提交规范

```
<类型>(<任务编号>): <描述>

详细说明

关联 Issue: #123
```

### 类型说明

| 类型 | 说明 |
|-----|------|
| `feat` | 新功能 |
| `fix` | 修复Bug |
| `docs` | 文档更新 |
| `refactor` | 代码重构 |
| `test` | 测试代码 |
| `chore` | 构建/CI |

---

## 分工说明

| 分工类别 | 负责模块 |
|---------|---------|
| 项目协调与版本集成 | 项目初始化、部署集成 |
| 核心功能开发 | 意图识别、工具编排、LLM计划生成 |
| 前端页面开发 | 聊天界面、组件开发 |
| 后端或接口开发 | API路由、数据库操作 |
| 数据处理 | Mock数据、数据库迁移 |
| 测试与问题处理 | 测试用例、Bug修复 |
| CI与自动化检查 | CI配置、代码检查 |
| 项目文档 | README、CONTRIBUTING |
| 版本发布 | 版本管理、发布流程 |

---

## 许可证

MIT License

---

## 贡献

请参考 [CONTRIBUTING.md](CONTRIBUTING.md) 获取详细的贡献指南。
