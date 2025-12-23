# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Assistente Profissional** is a full-stack application that provides automated message summarization for professionals (doctors, lawyers, etc.) using AI. The project consists of:
- **Backend**: Fastify API with Gmail integration, Claude AI summarization, and auto-reply functionality
- **Mobile**: React Native (Expo) app for managing messages

## Development Commands

### Backend (Node.js/Fastify)

```bash
cd backend

# Development (with hot reload)
npm run dev

# Database operations
npm run db:push          # Push schema changes to DB
npm run db:migrate       # Run migrations
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio

# Production
npm run build
npm start

# Testing
npm test
```

### Mobile (React Native/Expo)

```bash
cd mobile

# Development
npm start                # Start Metro bundler
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run web              # Run on web

# Testing
npm test
```

### Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Start with admin tools (Adminer, Redis Commander)
docker-compose --profile tools up -d

# Stop services
docker-compose down

# Initial setup
./setup.sh               # Automated setup script
```

## Architecture

### Backend Structure

**Key Service Layer Pattern**: Business logic is organized into services that are imported and used by route handlers.

- **`src/services/`**: Core business logic
  - `gmail.service.ts`: Gmail API integration (OAuth, fetch messages, send replies)
  - `ai.service.ts`: Claude AI integration for message summarization
  - `message-processing.service.ts`: Orchestrates message fetching, summarization, and auto-reply logic

- **`src/routes/`**: HTTP endpoints (Fastify)
  - `auth.routes.ts`: Google OAuth flow, JWT tokens, user profile
  - `messages.routes.ts`: List, sync, reply, stats
  - `settings.routes.ts`: Auto-reply configuration, connections, templates

- **`prisma/schema.prisma`**: Database schema
  - Main models: `User`, `Connection` (Gmail/WhatsApp), `Message`, `Reply`, `AutoReplySettings`
  - Supports multiple providers: `GMAIL`, `OUTLOOK`, `WHATSAPP` (WhatsApp planned)

**Authentication Flow**:
1. User initiates OAuth via `/auth/google`
2. Google redirects to `/auth/google/callback`
3. Backend exchanges code for tokens, creates/updates user in DB
4. Returns JWT token for subsequent requests
5. Protected routes use `@fastify/jwt` decorator

**Message Processing**:
1. Manual sync via POST `/messages/sync/gmail`
2. Fetches unread Gmail messages using `gmail.service.ts`
3. Generates AI summary using `ai.service.ts` (Claude API)
4. Checks auto-reply settings (time-based + day-of-week)
5. Sends auto-reply if enabled and within configured hours

### Mobile Structure

**Navigation**: Uses Expo Router (file-based routing)
- `app/_layout.tsx`: Root layout
- `app/(tabs)/`: Tab navigation (Inbox, Settings)
- `app/message/[id].tsx`: Message details (dynamic route)

**State Management**:
- Zustand stores in `src/stores/`
- `@tanstack/react-query` for API data fetching/caching

**API Integration**:
- `src/services/api.ts`: Axios client with auth token handling
- Communicates with backend API

**Key Components**:
- `src/components/ui/`: Reusable UI components (Button, Card, etc.)
- `src/components/MessageItem.tsx`: Message list item with status indicators

### Database Schema Notes

- **`Connection`**: Links users to external providers (Gmail). Stores OAuth tokens with expiration tracking.
- **`Message`**: Contains both `originalContent` and `summary` fields. `isAudio` flag indicates voice messages (transcription in `transcription` field).
- **`AutoReplySettings`**: Per-user configuration with time windows and day restrictions.
- **`ProcessingJob`**: Queue tracking for async operations (transcription, summarization) - prepared for BullMQ integration.

## Environment Setup

### Backend `.env` Requirements

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
ANTHROPIC_API_KEY="sk-ant-..."
```

### Mobile Configuration

Edit `mobile/src/config/index.ts`:
- `DEV_API_URL`: Use machine IP (not localhost) for physical device testing
- Google OAuth Client IDs for iOS/Android/Web (Expo Go)

## Google Cloud Platform Setup

1. Enable Gmail API in GCP Console
2. Create OAuth 2.0 credentials (Web application)
3. Add redirect URI: `http://localhost:3000/auth/google/callback`
4. Configure OAuth consent screen with scopes:
   - `gmail.readonly`
   - `gmail.send`
   - `gmail.modify`
   - `userinfo.email`
   - `userinfo.profile`

## Important Technical Details

### Token Management
- Gmail access tokens expire after 1 hour
- Backend automatically refreshes using `refresh_token`
- Check `Connection.expiresAt` before API calls

### Testing Locally
1. Start Docker services: `docker-compose up -d`
2. Run backend: `cd backend && npm run dev`
3. Navigate to `http://localhost:3000/auth/google` to authenticate
4. Use returned JWT token in Authorization header: `Bearer <token>`
5. For mobile: Update API URL to machine IP, start Expo: `npm start`

### Planned Features (Not Yet Implemented)
- WhatsApp Business API integration
- Whisper audio transcription
- BullMQ job queues for async processing
- Real-time webhooks/push notifications
