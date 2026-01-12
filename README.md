# CyberComply - Framework Mapper & Gap Analysis

An open-source cybersecurity control mapping and gap analysis dashboard for financial services organizations. Map controls across NYDFS 500, ISO 27001, SOC 2, NIST CSF, PCI DSS, and more.

![CyberComply Dashboard](https://via.placeholder.com/800x400?text=CyberComply+Dashboard)

## Features

- **Multi-Framework Support**: Pre-loaded with 7 major compliance frameworks
  - NYDFS 500 (23 NYCRR 500)
  - ISO 27001:2022
  - SOC 2 Type II
  - NIST Cybersecurity Framework 2.0
  - PCI DSS 4.0
  - NIST AI Risk Management Framework
  - GLBA Safeguards Rule

- **Control Mapping Matrix**: 200+ pre-defined control mappings showing equivalencies across frameworks

- **Gap Analysis**: Identify controls that satisfy some frameworks but not others, with priority scoring

- **AI-Powered Recommendations**: GPT-4 integration for remediation guidance and policy writing

- **Visual Dashboards**: Real-time compliance scoring with charts and progress tracking

- **Multi-Tenant Ready**: Organization-based data isolation with role-based access

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS v4 with custom cyber-luxe theme
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Authentication**: localStorage-based sessions (MVP)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (optional for full features)
- OpenAI API key (optional for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/compliance-dashboard.git
cd compliance-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Mode

The app includes a full demo mode that works without any database setup. Click "Try Demo Mode" on the login page to explore all features with sample data.

## Project Structure

```
compliance-dashboard/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── frameworks/   # Framework CRUD
│   │   │   ├── controls/     # Control management
│   │   │   ├── mappings/     # Control mappings
│   │   │   ├── gaps/         # Gap analysis
│   │   │   ├── implementations/  # Implementation status
│   │   │   └── ai/           # AI integration
│   │   ├── dashboard/        # Dashboard pages
│   │   │   ├── page.tsx      # Main dashboard
│   │   │   ├── frameworks/   # Framework management
│   │   │   ├── controls/     # Control inventory
│   │   │   ├── mapping/      # Mapping matrix
│   │   │   ├── gaps/         # Gap analysis
│   │   │   ├── chat/         # AI assistant
│   │   │   └── settings/     # Settings & export
│   │   ├── login/            # Login page
│   │   ├── onboarding/       # Onboarding wizard
│   │   └── page.tsx          # Landing page
│   ├── components/
│   │   └── ui/               # shadcn/ui components
│   ├── lib/
│   │   ├── supabase.ts       # Database client
│   │   ├── auth.ts           # Auth utilities
│   │   ├── openai.ts         # AI integration
│   │   └── utils.ts          # Helper functions
│   ├── stores/               # Zustand stores
│   │   ├── authStore.ts
│   │   ├── frameworkStore.ts
│   │   └── controlStore.ts
│   └── types/
│       └── index.ts          # TypeScript definitions
├── seed-data/
│   ├── frameworks.json       # 7 compliance frameworks
│   ├── controls.json         # 150+ security controls
│   └── control-mappings.json # 200+ control mappings
├── supabase/
│   └── schema.sql            # Database schema
└── scripts/
    └── seed-database.ts      # Database seeding script
```

## Database Schema

The app uses 9 main tables:

- `organizations` - Multi-tenant support
- `users` - User accounts with roles
- `frameworks` - Compliance frameworks
- `controls` - Security controls
- `control_mappings` - Cross-framework mappings
- `organization_frameworks` - Selected frameworks per org
- `control_implementations` - Implementation status
- `gap_analysis` - Identified gaps
- `ai_interactions` - AI conversation history

See `supabase/schema.sql` for the complete schema.

## Supported Frameworks

| Framework | Version | Controls |
|-----------|---------|----------|
| NYDFS 500 | 2023 Amendment | 23 |
| ISO 27001 | 2022 | 93 |
| SOC 2 | 2017 | 64 |
| NIST CSF | 2.0 | 106 |
| PCI DSS | 4.0 | 264 |
| NIST AI RMF | 1.0 | 72 |
| GLBA | 2023 | 32 |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth` | POST | Login, register, logout |
| `/api/frameworks` | GET/POST | List and manage frameworks |
| `/api/controls` | GET | List controls with implementations |
| `/api/implementations` | POST/PUT | Update implementation status |
| `/api/mappings` | GET/POST | Control mappings |
| `/api/gaps` | GET/POST | Gap analysis |
| `/api/ai` | POST | AI recommendations and chat |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

- [ ] Full Supabase integration with RLS policies
- [ ] Real authentication with magic links
- [ ] PDF report generation
- [ ] Jira integration for gap tracking
- [ ] Slack notifications
- [ ] AWS Security Hub import
- [ ] Custom framework builder
- [ ] Audit trail and history
- [ ] Team collaboration features
- [ ] Compliance calendar and deadlines

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Lucide](https://lucide.dev/) for the icon set
- [Recharts](https://recharts.org/) for charting
- [Zustand](https://github.com/pmndrs/zustand) for state management

## Support

For questions or support, please [open an issue](https://github.com/yourusername/compliance-dashboard/issues) on GitHub.

---

Built with care for the compliance community.
