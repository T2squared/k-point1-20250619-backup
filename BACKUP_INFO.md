# K-Point プロジェクトバックアップ情報

## プロジェクト概要
K-Point社員感謝システム - 完全実装版

## バックアップ日時
2025年06月19日 06時01分30秒

## 主要ファイル構成
./.cache/replit/env/latest.json
./.cache/replit/toolchain.json
./.cache/replit/nix/dotreplitenv.json
./.cache/typescript/5.6/package.json
./.cache/typescript/5.6/package-lock.json
./.local/state/replit/agent/.latest.json
./server/vite.ts
./server/index.ts
./server/db.ts
./server/googleSheets.ts
./server/openai.ts
./server/replitAuth.ts
./server/storage.ts
./server/localAuth.ts
./server/googleSheetsV2.ts
./server/routes.ts
./shared/schema.ts
./tailwind.config.ts
./package-lock.json
./package.json

## 実装機能
- ユーザー認証システム（bcrypt）
- ポイント送付機能（日次制限付き）
- 部門ランキング表示
- 管理者パネル
- AIコーチング分析（OpenAI GPT-4o）
- Google Sheetsエクスポート
- 3段階権限管理
- 完全日本語UI

## 技術スタック
Node.js + Express + React + PostgreSQL + OpenAI + Google Sheets API

