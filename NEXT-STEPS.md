# NEXT-STEPS

Open work for ai-know.org. Content refreshes are automated (local Hermes crons push to `main`;
see the header of `.github/workflows/news-refresh.yml`), so check `origin/main` before adding an item.

## Open

- **Watch: the Saturday news cron has been quiet since 2026-09-26.** Last news commit is `397b387`
  (2026-09-26); none for 2026-10-03 or 2026-10-10 (2026-09-12 was also skipped), while the Sunday
  tools cron committed `6dfb77b` on 2026-10-11. Check `hermes cron list` and its last run before
  refreshing by hand; the manual fallback is the `news-refresh.yml` workflow (workflow_dispatch).

## Recently done (verified 2026-10-11)

- **News refresh** (raised 2026-07-11, newest entry was 2026-07-03): `1408df4` refreshed it the same
  day; weekly refreshes followed, latest `397b387` (2026-09-26).
