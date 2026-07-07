# GitHub Issues 任务清单

以下是所有任务的 Issue 内容，可直接复制到 GitHub Issue 创建页面使用。

---

## 成员1 任务

### Issue 1: D1-1 - 项目初始化（Next.js + Prisma + Docker）

**标题**: `任务 [D1-1]: 项目初始化（Next.js + Prisma + Docker）`

**标签**: `项目协调`, `D1`, `已完成`

**正文**:

```markdown
## 任务信息

- **任务编号**: D1-1
- **负责人**: 成员1
- **所属分工**: 项目协调与版本集成

## 任务描述

创建 Next.js 项目，配置 Prisma ORM、Docker 容器化、Tailwind CSS 等基础设施。

## 文件路径

- `/package.json`
- `/prisma/schema.prisma`
- `/docker-compose.yml`
- `/.env.example`
- `/.gitignore`
- `/LICENSE`

## 验收标准

1. [ ] 使用 `npx create-next-app@14.2.5 . --typescript --tailwind` 创建项目
2. [ ] 安装依赖：`@prisma/client`, `prisma`, `ioredis`, `openai`, `zod`
3. [ ] 创建 Prisma schema（7个模型）
4. [ ] 创建 docker-compose.yml（PostgreSQL:16 + Redis:7）
5. [ ] 创建 .env.example 和 .gitignore
6. [ ] `npm run dev` 启动成功

## 依赖任务

- 无

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 2: D3-4 - CI与自动化检查 + 项目文档

**标题**: `任务 [D3-4]: CI与自动化检查 + 项目文档`

**标签**: `CI/CD`, `文档`, `D3`, `已完成`

**正文**:

```markdown
## 任务信息

- **任务编号**: D3-4
- **负责人**: 成员1
- **所属分工**: CI与自动化检查、项目文档

## 任务描述

配置 CI 工作流和完善项目文档。

## 文件路径

- `/.github/workflows/ci.yml`
- `/README.md`
- `/CONTRIBUTING.md`
- `/docker-compose.yml`（完善）
- `/.env.example`（完善）

## 验收标准

1. [ ] GitHub Actions CI 配置（TypeScript 类型检查 + 构建验证）
2. [ ] 完善 README.md（项目介绍、快速开始、演示场景）
3. [ ] 完善 CONTRIBUTING.md（代码规范、PR流程、分支策略）
4. [ ] 完善 docker-compose.yml（一键启动所有服务）
5. [ ] 完善 .env.example（所有环境变量说明）

## 依赖任务

- D1-1

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 3: D3-5-1 - 测试部署与版本集成

**标题**: `任务 [D3-5-1]: 测试部署与版本集成`

**标签**: `部署`, `发布`, `D3`

**正文**:

```markdown
## 任务信息

- **任务编号**: D3-5-1
- **负责人**: 成员1
- **所属分工**: 项目协调与版本集成、版本发布

## 任务描述

进行测试部署、版本集成和版本发布。

## 文件路径

- `/package.json`（版本号更新）

## 验收标准

1. [ ] 核心场景验证（课表查询、死线登记、计划生成、边界处理）
2. [ ] Docker 部署验证
3. [ ] 一键启动验证
4. [ ] 更新版本号为 1.0.0
5. [ ] 创建版本标签
6. [ ] 创建 GitHub Release

## 依赖任务

- D3-1, D3-2, D3-3, D3-4

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

## 成员2 任务

### Issue 4: D2-2 - 意图识别（关键词匹配）

**标题**: `任务 [D2-2]: 意图识别（关键词匹配）`

**标签**: `核心功能`, `D2`

**正文**:

```markdown
## 任务信息

- **任务编号**: D2-2
- **负责人**: 成员2
- **所属分工**: 核心功能开发

## 任务描述

实现意图识别模块，使用关键词匹配识别用户意图。

## 文件路径

- `/lib/intent.ts`
- `/app/api/dialog/message/route.ts`（修改）

## 验收标准

1. [ ] 定义意图类型枚举（course_query, deadline_create, plan_generate, aggregated_query, boundary）
2. [ ] 实现关键词匹配规则
3. [ ] 实现 detectIntent(message: string): IntentType 函数
4. [ ] 集成到对话接口

## 测试用例

```typescript
detectIntent("下节课是什么"); // course_query
detectIntent("周五考高数"); // deadline_create
detectIntent("帮我复习高数"); // plan_generate
detectIntent("今天食堂有啥"); // boundary
```

## 依赖任务

- D2-1

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 5: D2-3 - 工具编排引擎（B→A→C串联执行）

**标题**: `任务 [D2-3]: 工具编排引擎（B→A→C串联执行）`

**标签**: `核心功能`, `D2`

**正文**:

```markdown
## 任务信息

- **任务编号**: D2-3
- **负责人**: 成员2
- **所属分工**: 核心功能开发

## 任务描述

实现工具编排引擎，支持多工具串联执行。

## 文件路径

- `/lib/orchestrator.ts`
- `/app/api/dialog/message/route.ts`（修改）

## 验收标准

1. [ ] 定义工具编排规则
2. [ ] 实现 execute(intent, message, userId) 函数
3. [ ] 支持 plan_generate 的 B→A→C 串联执行
4. [ ] 支持 aggregated_query 的并行调用
5. [ ] 结果组合成自然语言回复

## 测试用例

```bash
curl -X POST http://localhost:3000/api/dialog/message \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"message":"周五考高数，帮我生成复习计划"}'
```

## 依赖任务

- D2-1, D2-2, D1-2, D1-3

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 6: D2-4 - LLM计划生成（提示词 + 结果解析 + 降级）

**标题**: `任务 [D2-4]: LLM计划生成（提示词 + 结果解析 + 降级）`

**标签**: `核心功能`, `D2`

**正文**:

```markdown
## 任务信息

- **任务编号**: D2-4
- **负责人**: 成员2
- **所属分工**: 核心功能开发

## 任务描述

实现 LLM 复习计划生成功能，包括提示词模板、结果解析和降级策略。

## 文件路径

- `/prisma/schema.prisma`（补充 Plan, DailyTask 模型）
- `/app/api/plans/generate/route.ts`
- `/lib/llm.ts`
- `/lib/orchestrator.ts`（修改）

## 验收标准

1. [ ] 创建 LLM 服务（配置 OpenAI API）
2. [ ] 设计提示词模板
3. [ ] 实现结果解析（JSON格式）
4. [ ] 实现降级策略（LLM不可用时返回规则兜底计划）
5. [ ] 创建 POST /api/plans/generate 接口

## 测试用例

```bash
curl -X POST http://localhost:3000/api/plans/generate \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"ddl_id":"xxx","daily_hours_limit":4}'
```

## 依赖任务

- D2-3, D1-1

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 7: D3-1 - 边界处理（柔性拒绝 + 引导）

**标题**: `任务 [D3-1]: 边界处理（柔性拒绝 + 引导）`

**标签**: `核心功能`, `D3`

**正文**:

```markdown
## 任务信息

- **任务编号**: D3-1
- **负责人**: 成员2
- **所属分工**: 核心功能开发

## 任务描述

实现边界处理逻辑，对非学业内容进行柔性拒绝并引导回学业。

## 文件路径

- `/lib/intent.ts`（修改）
- `/lib/orchestrator.ts`（修改）

## 验收标准

1. [ ] 扩展意图识别：增加更多边界关键词
2. [ ] 识别到 boundary 意图时执行柔性拒绝
3. [ ] 查询当前最紧迫的死线
4. [ ] 构造引导回复："我只管帮你防挂科～对了，你{死线描述}，现在还剩{时间}。"
5. [ ] 添加指令模糊处理：意图不明确时追问必要参数

## 测试用例

```bash
curl -X POST http://localhost:3000/api/dialog/message \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"message":"今天食堂有啥好吃的"}'
```

## 依赖任务

- D2-2, D2-3

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

## 成员3 任务

### Issue 8: D1-4 - 聊天界面组件

**标题**: `任务 [D1-4]: 聊天界面组件（ChatMessage、ChatInput、Sidebar、MessageList）`

**标签**: `前端开发`, `D1`

**正文**:

```markdown
## 任务信息

- **任务编号**: D1-4
- **负责人**: 成员3
- **所属分工**: 前端页面开发

## 任务描述

创建聊天界面的核心组件，包括消息气泡、输入框、侧边栏和消息列表。

## 文件路径

- `/app/page.tsx`
- `/components/ChatMessage.tsx`
- `/components/ChatInput.tsx`
- `/components/Sidebar.tsx`
- `/components/MessageList.tsx`
- `/lib/api.ts`
- `/types/index.ts`

## 验收标准

1. [ ] 创建类型定义
2. [ ] 创建 API 客户端
3. [ ] 创建 ChatMessage 组件（接收 role, content, intent props）
4. [ ] 创建 ChatInput 组件（输入框 + 发送按钮）
5. [ ] 创建 MessageList 组件（消息列表，自动滚动）
6. [ ] 创建 Sidebar 组件（显示今日课程和紧迫死线）
7. [ ] 页面显示聊天界面（左侧侧边栏 + 右侧聊天区）

## 依赖任务

- D1-1

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 9: D2-5 - 前端联调

**标题**: `任务 [D2-5]: 前端联调（API调用、加载状态、错误处理）`

**标签**: `前端开发`, `D2`

**正文**:

```markdown
## 任务信息

- **任务编号**: D2-5
- **负责人**: 成员3
- **所属分工**: 前端页面开发

## 任务描述

完成前端与后端的联调，实现完整的聊天交互。

## 文件路径

- `/components/ChatInput.tsx`（修改）
- `/components/MessageList.tsx`（修改）
- `/components/Sidebar.tsx`（修改）
- `/app/page.tsx`（修改）

## 验收标准

1. [ ] 修改 ChatInput：调用 /api/dialog/message，显示加载状态
2. [ ] 修改 MessageList：显示助手回复中的 actions（工具调用链）
3. [ ] 修改 Sidebar：实时刷新今日课程和紧迫死线
4. [ ] 添加错误处理：网络错误、API 错误提示
5. [ ] 添加消息时间戳
6. [ ] 实现自动滚动到最新消息

## 依赖任务

- D2-1, D2-3, D2-4, D1-4

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 10: D3-3 - 演示优化

**标题**: `任务 [D3-3]: 演示优化（界面美化、响应式设计、D-N标签）`

**标签**: `前端开发`, `D3`

**正文**:

```markdown
## 任务信息

- **任务编号**: D3-3
- **负责人**: 成员3
- **所属分工**: 前端页面开发

## 任务描述

优化演示界面，添加美化和响应式设计。

## 文件路径

- `/components/ChatMessage.tsx`（修改）
- `/components/Sidebar.tsx`（修改）
- `/app/globals.css`（修改）
- `/lib/api.ts`（修改）

## 验收标准

1. [ ] 美化聊天界面：渐变背景、消息气泡阴影
2. [ ] 添加工具调用链可视化
3. [ ] 添加消息状态（已发送/加载中/失败）
4. [ ] 侧边栏添加 D-N 标签（如 D-4）
5. [ ] 响应式设计：移动端隐藏侧边栏
6. [ ] 添加每日任务卡片样式
7. [ ] 优化加载状态动画

## 依赖任务

- D2-5

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

## 成员4 任务

### Issue 11: D1-2 - 课表模块

**标题**: `任务 [D1-2]: 课表模块（CRUD + 可用时段计算）`

**标签**: `后端开发`, `D1`

**正文**:

```markdown
## 任务信息

- **任务编号**: D1-2
- **负责人**: 成员4
- **所属分工**: 后端或接口开发

## 任务描述

实现课表模块的 API 接口，包括课程录入、查询、可用时段计算。

## 文件路径

- `/prisma/schema.prisma`（补充 Course 模型）
- `/app/api/courses/route.ts`
- `/app/api/courses/today/route.ts`
- `/app/api/courses/next/route.ts`
- `/app/api/courses/available-slots/route.ts`
- `/lib/prisma.ts`

## 验收标准

1. [ ] 创建 POST /api/courses 课程录入接口
2. [ ] 创建 GET /api/courses 课表列表查询
3. [ ] 创建 GET /api/courses/today 今日课程查询
4. [ ] 创建 GET /api/courses/next 下节课查询
5. [ ] 创建 GET /api/courses/available-slots 可用时段计算

## 测试用例

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"name":"高等数学","teacher":"张教授","location":"教学楼A101","weekday":1,"start_period":1,"end_period":2}'
```

## 依赖任务

- D1-1 项目初始化

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 12: D1-3 - 死线模块

**标题**: `任务 [D1-3]: 死线模块（CRUD + 倒计时）`

**标签**: `后端开发`, `D1`

**正文**:

```markdown
## 任务信息

- **任务编号**: D1-3
- **负责人**: 成员4
- **所属分工**: 后端或接口开发

## 任务描述

实现死线模块的 API 接口，包括死线登记、查询、倒计时计算。

## 文件路径

- `/prisma/schema.prisma`（补充 Deadline 模型）
- `/app/api/deadlines/route.ts`
- `/app/api/deadlines/urgent/route.ts`
- `/app/api/deadlines/[id]/route.ts`

## 验收标准

1. [ ] 创建 POST /api/deadlines 死线登记接口
2. [ ] 创建 GET /api/deadlines 死线列表查询
3. [ ] 创建 GET /api/deadlines/urgent 紧迫死线查询（D-7以内）
4. [ ] 创建 PUT /api/deadlines/[id] 更新死线
5. [ ] 创建 PUT /api/deadlines/[id]/complete 标记完成
6. [ ] 创建 DELETE /api/deadlines/[id] 删除死线

## 测试用例

```bash
curl -X POST http://localhost:3000/api/deadlines \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"type":"exam","subject":"高等数学","deadline_time":"2026-07-11 09:00:00","weight":5}'
```

## 依赖任务

- D1-1 项目初始化

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 13: D2-1 - 对话接口

**标题**: `任务 [D2-1]: 对话接口（消息发送/历史/会话管理）`

**标签**: `后端开发`, `D2`

**正文**:

```markdown
## 任务信息

- **任务编号**: D2-1
- **负责人**: 成员4
- **所属分工**: 后端或接口开发

## 任务描述

实现对话模块的 API 接口，包括消息发送、历史查询、会话管理。

## 文件路径

- `/prisma/schema.prisma`（补充 DialogSession, DialogMessage 模型）
- `/app/api/dialog/message/route.ts`
- `/app/api/dialog/history/route.ts`
- `/app/api/dialog/session/route.ts`
- `/lib/redis.ts`

## 验收标准

1. [ ] 创建 POST /api/dialog/message 消息发送接口
2. [ ] 创建 GET /api/dialog/history 对话历史查询
3. [ ] 创建 GET /api/dialog/session 会话状态查询
4. [ ] 创建 DELETE /api/dialog/session 结束会话

## 测试用例

```bash
curl -X POST http://localhost:3000/api/dialog/message \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-1" \
  -d '{"message":"下节课是什么"}'
```

## 依赖任务

- D1-1, D1-2, D1-3

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

## 成员5 任务

### Issue 14: D3-2 - Mock数据预置

**标题**: `任务 [D3-2]: Mock数据预置（3门课程 + 3个死线 + 1个考试场景）`

**标签**: `数据处理`, `D3`

**正文**:

```markdown
## 任务信息

- **任务编号**: D3-2
- **负责人**: 成员5
- **所属分工**: 数据处理

## 任务描述

创建 seed 脚本，预置完整的演示数据。

## 文件路径

- `/prisma/seed.ts`
- `/package.json`（添加 seed 脚本）

## 验收标准

1. [ ] 创建测试用户（user_id: "test-user-1"）
2. [ ] 预置课程：高等数学、大学物理、线性代数
3. [ ] 预置死线：高数作业、物理实验报告、高数考试
4. [ ] 在 package.json 中添加 "seed": "prisma db seed"

## 测试用例

```bash
npx prisma db seed
curl -H "X-User-Id: test-user-1" http://localhost:3000/api/courses
curl -H "X-User-Id: test-user-1" http://localhost:3000/api/deadlines/urgent
```

## 依赖任务

- D1-1, D1-2, D1-3

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

### Issue 15: D3-5-2 - 测试与问题处理

**标题**: `任务 [D3-5-2]: 测试与问题处理`

**标签**: `测试`, `D3`

**正文**:

```markdown
## 任务信息

- **任务编号**: D3-5-2
- **负责人**: 成员5
- **所属分工**: 测试与问题处理

## 任务描述

执行核心场景测试用例，记录并修复问题。

## 文件路径

- 所有相关文件

## 验收标准

1. [ ] TC-01: "下节课是什么" - 返回下节课信息
2. [ ] TC-02: "周五考高数" - 创建死线提醒
3. [ ] TC-03: "周五考高数，帮我生成复习计划" - 编排执行并生成计划
4. [ ] TC-04: "今天食堂有啥" - 礼貌拒绝并引导
5. [ ] TC-05: "帮我生成计划" - 追问必要参数

## 依赖任务

- D3-1, D3-2, D3-3

## 预计完成时间

- 开始日期: 
- 预计完成: 
```

---

## 使用说明

1. 打开 GitHub 仓库：https://github.com/Bistu-OSSDT-2026/CampusMind/issues
2. 点击 **New issue**
3. 复制上述对应任务的标题和正文
4. 添加标签（参考每个 Issue 的「标签」字段）
5. 分配给对应成员（用户自行处理 @ 艾特）
6. 点击 **Submit new issue**

---

## 标签汇总

| 标签 | 用途 |
|-----|------|
| `D1` | Day 1 任务 |
| `D2` | Day 2 任务 |
| `D3` | Day 3 任务 |
| `前端开发` | 前端相关任务 |
| `后端开发` | 后端相关任务 |
| `核心功能` | 核心功能开发 |
| `数据处理` | 数据处理任务 |
| `测试` | 测试任务 |
| `CI/CD` | CI与自动化检查 |
| `文档` | 文档任务 |
| `部署` | 部署任务 |
| `发布` | 版本发布 |
| `项目协调` | 项目协调任务 |
| `已完成` | 已完成的任务 |