# 贡献指南

欢迎参与 GuardGPA 校园学业规划助手项目的开发！本指南旨在帮助团队成员高效协作，确保代码质量和工作流程顺畅。

---

## 目录

- [分支管理](#分支管理)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [代码审查](#代码审查)
- [开发环境](#开发环境)
- [代码规范](#代码规范)
- [分工说明](#分工说明)

---

## 分支管理

### 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|---------|---------|------|
| 功能开发 | `feature/任务编号-功能名` | `feature/d1-2-course-module` |
| Bug修复 | `fix/问题描述` | `fix/course-api-error` |
| 文档更新 | `docs/文档名` | `docs/readme-update` |
| 重构 | `refactor/模块名` | `refactor/dialog-module` |

### 分支流程

```
main (保护分支)
    ↓
feature/d1-2-course-module (开发分支)
    ↓
创建 Pull Request
    ↓
代码审查通过
    ↓
合并到 main
```

### 操作步骤

```bash
# 1. 从 main 创建新分支
git checkout main
git pull origin main
git checkout -b feature/d1-2-course-module

# 2. 开发完成后提交
git add .
git commit -m "feat(d1-2): 实现课表模块CRUD"

# 3. 推送到远程
git push -u origin feature/d1-2-course-module

# 4. 创建 Pull Request
# 在 GitHub 上创建 PR，目标分支为 main
```

---

## 提交规范

### 提交格式

```
<类型>(<任务编号>): <描述>

<详细说明>

关联 Issue: #123
```

### 类型说明

| 类型 | 说明 | 示例 |
|-----|------|------|
| `feat` | 新功能 | `feat(d1-2): 实现课表查询API` |
| `fix` | 修复Bug | `fix(d2-1): 修复对话接口返回错误` |
| `docs` | 文档更新 | `docs: 更新README快速开始` |
| `refactor` | 代码重构 | `refactor(d2-3): 优化工具编排逻辑` |
| `test` | 测试代码 | `test(d1-2): 添加课表API测试` |
| `chore` | 构建/CI | `chore: 更新Docker配置` |
| `style` | 代码样式 | `style: 格式化代码` |

### 示例

```
feat(d1-2): 实现课表模块CRUD

- 创建 Course 模型和数据库迁移
- 实现 POST /api/courses 课程录入接口
- 实现 GET /api/courses/today 今日课程查询
- 实现 GET /api/courses/available-slots 可用时段计算

关联 Issue: #1
```

---

## Pull Request 流程

### 1. 创建 PR

- 从功能分支推送到远程后，在 GitHub 上创建 PR
- PR 标题格式：`feat(d1-2): 实现课表模块`
- 使用 `.github/PULL_REQUEST_TEMPLATE.md` 模板填写内容
- 在 PR 描述中关联对应的 Issue

### 2. 代码审查

- PR 创建后，自动通知 CODEOWNERS 进行审查
- 至少需要 1 位 Reviewer 批准才能合并
- Reviewer 需检查：
  - 代码是否符合规范
  - 功能是否完整
  - 是否有足够的测试覆盖
  - 是否有潜在的 Bug

### 3. 合并 PR

- 通过审查后，由负责人或 Reviewer 合并
- 使用 "Squash and Merge" 方式合并
- 删除合并后的功能分支

---

## 代码审查

### 审查要求

1. **代码质量**：逻辑清晰，变量命名规范，无冗余代码
2. **类型安全**：TypeScript 类型检查通过
3. **测试覆盖**：核心功能有测试用例
4. **文档完整**：关键函数和接口有注释
5. **安全性**：无敏感信息泄露，输入验证完善

### 审查评论规范

- 提出具体问题，避免模糊表述
- 提供改进建议，必要时给出代码示例
- 对需要修改的内容使用 "Request changes"
- 对无需修改的内容使用 "Approve"

---

## 开发环境

### 环境要求

- Node.js >= 20
- npm >= 10
- Docker Desktop (用于数据库)

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/Bistu-OSSDT-2026/CampusMind
cd CampusMind

# 2. 安装依赖
npm install

# 3. 启动数据库
docker-compose up -d

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，填写 OPENAI_API_KEY

# 5. 数据库迁移
npx prisma migrate dev

# 6. 运行开发服务器
npm run dev
```

### 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 类型检查
npx tsc --noEmit

# Prisma 相关
npx prisma migrate dev    # 创建迁移
npx prisma studio        # 数据库可视化
npx prisma db seed       # 运行seed脚本
```

---

## 代码规范

### TypeScript 规范

- 使用 `const` 而非 `let`，除非需要重新赋值
- 为函数参数和返回值添加类型注解
- 使用接口而非类型别名定义对象结构
- 避免使用 `any`，使用 `unknown` 并进行类型守卫

### React 规范

- 使用函数组件和 Hooks
- 组件命名使用 PascalCase
- 文件命名使用 PascalCase（组件）或 kebab-case（工具函数）
- 使用 Tailwind CSS 进行样式设计

### API 规范

- 使用 RESTful 风格
- 响应格式统一：`{ code: number, data: any, message?: string }`
- 错误码：
  - `0`：成功
  - `1`：参数错误
  - `2`：业务错误
  - `500`：服务器错误

---

## 分工说明

### 分工列表

| 分工类别 | 负责模块 | 目录 |
|---------|---------|------|
| 项目协调与版本集成 | 项目初始化、部署集成 | `/` |
| 核心功能开发 | 意图识别、工具编排、LLM计划生成、边界处理 | `/lib/` |
| 前端页面开发 | 聊天界面、组件开发 | `/components/`, `/app/` |
| 后端或接口开发 | API路由、数据库操作 | `/app/api/`, `/lib/prisma.ts` |
| 数据处理 | Mock数据、数据库迁移 | `/prisma/`, `/prisma/seed.ts` |
| 测试与问题处理 | 测试用例、Bug修复 | `/tests/` |
| CI与自动化检查 | CI配置、代码检查 | `.github/workflows/` |
| 项目文档 | README、CONTRIBUTING | `/` |
| 版本发布 | 版本管理、发布流程 | `/` |

### CODEOWNERS

按分工模块指定代码审查责任人：

- `app/api/` - 后端开发负责人
- `components/` - 前端开发负责人
- `lib/` - 核心功能开发负责人
- `prisma/` - 数据处理负责人

---

## 问题反馈

如果在开发过程中遇到问题：

1. 首先查看相关文档和代码注释
2. 在团队群中询问
3. 创建 Issue 描述问题，附上截图和错误日志

---

感谢你的贡献！🚀