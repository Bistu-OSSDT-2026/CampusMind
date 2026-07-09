# 📦 下载与安装

## 前置条件

在下载和运行本项目之前，请确保您的系统已安装以下软件：

| 软件 | 版本要求 | 说明 | 下载链接 |
|------|---------|------|---------|
| Node.js | >= 18.0.0 | JavaScript运行时环境（npm随Node.js一起安装） | [下载](https://nodejs.org/) |
| Git | >= 2.30.0 | 版本控制工具 | [下载](https://git-scm.com/downloads) |
| PostgreSQL | >= 14.0 (可选) | 数据库（生产环境需要） | [下载](https://www.postgresql.org/download/) |
| Redis | >= 7.0 (可选) | 缓存服务（生产环境需要） | [下载](https://redis.io/download/) |
| Docker & Docker Compose | 最新版 (可选) | 容器化部署（推荐使用） | [下载](https://www.docker.com/get-started/) |

> **💡 提示**：npm 会随 Node.js 一起安装，无需单独下载。安装完成后可以通过 `node -v` 和 `npm -v` 验证版本。

## 环境配置

### 1. 克隆仓库

```bash
# 克隆仓库到本地
git clone https://github.com/Bistu-OSSDT-2026/CampusMind.git

# 进入项目目录
cd CampusMind
```

### 2. 安装依赖

```bash
# 安装项目依赖
npm install
```

### 3. 配置环境变量

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

### 4. 数据库初始化（可选）

如果使用数据库，请执行以下步骤：

```bash
# 创建数据库表
npx prisma migrate dev

# 导入预置数据（3门课程 + 3个死线 + 1个考试场景）
npx prisma db seed
```

### 5. 启动开发服务器

```bash
# 启动开发服务器（默认端口3000）
npm run dev
```

访问 http://localhost:3000 查看应用。

### 6. 构建生产版本

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## Docker部署（推荐）

使用Docker一键部署：

```bash
# 启动所有服务（应用、PostgreSQL、Redis）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 注意事项

> **⚠️ 仅下载Tag不够**
> 
> 本项目是一个完整的Web应用，仅下载Tag源代码无法直接运行，还需要：
> 
> 1. **安装依赖** - 运行 `npm install` 安装所有必要的npm包
> 2. **配置环境变量** - 创建 `.env` 文件并配置必要的环境变量
> 3. **数据库初始化**（可选）- 如果需要使用数据库，执行Prisma迁移和数据导入
> 4. **构建项目** - 运行 `npm run build` 编译项目

## 🚀 下载最新版本

本项目的最新稳定版本已发布，您可以通过以下方式获取：

- **GitHub Releases**: [https://github.com/Bistu-OSSDT-2026/CampusMind/releases/tag/v1.1.0](https://github.com/Bistu-OSSDT-2026/CampusMind/releases/tag/v1.1.0)
- **直接克隆**: `git clone --branch v1.1.0 https://github.com/Bistu-OSSDT-2026/CampusMind.git`

## 常见问题

### Q: 启动时提示端口被占用？

A: 可以通过环境变量指定端口：

```bash
PORT=3001 npm run dev
```

### Q: 下载依赖很慢？

A: 可以使用淘宝镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

### Q: 开发环境可以不安装数据库吗？

A: 可以的！项目支持降级模式，在没有数据库的情况下会自动使用Mock数据，预置了3门课程和3个死线数据，可直接体验所有功能。