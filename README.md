# PriceTrail

PriceTrail is a Vercel-ready ecommerce price tracker for Amazon India, Flipkart, Myntra and Ajio links.

It records price snapshots over time and reports:

- highest tracked price and date
- lowest tracked price and date
- most common tracked price
- how many times the price changed
- average change frequency once enough history exists

## Tech Stack

- Next.js App Router
- MongoDB Atlas
- Vercel Functions
- Vercel Cron Jobs

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these environment variables:

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/price_tracker?retryWrites=true&w=majority
MONGODB_DB=price_tracker
CRON_SECRET=replace-with-a-long-random-secret
```

Open `http://localhost:3000`, paste a product URL, and the app will scan and save the first price sample.

## Deployment

1. Push this folder to a GitHub repository.
2. Import the repo in Vercel.
3. Add the environment variables from `.env.example`.
4. Deploy.

The included `vercel.json` registers a cron job:

```json
{
  "path": "/api/cron/scan",
  "schedule": "0 */6 * * *"
}
```

Vercel Cron sends an HTTP `GET` request to the configured path in production. The schedule runs in UTC.

## Scraping Notes

Direct HTML fetching can be blocked by ecommerce anti-bot systems. The scanner is intentionally isolated in `lib/scanner.ts` so you can replace or enhance it without changing the UI or analytics.

For production reliability, configure a legal scraping/rendering provider and set:

```bash
SCRAPER_PROXY_ENDPOINT=https://your-provider.example/render
SCRAPER_PROXY_TOKEN=your-token
SCRAPER_PROXY_URL_PARAM=url
SCRAPER_PROXY_TOKEN_PARAM=token
```

The proxy endpoint should accept the product URL as a query parameter and return rendered HTML. If your provider uses a different target URL parameter, change `SCRAPER_PROXY_URL_PARAM`.

If your provider expects the API key in a header instead of a query parameter, set:

```bash
SCRAPER_PROXY_AUTH_HEADER=x-api-key
```

When `SCRAPER_PROXY_AUTH_HEADER` is set, the app sends `SCRAPER_PROXY_TOKEN` in that header and does not append the token query parameter.

Examples:

```bash
# Query-token style
SCRAPER_PROXY_ENDPOINT=https://proxy.example/render
SCRAPER_PROXY_URL_PARAM=url
SCRAPER_PROXY_TOKEN_PARAM=api_key
SCRAPER_PROXY_TOKEN=your-api-key

# Header-token style
SCRAPER_PROXY_ENDPOINT=https://proxy.example/render
SCRAPER_PROXY_URL_PARAM=target
SCRAPER_PROXY_AUTH_HEADER=x-api-key
SCRAPER_PROXY_TOKEN=your-api-key
```

## API

Create or rescan a tracked product:

```http
POST /api/products
Content-Type: application/json

{ "url": "https://www.amazon.in/..." }
```

List products:

```http
GET /api/products
```

Get detail, samples and stats:

```http
GET /api/products/:id
```

Manual rescan:

```http
POST /api/products/:id/scan
```

Cron scan:

```http
GET /api/cron/scan
```

For manual cron calls outside Vercel Cron, pass `?token=<CRON_SECRET>` or the `x-cron-secret` header.

## Data Model

`products`

- normalized product URL
- store key
- title and image
- last price and scan metadata
- scan interval and next scan time

`price_samples`

- product id
- price and currency
- captured date
- stock status when detected
- source: direct or proxy

## Legal and Operational Notes

Check each store's terms and applicable law before running a public tracker at scale. Use reasonable scan intervals, do not bypass access controls, and prefer official/affiliate/product APIs when available.
