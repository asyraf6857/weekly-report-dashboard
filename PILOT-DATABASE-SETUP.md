# PTP Pilot Allocation Database Setup

Frontend: `pilot-allocation.html` on GitHub Pages.

## Shared database
This project is prepared for Supabase/PostgreSQL. Run `supabase-schema.sql` in the Supabase SQL editor, then place the project's URL and **anon/publishable** key in `pilot-db-config.js`.

Do not place a service-role key in this public repository.

Tables:
- pilots
- vessels
- allocations
- allocation_history
- app_config

Until database credentials are configured, the web app continues to use browser local storage.
