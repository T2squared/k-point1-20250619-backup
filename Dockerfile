# Node.js 20を使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# ポート3000を公開
EXPOSE 3000

# 開発モードで起動
CMD ["npm", "run", "dev"]