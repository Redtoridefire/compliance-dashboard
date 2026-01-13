# CyberComply Architecture

This document describes the technical architecture of the CyberComply Framework Mapper application.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Browser                               │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Next.js React App                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │  Pages   │  │Components│  │  Stores  │  │   API Clients    │ │ │
│  │  │(App Dir) │  │(shadcn)  │  │(Zustand) │  │(Supabase/OpenAI) │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    Next.js API Routes  │
                    │   (/api/* endpoints)   │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐       ┌───────▼───────┐       ┌──────▼──────┐
│   Supabase    │       │    OpenAI     │       │ localStorage │
│  (PostgreSQL) │       │   GPT-4 API   │       │  (Sessions)  │
└───────────────┘       └───────────────┘       └──────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 | React framework with App Router |
| UI Components | shadcn/ui | Customizable component library |
| Styling | Tailwind CSS | Utility-first CSS framework |
| State | Zustand | Lightweight state management |
| Charts | Recharts | Data visualization |
| Animations | Framer Motion | Smooth UI animations |
| Database | Supabase | PostgreSQL with real-time features |
| AI | OpenAI GPT-4 | Intelligent recommendations |
| Auth | localStorage | Simple session management (MVP) |

## Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── frameworks/      # Framework CRUD
│   │   ├── controls/        # Control management
│   │   ├── implementations/ # Implementation status
│   │   ├── mappings/        # Control mappings
│   │   ├── gaps/            # Gap analysis
│   │   └── ai/              # AI recommendations
│   ├── dashboard/           # Protected dashboard pages
│   │   ├── page.tsx         # Main dashboard
│   │   ├── frameworks/      # Framework discovery
│   │   ├── controls/        # Control inventory
│   │   ├── mapping/         # Mapping matrix
│   │   ├── gaps/            # Gap analysis
│   │   ├── chat/            # AI assistant
│   │   ├── exports/         # Report generation
│   │   └── settings/        # Configuration
│   ├── login/               # Login page
│   ├── onboarding/          # Setup wizard
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── auth/                # Auth components
├── lib/
│   ├── supabase.ts         # Database client
│   ├── openai.ts           # AI client
│   ├── auth.ts             # Session management
│   └── utils.ts            # Utilities
├── stores/
│   ├── authStore.ts        # Authentication state
│   ├── frameworkStore.ts   # Framework state
│   └── controlStore.ts     # Control state
└── types/
    └── index.ts            # TypeScript types
```

## Data Flow

### Authentication Flow

```
User Login → Create Session → Store in localStorage → Validate on API calls
     │                                                        │
     └──────────── Demo Mode (no backend required) ───────────┘
```

### Control Implementation Flow

```
Select Framework → View Controls → Update Status → Recalculate Compliance
        │               │               │                   │
        ▼               ▼               ▼                   ▼
   org_frameworks   controls    control_impl         gap_analysis
```

### AI Recommendation Flow

```
User Request → Context Gathering → GPT-4 API → Response Processing → Display
      │              │                │               │
      ▼              ▼                ▼               ▼
   Gap data    Organization     AI prompt      Formatted
   Control     Frameworks       template       recommendation
```

## Database Schema

### Entity Relationship Diagram

```
organizations ──┬── users
                │
                ├── organization_frameworks ── frameworks ── controls
                │                                               │
                ├── control_implementations ────────────────────┘
                │                                               │
                └── gap_analysis ───────────────────────────────┘
                │
                └── ai_interactions

controls ──── control_mappings ──── controls
```

### Key Tables

| Table | Purpose |
|-------|---------|
| organizations | Multi-tenant organization data |
| users | User accounts and roles |
| frameworks | Compliance frameworks (NYDFS, ISO, etc.) |
| controls | Individual security controls |
| control_mappings | Cross-framework equivalencies |
| organization_frameworks | Frameworks selected by each org |
| control_implementations | Implementation status per control |
| gap_analysis | Computed compliance gaps |
| ai_interactions | AI conversation history |

## Multi-Tenancy

All data is scoped by `organization_id`:

```typescript
// Every query filters by organization
const { data } = await supabase
  .from('control_implementations')
  .select('*')
  .eq('organization_id', session.organizationId);
```

### Data Isolation Rules

1. Users can only access their organization's data
2. API routes validate organization_id against session
3. No cross-organization data queries allowed
4. Demo mode uses isolated demo organization

## API Routes

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth` | POST | Login, register, logout, validate |
| `/api/frameworks` | GET/POST | List and manage frameworks |
| `/api/controls` | GET | Get controls with implementations |
| `/api/implementations` | POST/PUT | Update implementation status |
| `/api/mappings` | GET/POST | Control mappings |
| `/api/gaps` | GET/POST | Gap analysis |
| `/api/ai` | POST | AI recommendations and chat |

### Request/Response Format

```typescript
// Request
POST /api/ai
{
  "action": "gap_recommendation",
  "control_id": "uuid",
  "organization_id": "uuid"
}

// Response
{
  "recommendation": "...",
  "estimated_effort": "Medium",
  "priority": "High"
}
```

## State Management

### Zustand Stores

```typescript
// authStore - Authentication state
{
  session: Session | null,
  isLoading: boolean,
  login: (email) => Promise<void>,
  logout: () => void
}

// frameworkStore - Framework state
{
  frameworks: Framework[],
  selectedFrameworks: string[],
  complianceScores: FrameworkComplianceScore[],
  fetchFrameworks: () => Promise<void>
}

// controlStore - Control state
{
  controls: Control[],
  implementations: Map<string, Implementation>,
  gaps: GapAnalysis[],
  updateImplementation: (id, status) => Promise<void>
}
```

## Security Considerations

### Current (MVP)

- Sessions stored in localStorage
- Session tokens validated against database
- Organization-scoped data access
- Rate limiting on AI endpoints

### Production Recommendations

- Implement Supabase Auth or Auth0
- Add Row Level Security (RLS) policies
- Use HTTP-only cookies for sessions
- Implement CSRF protection
- Add audit logging
- Encrypt sensitive data at rest

## Performance Optimizations

### Current

- React Server Components where possible
- Client-side caching with Zustand
- Lazy loading for dashboard pages
- Optimized Recharts rendering

### Future

- Redis caching for API responses
- Database query optimization
- CDN for static assets
- Background job processing for gap analysis

## Deployment

### Vercel Configuration

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | No* | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No* | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | No* | Supabase service role key |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features |

*App works in demo mode without Supabase configuration

## Scaling Considerations

### Horizontal Scaling

- Stateless API design allows multiple instances
- Database connection pooling via Supabase
- Session validation doesn't require sticky sessions

### Vertical Scaling

- Gap analysis computation can be resource-intensive
- AI API calls have rate limits
- PDF generation may need worker processes

## Monitoring

### Recommended Tools

- Vercel Analytics for frontend metrics
- Supabase Dashboard for database monitoring
- OpenAI usage dashboard for AI costs
- Error tracking (Sentry recommended)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.
