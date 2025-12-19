# Landing Page Grader

A free CRO tool that analyzes landing pages and provides actionable conversion optimization recommendations.

**[Live Demo](https://jonomtla.github.io/effective-tribble/)**

## Features

- **Instant Analysis**: Enter any URL and get a comprehensive CRO score
- **7 Key Categories**: Headline, CTA, Trust Signals, Value Proposition, Forms, Mobile, Page Structure
- **Actionable Recommendations**: Prioritized list of improvements
- **Lead Capture**: Built-in email capture for full report
- **No Backend Required**: Runs entirely in the browser via GitHub Pages

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

## Deploy to GitHub Pages

1. Go to your repo **Settings** → **Pages**
2. Under "Source", select **Deploy from a branch**
3. Choose `claude/cro-tools-lead-generation-Nkn7N` branch and `/ (root)`
4. Click **Save**
5. Your site will be live at `https://[username].github.io/effective-tribble/`

## Customization

- Update branding (logo, colors) directly in `index.html`
- Integrate lead capture with Formspree, ConvertKit, etc.
- Add your own analytics tracking

## Tech Stack

- Pure HTML, CSS, JavaScript (no build step)
- Uses [AllOrigins](https://allorigins.win/) CORS proxy for fetching external pages
