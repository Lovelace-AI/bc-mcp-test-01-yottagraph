# Pulse — Live News Intelligence

## Vision

# Pulse — Live News Intelligence

A sleek, real-time news intelligence dashboard that surfaces the most important stories across markets, politics, tech, and science — powered by the Lovelace Elemental API.

## Vision

Pulse is not another RSS reader. It's a **signal-over-noise** news experience: a curated, entity-aware feed that connects stories to the companies, people, and themes they're about. Think Bloomberg Terminal meets Apple News, designed for curious analysts and informed generalists.

## Core Features

### 1. Live News Feed (Home Page)

- **Hero section** at top with the single most impactful story of the day — large image, bold headline, entity tags, sentiment indicator.
- **Streaming feed** below showing the latest 50 stories, each as a compact card: headline, source, timestamp (relative, e.g. "12 min ago"), 1-2 entity chips, and a sentiment dot (green/amber/red).
- **Category tabs** along the top: All, Markets, Tech, Politics, Science, Crypto. Tapping a tab filters the feed by topic.
- Auto-refreshes every 60 seconds with a subtle slide-in animation for new stories.

### 2. Entity Spotlight

- Clicking an entity chip (e.g. "Apple Inc.", "Fed", "Elon Musk") navigates to an **Entity Detail** page.
- Shows: entity summary, recent news mentioning this entity (timeline view), sentiment trend over the last 7 days (sparkline chart), and related entities.
- Use the Elemental API's entity search + news endpoints to power this.

### 3. Story Detail Page

- Full article view with: headline, source + published date, body summary, list of tagged entities (clickable chips), sentiment analysis breakdown, and links to related stories.
- Clean reading typography — generous whitespace, readable font sizes.

### 4. Trending Entities Sidebar

- Right sidebar (desktop) or collapsible drawer (mobile) showing the top 10 trending entities in the last 24 hours.
- Each entry shows entity name, mention count, and sentiment direction arrow.
- Clicking navigates to the Entity Spotlight page.

### 5. Search

- Global search bar in the app header. Searches across both news headlines and entities.
- Results grouped into two sections: "Stories" and "Entities".
- Debounced input with instant results.

## Design Language

- **Dark theme by default** with a deep navy/charcoal background (#0F1419) and crisp white text.
- **Accent color**: electric blue (#1DA1F2) for interactive elements, links, and sentiment-positive indicators.
- **Negative sentiment**: warm coral (#E0245E). **Neutral**: muted gray (#8899A6).
- **Typography**: System font stack for speed; bold weights for headlines, regular for body text.
- **Cards**: Subtle elevated surfaces with 1px border (rgba white at 8% opacity), slight border-radius (12px), hover glow effect.
- **Animations**: Fade-in for new feed items, smooth page transitions, skeleton loaders while data fetches.
- **Layout**: 3-column on desktop (nav | feed | trending sidebar), single-column on mobile with bottom nav.

## Data Architecture

- All data comes from the **Elemental API** via `useElementalClient()`.
- Use `getSchema()` on app init to discover available entity types and properties.
- News feed: query recent news articles, sorted by recency.
- Entity data: entity search by name/type, entity details, entity news associations.
- Sentiment: extract from news article metadata if available.
- **No external APIs** — everything flows through the Elemental API.

## Pages

| Route         | Page             | Description                                       |
| ------------- | ---------------- | ------------------------------------------------- |
| `/`           | Home / Live Feed | Hero story + streaming news cards + category tabs |
| `/story/:id`  | Story Detail     | Full article view with entities + sentiment       |
| `/entity/:id` | Entity Spotlight | Entity profile, news timeline, sentiment chart    |
| `/search`     | Search Results   | Grouped results for stories and entities          |

## Technical Notes

- Store the user's preferred category tab in KV prefs so it persists across sessions.
- Use Nuxt `useAsyncData` for SSR-friendly data fetching on detail pages.
- Implement skeleton loaders (`v-skeleton-loader`) for all async content.
- The trending sidebar should poll on a 5-minute interval.
- Mobile breakpoint: stack to single column at < 960px, replace sidebar with a "Trending" tab in bottom nav.

## Status

Project just created. Run `/build_my_app` in Cursor to start building.

## Modules

_None yet — the agent will populate this as features are built._
