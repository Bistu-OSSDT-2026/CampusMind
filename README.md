# CampusMind - 校园学业规划助手

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

### 📚 预置数据示例

系统启动时已预置以下示例数据，可直接体验所有功能：

**课程数据（3门）：**

| 课程名称 | 教师 | 上课时间 | 地点 |
|---------|------|---------|------|
| 高等数学 | 张教授 | 周一/周三/周五 第1-2节 (08:00-09:40) | 教学楼A101 |
| 大学物理 | 李教授 | 周二/周四 第3-4节 (10:00-12:00) | 物理系楼B203 |
| 线性代数 | 王教授 | 周二/周五 第6-7节 (13:30-15:20) | 数学楼C305 |

**死线数据（3个 + 1个考试场景）：**

| 死线名称 | 类型 | 科目 | 截止时间 | 倒计时 |
|---------|------|------|---------|--------|
| 高数作业 P132 | 作业 | 高等数学 | 下周二 | D-1 |
| 物理实验报告 | 作业 | 大学物理 | 下周三 | D-2 |
| 高数期中考试 | **考试** | 高等数学 | **下周五** | D-4 |

### 💬 对话指令示例

| 指令 | 功能 | 预期回复示例 |
|------|------|-------------|
| "下节课是什么？" | 查询下节课 | "下节课是【高等数学】，在教学楼A101，08:00-09:40上课" |
| "今天有几节课？" | 查询今日课程 | 列出今日所有课程及时间 |
| "周五考高数" | 创建考试死线 | "已为您创建高数考试死线，距离考试还有4天" |
| "帮我生成复习计划" | 生成复习计划 | 生成详细的复习计划，包含每日任务 |
| "今天有什么任务？" | 今日概览 | 汇总显示今日课程和紧迫死线 |
| "今天看完了" | 打卡反馈 | "打卡完成！继续保持~" |
| "开始复习" | 进入复习模式 | 显示复习建议和学习资源 |
| "食堂在哪？" | 边界问题 | "抱歉，我只能帮您处理学业相关的问题~" |

### ⏰ 死线管理操作

1. **查看死线**：在侧边栏「紧迫死线」区域查看所有待完成任务
2. **展开详情**：点击死线卡片展开操作按钮
3. **标记完成**：点击「✓ 标记完成」按钮，任务从列表移除
4. **延期一天**：点击「⏱ 延期一天」按钮，截止日期延后24小时
5. **倒计时颜色**：
   - 🔴 D-0（今天）：红色紧急
   - 🟠 D-1（明天）：橙色警告
   - 🟡 D-2~3（近期）：黄色提醒
   - 🔵 D-4~7（一周内）：蓝色正常

### 📋 智能复习计划生成

1. 确保存在考试类型的死线
2. 在对话框输入"帮我生成复习计划"
3. 系统自动分析距离考试天数
4. 生成每日学习任务安排（避开课程时段）
5. 包含知识点复习和练习题建议

### 🎯 快速操作入口

侧边栏提供快捷指令按钮，一键触发常用功能：
- 📅 下节课是什么？
- 📋 帮我生成复习计划
- ⏰ 周五考高数
- ✏️ 今天有什么作业？

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

## 📦 下载与安装

### 前置条件

在下载和运行本项目之前，请确保您的系统已安装以下软件：

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.0.0 | JavaScript运行时环境 |
| npm | >= 9.0.0 | Node.js包管理器 |
| Git | >= 2.30.0 | 版本控制工具 |
| PostgreSQL | >= 14.0 (可选) | 数据库（生产环境需要） |
| Redis | >= 7.0 (可选) | 缓存服务（生产环境需要） |
| Docker & Docker Compose | 最新版 (可选) | 容器化部署 |

### 环境配置

#### 1. 克隆仓库

```bash
# 克隆仓库到本地
git clone https://github.com/Bistu-OSSDT-2026/CampusMind.git

# 进入项目目录
cd CampusMind
```

#### 2. 安装依赖

```bash
# 安装项目依赖
npm install
```

#### 3. 配置环境变量

复制示例环境变量文件并修改配置：

```bash
# 创建环境变量文件
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置（生产环境必需，开发环境可选）
DATABASE_URL="postgresql://username:password@localhost:5432/campusmind"

# Redis配置（生产环境必需，开发环境可选）
REDIS_URL="redis://localhost:6379"

# OpenAI API Key（启用AI智能功能必需）
OPENAI_API_KEY="your-openai-api-key"

# 用户ID（测试用，默认即可）
NEXT_PUBLIC_USER_ID="test-user-1"
```

#### 4. 数据库初始化（可选）

如果使用数据库，请执行以下步骤：

```bash
# 创建数据库表
npx prisma migrate dev

# 导入预置数据（3门课程 + 3个死线 + 1个考试场景）
npx prisma db seed
```

#### 5. 启动开发服务器

```bash
# 启动开发服务器（默认端口3000）
npm run dev
```

访问 http://localhost:3000 查看应用。

#### 6. 构建生产版本

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Docker部署（推荐）

使用Docker一键部署：

```bash
# 启动所有服务（应用、PostgreSQL、Redis）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 注意事项

> **⚠️ 仅下载Tag不够**
> 
> 本项目是一个完整的Web应用，仅下载Tag源代码无法直接运行，还需要：
> 
> 1. **安装依赖** - 运行 `npm install` 安装所有必要的npm包
> 2. **配置环境变量** - 创建 `.env` 文件并配置必要的环境变量
> 3. **数据库初始化**（可选）- 如果需要使用数据库，执行Prisma迁移和数据导入
> 4. **构建项目** - 运行 `npm run build` 编译项目

### 🚀 下载最新版本

本项目的最新稳定版本已发布，您可以通过以下方式获取：

- **GitHub Releases**: [https://github.com/Bistu-OSSDT-2026/CampusMind/releases/tag/v1.1.0](https://github.com/Bistu-OSSDT-2026/CampusMind/releases/tag/v1.1.0)
- **直接克隆**: `git clone --branch v1.1.0 https://github.com/Bistu-OSSDT-2026/CampusMind.git`

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