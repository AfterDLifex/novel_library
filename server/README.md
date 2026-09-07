# Novel Library — Local Search Proxy Server

Small Express server that searches novel websites **server-side** so the
Angular app can display real results. Browsers can't call novel sites
directly (CORS + Cloudflare/bot blocking); this server can.

## Run

```bash
cd server
npm install
npm start        # http://localhost:5000
```

## Endpoints

| Endpoint                              | Description                          |
| ------------------------------------- | ------------------------------------ |
| `GET /api/health`                     | Health check + source count          |
| `GET /api/sources`                    | List of supported sources            |
| `GET /api/search?source=<id>&q=<str>` | Search one source, normalized JSON   |
| `GET /api/details?source=<id>&id=<id>`| Fetch novel details page             |

## Sources & status

- **royalroad** — works (HTML parsing)
- **syosetu** — works (official Narou JSON API)
- **novelfull**, **lightnovelworld**, **novelupdates** — behind Cloudflare
  (HTTP 403 from this server); reported as clean errors, may work from
  different IPs or with a browser-automation setup.

## Use from the app

In the Angular app: **Settings → Novel Search Proxy → enable** (default
URL `http://localhost:5000`). Search results from proxied sources then
come from this server instead of direct browser requests.
