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

✅ **Initial application scaffolded** — All core features implemented:

- Live news feed with auto-refresh
- Hero story card featuring most impactful article
- Category filtering (All, Markets, Tech, Politics, Science, Crypto)
- Story detail pages with entity tags and sentiment analysis
- Entity spotlight pages with news timeline and sentiment trends
- Trending entities sidebar
- Search functionality across stories and entities
- Mobile-responsive design

## Modules

### Composables (`/composables`)

- **useNewsData.ts** — Fetches and manages news articles from the Elemental API. Handles auto-refresh, category filtering, and entity extraction.
- **useTrendingEntities.ts** — Calculates trending entities based on mention frequency and sentiment across recent news.
- **useEntitySearch.ts** — Provides debounced search across entities and stories with grouped results.

### Components (`/components`)

- **PulseHeader.vue** — Custom app header with Pulse branding and search/settings/user menu.
- **NewsCard.vue** — Compact news card for feed display with headline, source, timestamp, entities, and sentiment.
- **HeroStoryCard.vue** — Large featured story card for top story of the day.
- **EntityChip.vue** — Clickable entity tag with sentiment-based color coding.
- **SentimentIndicator.vue** — Color-coded sentiment dot/badge (blue=positive, coral=negative, gray=neutral).
- **CategoryTabs.vue** — Filter tabs for news categories.
- **TrendingSidebar.vue** — Right sidebar showing top 10 trending entities with mention counts and sentiment direction.
- **SentimentSparkline.vue** — 7-day sentiment trend chart using Vuetify sparkline.

### Pages (`/pages`)

- **index.vue** — Home page with hero story, streaming feed, category tabs, and trending sidebar (3-column layout on desktop).
- **story/[id].vue** — Story detail page with full article view, tagged entities, sentiment breakdown, and link to source.
- **entity/[id].vue** — Entity spotlight page with entity metadata, recent news timeline, sentiment trend chart, and related entities.
- **search.vue** — Search results page with grouped results for entities and stories.

### Data Flow

All data flows through the Elemental API via `useElementalClient()`:

1. Schema discovery on app init to get entity types (flavors) and property IDs (PIDs)
2. News articles fetched via `findEntities()` on the `article` flavor
3. Entity mentions extracted from `appears_in` relationship with attributes for sentiment
4. Related entities discovered via co-appearance in articles
5. User's preferred category persisted in KV storage via `Pref<string>`

### Design Implementation

- Dark theme (#0F1419 background) with electric blue (#1DA1F2) accents
- Sentiment colors: Blue (positive), Coral (#E0245E) (negative), Gray (#8899A6) (neutral)
- 3-column desktop layout: main feed | content | trending sidebar
- Single-column mobile layout (collapses at 960px breakpoint)
- Auto-refresh every 60 seconds for feed, 5 minutes for trending sidebar
- Skeleton loaders for all async content
- Smooth animations and hover effects on cards
