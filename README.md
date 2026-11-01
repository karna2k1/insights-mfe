# insights-mfe

JobRadar micro frontend (React, Recharts, Vite Module Federation, port 3002). Exposes `insights/Insights`: KPIs, application funnel with conversion, match score distribution, jobs per source and top skill gaps. Every chart has a table view.

Reads core-api `/stats/funnel`, job-ingest `/stats/sources` and match-notify `/stats/matches` through clients injected by the shell.

```bash
npm ci && npm run build && npm run preview
```
