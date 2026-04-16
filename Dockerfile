# syntax=docker/dockerfile:1.7
#################################################
# 1) Builder stage — 安裝依賴 + 打包 Next.js
#################################################
FROM node:22-alpine AS builder

# 安裝 better-sqlite3 編譯所需的系統套件
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# 先複製 package 檔，利用 Docker layer cache
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# 複製所有原始碼並 build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

#################################################
# 2) Runner stage — 精簡執行映像檔
#################################################
FROM node:22-alpine AS runner

# 執行期也需要 better-sqlite3 的 runtime
RUN apk add --no-cache libc6-compat

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 建立非 root 使用者
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# 複製必要檔案
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.js ./

# 確保持久化資料夾存在（volume 會掛在這）
RUN mkdir -p /app/data /app/public/uploads \
    && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

CMD ["npm", "run", "start"]
