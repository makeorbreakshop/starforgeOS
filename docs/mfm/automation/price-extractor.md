# Price Extractor

Nightly pipeline that tracks prices for all laser/3D printer machines on machinesformakers.com.

## Architecture

- **Codebase**: `/Users/brandoncullum/machines-for-makers/price-extractor-python/`
- **Server**: FastAPI on port 8000 (persistent)
- **Scraper**: Scrapfly (cloud scraping service)
- **Schedule**: LaunchAgent `com.machinesformakers.pricetracker` at 3:00 AM ET
- **Runner**: `cron_runner.sh` triggers the batch

## Logs

- `/tmp/price-tracker.log` — cron runner output
- `logs/batch_*.log` — detailed per-batch logs

## Morning Check

- Crontab at 7:30 AM ET runs `morning_price_check_simple.sh`
- Analyzes overnight batch log for failures
- Reports issues if found

## Common Issues

- `Failed to get batch_id from response` — Scrapfly API issue, usually transient
- 32+ failed extractions in a run — check individual product URLs, may be site changes

## Monitoring

- **Price Monitor Alert** (cron `c70c428c`): Checks staleness at 5:05 AM
- If no updates in 24+ hours → alerts #mfm Discord
