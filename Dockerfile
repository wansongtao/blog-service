###################
# BUILD
###################
FROM node:20-slim AS build

WORKDIR /usr/src/app

# 首先复制 package.json 文件，利用 Docker 缓存机制
COPY package*.json ./

# 安装依赖，并添加 --no-cache 参数
RUN npm install --no-cache

# 安装必要的依赖
RUN apt-get update -y && \
  apt-get install -y --no-install-recommends openssl && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# 复制源代码
COPY . .

# 将构建与 Prisma 生成合并为一个 RUN 命令
RUN npm run prisma:generate && \
  npm run build && \
  npm prune --production

###################
# PRODUCTION
###################
FROM node:20-slim AS production

# 设置工作目录和环境变量
WORKDIR /usr/src/app
ENV NODE_ENV=production

# 安装运行时依赖（合并为单个 RUN 命令）
RUN apt-get update -y && \
  apt-get install -y --no-install-recommends openssl ca-certificates netcat-traditional && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* && \
  mkdir -p /usr/src/app/logs

# 复制应用文件（按照变更频率排序，不常变动的文件放前面）
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node --from=build /usr/src/app/package*.json ./
COPY --chown=node:node --from=build /usr/src/app/tsconfig.json ./
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node .env.production.local ./
COPY --chown=node:node key ./key

# 全局安装 dotenv-cli 并重新生成 Prisma Client（合并为单个 RUN 命令）
RUN npm install -g dotenv-cli && \
  npx prisma generate && \
  chown -R node:node /usr/src/app

# 切换到非 root 用户
USER node

# 注意 build 后的目录结构
CMD ["node", "dist/src/main.js"]