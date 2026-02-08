# Data Sources

Business metrics pulled by `scripts/daily-metrics-snapshot.py` into Supabase `daily_business_metrics` table.

## Sources

| Source                        | What                                                        | Auth                                         |
| ----------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| **YouTube Analytics API**     | Revenue (ads/shopping/premium), views, top videos           | OAuth (service account)                      |
| **Google Analytics Data API** | Sessions, users, top pages, traffic sources, organic search | OAuth (service account JSON in `.env.local`) |
| **Stripe API**                | Active subs, MRR, transactions                              | API key in `.env`                            |
| **ConvertKit API**            | Subscribers, growth, broadcast stats                        | API key in `.env`                            |
| **PostHog API**               | DAU trend, feature usage, Laser Lab analytics               | API key in `.env`                            |
| **Supabase**                  | Affiliate sales, link clicks, email subscribers, profiles   | DB URL in `.env`                             |

## Key Notes

- YouTube API has 2-3 day lag — views=0 on recent days is normal
- PostHog timeout increased to 60s (was 15s, caused failures)
- GA service account JSON path: `machines-for-makers/.env.local`
- All API keys stored in `.env` (gitignored) or 1Password

## Reference

Full data source documentation: `memory/business-data-sources.md`
