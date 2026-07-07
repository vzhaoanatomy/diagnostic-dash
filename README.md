# Diagnostic Dash

A team-based medical diagnosis game for classroom use. Teachers create clinical cases, launch live sessions, and students collaborate on one device per team to diagnose patients within a budget.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript + React
- **Tailwind CSS** + shadcn/ui components
- **Supabase** — database, auth, storage, realtime
- **Vercel** — deployment

## Folder Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Teacher login/signup
│   ├── join/page.tsx               # Student join (code + team name)
│   ├── play/[teamId]/page.tsx      # Student team game
│   └── teacher/
│       ├── layout.tsx              # Auth-protected teacher shell
│       ├── dashboard/page.tsx      # Overview + live sessions
│       ├── cases/
│       │   ├── page.tsx            # Case library
│       │   ├── new/page.tsx        # Create case
│       │   └── [caseId]/edit/      # Edit case
│       └── sessions/[sessionId]/   # Live session control
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── teacher/                    # Teacher-specific components
│   └── student/                    # Student game components
├── lib/
│   ├── actions/game.ts             # Server actions
│   ├── supabase/                   # Supabase clients + middleware
│   ├── types/database.ts           # TypeScript types
│   └── utils.ts                    # Helpers
└── middleware.ts                   # Auth route protection

supabase/
├── migrations/001_initial_schema.sql
└── seed.sql                        # Sample case
```

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `teachers` | Teacher profiles (linked to auth.users) |
| `cases` | Diagnosis cases with patient info, answers, debrief |
| `case_menu_items` | Diagnostic tests/clues with cost and content |
| `game_sessions` | Live sessions with join codes and status |
| `teams` | Student teams with budget, notes, submissions |
| `team_purchases` | Record of menu items purchased by teams |

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon/public key** from Settings → API

### 2. Run the Database Migration

1. Open the Supabase SQL Editor
2. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the SQL

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create a Teacher Account

1. Go to `/login`
2. Sign up with your email
3. Confirm your email if email confirmation is enabled in Supabase Auth settings
   - For development, disable email confirmation: Supabase Dashboard → Authentication → Providers → Email → turn off "Confirm email"

### 6. Seed a Sample Case

After creating your teacher account, run `supabase/seed.sql` in the Supabase SQL Editor. This creates "The Tired Teenager" — a hypothyroidism case with 10 menu items.

### 7. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add the same environment variables
4. Deploy

## How to Play (Classroom Flow)

### Teacher

1. Log in at `/login`
2. Create or edit a case in **Case Library**
3. Click **Launch** on a case → get a 6-character join code
4. Click **Start Session** when teams are ready
5. Monitor teams, purchases, and submissions in real time
6. Review diagnoses (auto-grade or manual mark)
7. **End Session** to reveal debrief content to students

### Students

1. Go to `/join` (or scan a link/code from the teacher)
2. Enter the session code and a team name
3. Read the case, order diagnostic tests within budget
4. Review purchased clues in the Case File
5. Write shared team notes
6. Submit diagnosis + evidence + optional alternate diagnosis

## Auth Model

- **Teachers only** create accounts via email/password (Supabase Auth)
- **Students** join anonymously with a session code — no accounts needed
- Team identity is stored in browser localStorage for session continuity
- RLS policies allow public read/write for game tables during active sessions

## Realtime

Supabase Realtime subscriptions power:

- Teacher dashboard live updates (teams joining, purchases, submissions)
- Student app session status changes (pause/resume/end)
- Budget and purchase updates across the team view

## License

MIT
