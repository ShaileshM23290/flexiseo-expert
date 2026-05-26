# FlexiSeo Expert

Free AI SEO audit tool at [tryseoaudit.com](https://tryseoaudit.com) — combines deterministic SEO checks with OpenAI-generated expert recommendations, action plans, and page-specific fix guidance.

Powered by [Flexodyn Solutions Private Limited](https://www.flexodynsolutions.com).

## Features

- Multi-page website crawling with sitemap discovery
- 7-category SEO analysis (Technical, On-Page, Content, Performance, Accessibility, Social, Schema)
- AI SEO Expert summaries, issue recommendations, and action plans
- Executive summary with business impact assessment
- Prioritized 7-day and 30-day action plans
- Page-level AI recommendations with expandable breakdown
- Premium report UI with category scores and visual charts
- Rule-based fallback when OpenAI is unavailable

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
cp .env.example .env
```

### Environment Variables

```env
DATABASE_URL="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/flexiseo-expert"
OPENAI_API_KEY=""           # Optional but recommended for AI features
PAGESPEED_API_KEY=""        # Optional for PageSpeed integration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Setup

```bash
npm run db:push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OpenAI AI SEO Expert Recommendations

FlexiSeo Expert uses OpenAI to generate expert-level SEO recommendations when `OPENAI_API_KEY` is configured.

- Add `OPENAI_API_KEY` in your `.env` file
- AI recommendations are optional but recommended for the full expert experience
- Without an OpenAI key, the app still works using rule-based recommendations
- AI generates expert summaries, fix recommendations, action plans, and category insights
- All OpenAI calls are server-side only — the API key is never exposed to the client
- AI outputs are cached in the database to avoid regeneration on page reload

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/audits` | Start a new SEO audit |
| GET | `/api/audits` | List recent audits |
| GET | `/api/audits/[id]` | Get audit results |
| POST | `/api/audits/[id]/ai` | Regenerate AI recommendations |

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Prisma 6 + MongoDB
- OpenAI API (gpt-4o-mini with structured JSON output)
- Cheerio for HTML parsing

## License

ISC
