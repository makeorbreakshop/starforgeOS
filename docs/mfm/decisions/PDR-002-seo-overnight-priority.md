# PDR-002: SEO as Overnight Work Priority (Replacing Laser Lab Conversion)

## Status

Active

## Date

2026-02-08

## Context (The Problem)

The overnight cron job was focused on Laser Lab conversion optimization (trial CTAs, email onboarding). Brandon redirected: "shift overnight automated work to focus on SEO and improving search rankings for machinesformakers.com."

SEO audit (2026-02-08) revealed:

- **Sitemap was broken**: `next.config.mjs` redirect was backwards (fixed, pushed to main)
- **Product schema missing**: Only Organization schema present
- **Internal linking weak**: Reviews don't cross-link well
- **~3 products have full MDX reviews**: Most product pages are thin
- **robots.txt**: Good

## Decision

1. Overnight cron job (`d5637eea`) switched from Laser Lab conversion to SEO focus
2. Morning briefing (`a575e46f`) updated with SEO metrics section
3. SEO audit findings saved to `knowledge/projects/seo-audit-2026-02-08.md`
4. Priority: Product schema → internal linking → keyword research → content expansion

## Consequences

**Good:**

- Organic traffic is the primary growth lever for MFM
- Overnight Codex sessions can systematically fix technical SEO issues
- Morning briefing now tracks SEO health alongside business metrics

**Bad:**

- Laser Lab conversion work paused (8 paid / 988 signups = 0.81% conversion)
- SEO improvements take weeks/months to show results in rankings

## Supersedes

Previous overnight focus on Laser Lab conversion optimization.

## Related

- SEO audit: `knowledge/projects/seo-audit-2026-02-08.md`
- Sitemap fix: branch `fix/sitemap-redirect` (merged to main)
- ADR-001: Overnight SEO now runs via Codex CLI
