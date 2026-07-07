# GuardGPA 校园学业规划助手 - 开发任务清单

> **三天开发计划** | **全栈框架：Next.js 14** | **数据库：PostgreSQL + Prisma** | **缓存：Redis**

---

## 分工总览

| 分工类别 | 负责任务 | 天数 |
|---------|---------|------|
| 项目协调与版本集成 | D1-1, D3-5 | Day1, Day3 |
| 核心功能开发 | D2-2, D2-3, D2-4, D3-1 | Day2, Day3 |
| 前端页面开发 | D1-4, D2-5, D3-3 | Day1, Day2, Day3 |
| 后端或接口开发 | D1-2, D1-3, D2-1 | Day1, Day2 |
| 数据处理 | D3-2 | Day3 |
| 测试与问题处理 | D3-5 | Day3 |
| CI与自动化检查 | D3-4 (部分) | Day3 |
| 项目文档 | D3-4 (部分) | Day3 |
| 版本发布 | D3-5 | Day3 |

---

## 一、项目协调与版本集成

### D1-1：项目初始化

**文件路径**：
- `/package.json`
- `/tsconfig.json`
- `/tailwind.config.ts`
- `/postcss.config.js`
- `/prisma/schema.prisma`
- `/docker-compose.yml`
- `/.env.example`
- `/.gitignore`
- `/LICENSE`

**具体任务**：
1. 使用 `npx create-next-app@14.2.5 . --typescript --tailwind` 创建项目
2. 安装依赖：`@prisma/client`, `prisma`, `ioredis`, `openai`, `zod`
3. 配置 Tailwind CSS 3
4. 创建 Prisma schema（User, Course, Deadline, Plan, DailyTask, DialogSession, DialogMessage）
5. 创建 docker-compose.yml（PostgreSQL:16 + Redis:7）
6. 创建 .env.example 和 .gitignore
7. 创建 LICENSE（MIT）

**输入**：无

**输出**：
- 项目结构完整
- `docker-compose up` 能启动数据库和Redis
- `npx prisma migrate dev` 能成功建表

**验收标准**：
- `npm run dev` 启动成功
- 数据库表全部创建完成
- Docker 容器运行正常

**依赖任务**：无

---

### D3-5：测试部署与版本集成

**文件路径**：
- `/app/api/dialog/message/route.ts`（最终验证）
- `/docker-compose.yml`（验证）
- `/package.json`（版本号更新）

**具体任务**：
1. 核心场景验证：
   - 课表查询："下节课是什么"
   - 死线登记："周五考高数"
   - 计划生成编排："周五考高数，帮我生成复习计划"
   - 边界处理："今天食堂有啥"
2. Docker 部署验证：
   - `docker-compose up` 启动
   - 访问 `http://localhost:3000`
   - 测试核心场景
3. 一键启动验证：
   - `npm run dev`
   - `npx prisma db seed`
   - 测试核心场景
4. 更新版本号：在 package.json 中设置 version 为 "1.0.0"
5. 创建版本标签：`git tag v1.0.0`

**输入**：用户消息

**输出**：验证通过，版本发布

**验收标准**：
- 所有核心场景测试通过
- Docker 部署成功
- 界面能正常展示所有功能
- 版本号已更新

**依赖任务**：D3-1, D3-2, D3-3, D3-4

---

## 二、核心功能开发

### D2-2：意图识别

**文件路径**：
- `/lib/intent.ts`
- `/app/api/dialog/message/route.ts`（修改）

**具体任务**：
1. 创建意图识别模块 `/lib/intent.ts`：
   - 定义意图类型枚举：`course_query`, `deadline_create`, `plan_generate`, `checkin_feedback`, `review_start`, `aggregated_query`, `boundary`
   - 关键词匹配规则：
     - `course_query`: "下节课", "在哪上课", "今天有几节课", "课表", "上课"
     - `deadline_create`: "设个提醒", "考", "作业", "截止", "DDL", "死线"
     - `plan_generate`: "帮我复习", "生成计划", "快炸了", "复习计划"
     - `aggregated_query`: "近期任务", "这周有啥", "今天任务"
     - `boundary`: "食堂", "天气", "吃", "玩", "聊天", "你好", "嗨"
   - 实现 `detectIntent(message: string): IntentType` 函数
2. 修改对话接口，集成意图识别

**输入**：用户消息字符串

**输出**：意图类型枚举值

**验收标准**：
```typescript
// 在 /lib/intent.ts 中添加测试
console.log(detectIntent("下节课是什么")); // course_query
console.log(detectIntent("周五考高数")); // deadline_create
console.log(detectIntent("帮我复习高数")); // plan_generate
console.log(detectIntent("今天食堂有啥")); // boundary
```

**依赖任务**：D2-1

---

### D2-3：工具编排引擎

**文件路径**：
- `/lib/orchestrator.ts`
- `/app/api/dialog/message/route.ts`（修改）

**具体任务**：
1. 创建编排引擎 `/lib/orchestrator.ts`：
   - 定义工具编排规则：
     - `course_query`: 调用 `/api/courses/next` 或 `/api/courses/today`
     - `deadline_create`: 调用 `/api/deadlines`（自动解析日期和科目）
     - `plan_generate`: 先调用 deadline_create → 再调用 available-slots → 最后调用 plan/generate
     - `aggregated_query`: 并行调用 `/api/courses/today` + `/api/deadlines/urgent`
   - 实现 `execute(intent: IntentType, message: string, userId: string): Promise<OrchestrationResult>`
   - 结果组合：将多个工具的返回结果组合成自然语言回复
2. 修改对话接口，集成编排引擎

**输入**：意图类型、用户消息、用户ID

**输出**：编排结果（工具调用链 + 最终回复）

**验收标准**：
```bash
# 测试计划生成编排
curl -X POST http://localhost:3000/api/dialog/message \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"message":"周五考高数，帮我生成复习计划"}'

# 预期返回：包含 actions 数组，显示 B→A→C 的调用链
# {"code":0,"data":{"actions":[{"tool":"deadline","action":"create"},{"tool":"course","action":"available_slots"},{"tool":"plan","action":"generate"}]}}
```

**依赖任务**：D2-1, D2-2, D1-2, D1-3

---

### D2-4：LLM 计划生成

**文件路径**：
- `/prisma/schema.prisma`（补充 Plan, DailyTask 模型）
- `/app/api/plans/generate/route.ts`
- `/lib/llm.ts`
- `/lib/orchestrator.ts`（修改）

**具体任务**：
1. 在 schema.prisma 中定义 Plan 和 DailyTask 模型
2. 创建 LLM 服务 `/lib/llm.ts`：
   - 配置 OpenAI API（支持环境变量配置）
   - 提示词模板（复习计划生成）
   - 结果解析（JSON 格式）
   - 降级策略（LLM不可用时返回规则兜底计划）
3. 创建 `POST /api/plans/generate`：生成复习计划
   - 接收 { ddl_id, outline_image?, self_assessment?, daily_hours_limit? }
   - 查询课表可用时段
   - 调用 LLM 生成计划
   - 保存计划和每日任务到数据库
4. 修改编排引擎，集成计划生成

**输入**：死线ID、可用时段、考试大纲

**输出**：复习计划（计划ID + 每日任务列表）

**验收标准**：
```bash
# 生成计划
curl -X POST http://localhost:3000/api/plans/generate \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"ddl_id":"xxx","daily_hours_limit":4}'

# 预期返回：{"code":0,"data":{"plan_id":"xxx","tasks":[...]}}

# LLM不可用时测试降级
# 设置 OPENAI_API_KEY=invalid
# 预期返回规则兜底计划（按时间均分知识点）
```

**依赖任务**：D2-3, D1-1

---

### D3-1：边界处理

**文件路径**：
- `/lib/intent.ts`（修改）
- `/lib/orchestrator.ts`（修改）

**具体任务**：
1. 扩展意图识别：增加更多边界关键词
2. 在编排引擎中添加边界处理逻辑：
   - 识别到 boundary 意图时，执行柔性拒绝
   - 查询当前最紧迫的死线
   - 构造引导回复："我只管帮你防挂科～对了，你{死线描述}，现在还剩{时间}。"
3. 添加指令模糊处理：意图不明确时追问必要参数（科目、时间）

**输入**：非学业消息

**输出**：礼貌拒绝 + 引导回复

**验收标准**：
```bash
# 测试边界处理
curl -X POST http://localhost:3000/api/dialog/message \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"message":"今天食堂有啥好吃的"}'

# 预期返回："我只管帮你防挂科～对了，你高数考试明天09:00截止，现在还剩15小时。"

# 测试模糊指令
curl -X POST http://localhost:3000/api/dialog/message \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"message":"帮我生成计划"}'

# 预期返回："请问是哪门课的考试？考试日期是什么时候？"
```

**依赖任务**：D2-2, D2-3

---

## 三、前端页面开发

### D1-4：前端基础

**文件路径**：
- `/app/page.tsx`
- `/components/ChatMessage.tsx`
- `/components/ChatInput.tsx`
- `/components/Sidebar.tsx`
- `/components/MessageList.tsx`
- `/lib/api.ts`
- `/types/index.ts`

**具体任务**：
1. 创建类型定义 `/types/index.ts`：
   - `Message { id, role, content, intent?, actions?, createdAt }`
   - `Course { id, name, teacher, location, weekday, start_period, end_period }`
   - `Deadline { id, type, subject, deadline_time, countdown_days, status }`
2. 创建 API 客户端 `/lib/api.ts`：封装 fetch 请求，自动携带 X-User-Id
3. 创建 `ChatMessage` 组件：接收 `{ role, content, intent }` props，渲染气泡样式
4. 创建 `ChatInput` 组件：输入框 + 发送按钮，调用 API 发送消息
5. 创建 `MessageList` 组件：消息列表，自动滚动到底部
6. 创建 `Sidebar` 组件：显示今日课程和紧迫死线
7. 更新 `page.tsx`：整合侧边栏 + 聊天区域布局

**输入**：组件 props

**输出**：React 组件

**验收标准**：
- 页面显示聊天界面（左侧侧边栏 + 右侧聊天区）
- 消息气泡区分用户（蓝色）和助手（灰色）
- 输入框能输入并发送消息
- 侧边栏显示今日课程和紧迫死线

**依赖任务**：D1-1

---

### D2-5：前端联调

**文件路径**：
- `/components/ChatInput.tsx`（修改）
- `/components/MessageList.tsx`（修改）
- `/components/Sidebar.tsx`（修改）
- `/app/page.tsx`（修改）

**具体任务**：
1. 修改 `ChatInput`：调用 `/api/dialog/message`，显示加载状态
2. 修改 `MessageList`：显示助手回复中的 actions（工具调用链）
3. 修改 `Sidebar`：实时刷新今日课程和紧迫死线
4. 添加错误处理：网络错误、API 错误提示
5. 添加消息时间戳
6. 实现自动滚动到最新消息

**输入**：用户输入消息

**输出**：完整的聊天界面交互

**验收标准**：
- 用户发送消息后显示加载状态
- 助手回复包含工具调用链可视化
- 侧边栏实时更新
- 网络错误时有友好提示
- 消息自动滚动到底部

**依赖任务**：D2-1, D2-3, D2-4, D1-4

---

### D3-3：演示优化

**文件路径**：
- `/components/ChatMessage.tsx`（修改）
- `/components/Sidebar.tsx`（修改）
- `/app/globals.css`（修改）
- `/lib/api.ts`（修改）

**具体任务**：
1. 美化聊天界面：添加渐变背景、消息气泡阴影
2. 添加工具调用链可视化（在助手回复下方显示调用的工具）
3. 添加消息状态（已发送/加载中/失败）
4. 侧边栏添加 D-N 标签（如 D-4）
5. 响应式设计：移动端隐藏侧边栏
6. 添加每日任务卡片样式
7. 优化加载状态动画

**输入**：组件 props

**输出**：美化后的界面

**验收标准**：
- 界面美观，符合现代设计风格
- 工具调用链清晰可见
- 移动端适配良好
- D-N 标签显示正确

**依赖任务**：D2-5

---

## 四、后端或接口开发

### D1-2：课表模块

**文件路径**：
- `/prisma/schema.prisma`（补充 Course 模型）
- `/app/api/courses/route.ts`
- `/app/api/courses/today/route.ts`
- `/app/api/courses/next/route.ts`
- `/app/api/courses/available-slots/route.ts`
- `/lib/prisma.ts`

**具体任务**：
1. 在 schema.prisma 中定义 Course 模型：
   - id (UUID, PK), name (String), teacher (String, optional), location (String, optional)
   - weekday (Int, 1-7), start_period (Int), end_period (Int), week_range (String, optional)
   - user_id (UUID, FK to User)
2. 创建 Prisma 客户端实例 `/lib/prisma.ts`
3. 创建 `POST /api/courses`：手动录入课程，接收 {name, teacher, location, weekday, start_period, end_period}
4. 创建 `GET /api/courses`：查询课表列表，支持分页
5. 创建 `GET /api/courses/today`：查询今日课程
6. 创建 `GET /api/courses/next`：查询下节课
7. 创建 `GET /api/courses/available-slots?start_date=&end_date=`：计算可用复习时段

**输入**：HTTP 请求

**输出**：JSON 响应

**验收标准**：
```bash
# 创建课程
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"name":"高等数学","teacher":"张教授","location":"教学楼A101","weekday":1,"start_period":1,"end_period":2}'

# 预期返回：{"code":0,"data":{"course_id":"xxx",...}}

# 查询今日课程
curl -H "X-User-Id: test-user-1" http://localhost:3000/api/courses/today
# 预期返回：今日课程列表，按时间排序

# 查询可用时段
curl "http://localhost:3000/api/courses/available-slots?start_date=2026-07-07&end_date=2026-07-11"
# 预期返回：每日可用复习时段列表
```

**依赖任务**：D1-1

---

### D1-3：死线模块

**文件路径**：
- `/prisma/schema.prisma`（补充 Deadline 模型）
- `/app/api/deadlines/route.ts`
- `/app/api/deadlines/urgent/route.ts`
- `/app/api/deadlines/[id]/route.ts`

**具体任务**：
1. 在 schema.prisma 中定义 Deadline 模型：
   - id (UUID, PK), type (String: homework/exam/other), subject (String)
   - course_id (UUID, optional), deadline_time (DateTime), weight (Int, 1-5)
   - status (String: pending/completed/expired), description (String, optional)
   - user_id (UUID, FK to User)
2. 创建 `POST /api/deadlines`：创建死线，接收 {type, subject, deadline_time, weight}
3. 创建 `GET /api/deadlines`：查询死线列表，按 deadline_time 排序
4. 创建 `GET /api/deadlines/urgent`：查询紧迫死线（D-7 以内）
5. 创建 `PUT /api/deadlines/[id]`：更新死线
6. 创建 `PUT /api/deadlines/[id]/complete`：标记完成
7. 创建 `DELETE /api/deadlines/[id]`：删除死线

**输入**：HTTP 请求

**输出**：JSON 响应，包含 countdown_days

**验收标准**：
```bash
# 创建死线
curl -X POST http://localhost:3000/api/deadlines \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"type":"exam","subject":"高等数学","deadline_time":"2026-07-11 09:00:00","weight":5}'

# 预期返回：{"code":0,"data":{"ddl_id":"xxx","countdown_days":4,...}}

# 查询紧迫死线
curl -H "X-User-Id: test-user-1" http://localhost:3000/api/deadlines/urgent
# 预期返回：D-7 以内的死线列表
```

**依赖任务**：D1-1

---

### D2-1：对话接口

**文件路径**：
- `/prisma/schema.prisma`（补充 DialogSession, DialogMessage 模型）
- `/app/api/dialog/message/route.ts`
- `/app/api/dialog/history/route.ts`
- `/app/api/dialog/session/route.ts`
- `/lib/redis.ts`

**具体任务**：
1. 在 schema.prisma 中定义 DialogSession 和 DialogMessage 模型
2. 创建 Redis 客户端 `/lib/redis.ts`
3. 创建 `POST /api/dialog/message`：核心对话入口
   - 接收 { message, session_id?, attachment? }
   - 检查/创建会话
   - 保存用户消息到数据库
   - 返回 { session_id, reply, intent, actions }
4. 创建 `GET /api/dialog/history`：查询对话历史
5. 创建 `GET /api/dialog/session`：获取当前会话状态
6. 创建 `DELETE /api/dialog/session`：结束会话

**输入**：HTTP 请求（用户消息）

**输出**：JSON 响应（助手回复）

**验收标准**：
```bash
# 发送消息
curl -X POST http://localhost:3000/api/dialog/message \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"message":"下节课是什么"}'

# 预期返回：{"code":0,"data":{"session_id":"xxx","reply":"...","intent":"course_query"}}

# 查询历史
curl -H "X-User-Id: test-user-1" http://localhost:3000/api/dialog/history
# 预期返回：消息列表
```

**依赖任务**：D1-1, D1-2, D1-3

---

## 五、数据处理

### D3-2：Mock数据预置

**文件路径**：
- `/prisma/seed.ts`
- `/package.json`（添加 seed 脚本）

**具体任务**：
1. 创建 seed 脚本 `/prisma/seed.ts`：
   - 创建测试用户（user_id: "test-user-1"）
   - 预置课程：高等数学（周一/三/五 08:00-09:40）、大学物理（周二/四 14:00-15:40）、线性代数（周二/五 10:00-11:40）
   - 预置死线：高数作业 P132（本周二截止）、物理实验报告（本周三截止）、高数考试（本周五）
2. 在 package.json 中添加 `"seed": "prisma db seed"`

**输入**：无

**输出**：数据库中预置完整的演示数据

**验收标准**：
```bash
npx prisma db seed

# 验证数据
curl -H "X-User-Id: test-user-1" http://localhost:3000/api/courses
# 预期返回：3门课程

curl -H "X-User-Id: test-user-1" http://localhost:3000/api/deadlines/urgent
# 预期返回：3个死线（2个作业 + 1个考试）
```

**依赖任务**：D1-1, D1-2, D1-3

---

## 六、测试与问题处理

### D3-5：测试与问题处理（同项目协调与版本集成）

**具体任务**：
1. 执行核心场景测试用例
2. 记录并修复发现的问题
3. 回归测试验证修复效果

**测试用例**：
| 用例编号 | 用户输入 | 预期结果 |
|---------|---------|---------|
| TC-01 | "下节课是什么" | 返回下节课名称、地点、时间 |
| TC-02 | "周五考高数" | 创建死线，返回 "已记录：高数考试 周五(D-4)" |
| TC-03 | "周五考高数，帮我生成复习计划" | 编排执行 B→A→C，返回完整复习计划 |
| TC-04 | "今天食堂有啥" | 礼貌拒绝 + 引导到当前最紧迫死线 |
| TC-05 | "帮我生成计划" | 追问必要参数（科目、日期） |

**依赖任务**：D3-1, D3-2, D3-3

---

## 七、CI与自动化检查

### D3-4：CI配置

**文件路径**：
- `/.github/workflows/ci.yml`
- `/eslint.config.js`
- `/prettier.config.js`

**具体任务**：
1. 创建 GitHub Actions CI 配置 `.github/workflows/ci.yml`：
   - 触发条件：push 到 main 分支、PR 提交
   - 执行步骤：安装依赖、TypeScript 类型检查、ESLint 检查、构建验证
2. 配置 ESLint：创建 `/eslint.config.js`
3. 配置 Prettier：创建 `/prettier.config.js`
4. 在 package.json 中添加 lint 脚本

**输入**：无

**输出**：CI 工作流配置文件

**验收标准**：
- GitHub Actions 能正常运行
- ESLint 检查通过
- TypeScript 类型检查通过
- 构建成功

**依赖任务**：D1-1

---

## 八、项目文档

### D3-4：项目文档

**文件路径**：
- `/README.md`
- `/CONTRIBUTING.md`
- `/docker-compose.yml`（完善）
- `/.env.example`（完善）

**具体任务**：
1. 创建 `README.md`：
   - 项目介绍、产品定位
   - 快速开始（环境要求、安装步骤、启动命令）
   - 演示场景说明
   - 功能特性列表
   - 技术栈
   - 截图/GIF（可选，可用文字描述）
2. 创建 `CONTRIBUTING.md`：
   - 代码规范（ESLint + Prettier）
   - PR 流程
   - 分支策略
3. 完善 `docker-compose.yml`：添加应用服务，支持一键启动
4. 完善 `.env.example`：列出所有必要环境变量

**输入**：无

**输出**：完整的 GitHub 协作文档

**验收标准**：
- README 包含完整的快速开始指南
- `docker-compose up` 能一键启动所有服务
- `.env.example` 包含所有环境变量说明

**依赖任务**：D1-1

---

## 九、版本发布

### D3-5：版本发布（同项目协调与版本集成）

**具体任务**：
1. 更新版本号（package.json）
2. 创建版本标签（git tag）
3. 推送到 GitHub
4. 创建 GitHub Release

**验收标准**：
- 版本号已更新为 1.0.0
- GitHub Release 已创建
- 标签已推送

---

## 环境变量清单

```bash
# .env.example
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/guardgpa?schema=public"
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="your-openai-api-key"
NEXT_PUBLIC_USER_ID="test-user-1"
```

---

## 任务依赖关系图

```mermaid
graph TD
    subgraph 项目协调与版本集成
        D1_1[D1-1 项目初始化]
        D3_5[D3-5 测试部署]
    end
    
    subgraph 核心功能开发
        D2_2[D2-2 意图识别]
        D2_3[D2-3 工具编排]
        D2_4[D2-4 LLM计划生成]
        D3_1[D3-1 边界处理]
    end
    
    subgraph 前端页面开发
        D1_4[D1-4 前端基础]
        D2_5[D2-5 前端联调]
        D3_3[D3-3 演示优化]
    end
    
    subgraph 后端或接口开发
        D1_2[D1-2 课表模块]
        D1_3[D1-3 死线模块]
        D2_1[D2-1 对话接口]
    end
    
    subgraph 数据处理
        D3_2[D3-2 Mock数据]
    end
    
    subgraph CI与自动化检查
        D3_4_CI[D3-4 CI配置]
    end
    
    subgraph 项目文档
        D3_4_DOC[D3-4 项目文档]
    end
    
    D1_1 --> D1_2
    D1_1 --> D1_3
    D1_1 --> D1_4
    D1_1 --> D3_4_CI
    D1_1 --> D3_4_DOC
    
    D1_2 --> D2_3
    D1_3 --> D2_3
    
    D2_1 --> D2_2
    D2_1 --> D2_5
    
    D2_2 --> D2_3
    D2_3 --> D2_4
    D2_4 --> D2_5
    D1_4 --> D2_5
    
    D3_1 --> D3_5
    D3_2 --> D3_5
    D3_3 --> D3_5
    D3_4_CI --> D3_5
    D3_4_DOC --> D3_5
```

---

*— 任务清单结束 —*