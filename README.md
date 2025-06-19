# K-Point 社員感謝システム

## 概要
社内感謝ポイント贈与システム - 従業員同士がポイントを送り合い、日々の感謝を可視化

## 実装済み機能
- ✅ ユーザー認証（bcrypt + セッション管理）
- ✅ ポイント送付（日次制限: 3回/日、最大3ポイント/回）
- ✅ 部門ランキング表示
- ✅ 管理者パネル（ユーザー管理・統計）
- ✅ AIコーチング分析（OpenAI GPT-4o）
- ✅ Google Sheetsデータエクスポート
- ✅ 3段階権限管理（ユーザー/管理者/スーパー管理者）
- ✅ 完全日本語インターフェース
- ✅ リアルタイム取引履歴
- ✅ CSV出力機能

## システム仕様
- 初期ポイント: 20ポイント/ユーザー
- 送付制限: 1日3回、1回最大3ポイント
- 総ユーザー数: 50名想定
- 管理者: 5名
- スーパー管理者: 1名

## 技術スタック
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui  
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: bcrypt + express-session
- **AI**: OpenAI GPT-4o
- **Export**: Google Sheets API + CSV

## デプロイメント
- **開発環境**: Replit
- **本番環境**: Replit Autoscale
- **データベース**: PostgreSQL (Neon)

## 更新日
2025年6月19日 - 完全実装版バックアップ
## 最終更新
2025年06月19日 05:53:32 - プロジェクト完全バックアップ実行
