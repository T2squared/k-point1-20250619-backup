# K-point 社内ポイント贈与システム

## Overview

K-point is an internal gratitude point system that allows employees to send and receive appreciation points within the company. The system includes features for point management, transaction tracking, department rankings, Google Sheets integration, and administrative controls.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js 20 with TypeScript
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for both local and cloud deployment)
- **Authentication**: Custom local authentication with session management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

## Key Components

### Database Schema
- **Users**: Core user information with departments, roles, and point balances
- **Transactions**: Point transfer records with sender/receiver relationships
- **Departments**: Organizational structure for rankings
- **Daily Limits**: Rate limiting for point sending (3 points, 3 times daily)
- **Sessions**: Secure session management
- **Coach Analysis**: AI-powered insights storage

### Authentication System
- Local username/password authentication
- Session-based authentication with PostgreSQL storage
- Role-based access control (user, admin, superadmin)
- Password hashing using bcrypt with fallback to scrypt

### Point System
- Each user starts with 20 points
- Daily sending limits: maximum 3 points per transaction, 3 transactions per day
- Quarterly point reset functionality
- Real-time balance tracking

### Admin Features
- User management (create, edit, activate/deactivate)
- System statistics and analytics
- Data export to Google Sheets
- AI-powered insights using OpenAI integration
- Quarterly point reset controls

## Data Flow

1. **User Authentication**: Login credentials → Session creation → Role-based access
2. **Point Transactions**: Sender selection → Validation → Balance updates → Transaction logging
3. **Dashboard Data**: User stats → Recent activity → Department rankings → Real-time updates
4. **Admin Operations**: System stats → User management → Data exports → AI analysis
5. **Google Sheets Integration**: Transaction data → Formatted export → Sheet updates

## External Dependencies

### Required Services
- **PostgreSQL Database**: Primary data storage
- **Google Sheets API**: Data export functionality (optional)
- **OpenAI API**: AI-powered insights generation (optional)

### Authentication Configuration
- Session secret for security
- Replit domains for OIDC integration
- Google Service Account for Sheets integration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email
- `GOOGLE_PRIVATE_KEY`: Service account private key
- `GOOGLE_SHEET_ID`: Target spreadsheet ID
- `OPENAI_API_KEY`: OpenAI API access (optional)

## Deployment Strategy

### Development Environment
- Local PostgreSQL database
- Vite dev server for frontend
- tsx for TypeScript execution
- Docker Compose for containerized development

### Production Environment
- Replit autoscale deployment
- PostgreSQL database provisioning
- Build process: `npm run build` (Vite + esbuild)
- Start command: `npm run start`
- Port configuration: 5000 internal, 80 external

### Database Management
- Drizzle Kit for schema migrations
- Push command: `npm run db:push`
- Schema versioning through migrations folder

## Changelog
- June 19, 2025 - 完全実装完了
  - ユーザー認証システム（bcrypt + セッション管理）
  - ポイント送付機能（日次制限: 3回/日、最大3ポイント/回）
  - 部門ランキング表示機能
  - 管理者パネル（ユーザー管理・統計・AI分析）
  - OpenAI GPT-4o AIコーチング分析機能
  - Google Sheets V2 データエクスポート機能
  - CSV出力機能実装
  - 3段階権限管理（ユーザー/管理者/スーパー管理者）
  - 完全日本語インターフェース対応
  - PostgreSQLデータベース統合
  - リアルタイム取引履歴・残高更新
  - Git repository initialization completed

## User Preferences

Preferred communication style: Simple, everyday language.