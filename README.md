# Landing Page Grader

A free CRO tool that analyzes landing pages and provides actionable conversion optimization recommendations.

## Features

- **Instant Analysis**: Enter any URL and get a comprehensive CRO score
- **7 Key Categories**: Headline, CTA, Trust Signals, Value Proposition, Forms, Mobile, Page Structure
- **Actionable Recommendations**: Prioritized list of improvements
- **Lead Capture**: Built-in email gate for full report (great lead magnet!)

## Quick Start

```bash
npm install
npm start
```

Then open http://localhost:3000

## What It Analyzes

| Category | What's Checked |
|----------|---------------|
| Headline | H1 presence, length, power words, specificity |
| CTA | Button presence, action-oriented copy, benefit language |
| Trust Signals | Testimonials, badges, client logos, statistics |
| Value Proposition | Benefits-first language, USP indicators, subheadlines |
| Form | Field count, friction level, labels, validation |
| Mobile | Viewport meta, responsive patterns, touch-friendly elements |
| Page Structure | Heading hierarchy, images, alt tags, video content |

## Customization

- Update branding in `public/index.html`
- Adjust scoring weights in `server.js`
- Connect lead capture to your CRM in the `/api/leads` endpoint

## Tech Stack

- Node.js + Express
- Cheerio (HTML parsing)
- Axios (HTTP requests)
- Vanilla JS frontend
