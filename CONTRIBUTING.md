# Contributing to CryptoPulse

Thanks for your interest! This project is **MIT-licensed open source** and
contributions are welcome.

## Getting started

```bash
# 1. Fork & clone
git clone https://github.com/FIQTOR/cryptopulse.git
cd cryptopulse

# 2. Backend
cd backend && cp .env.example .env && npm install && npm run dev   # :8787

# 3. Frontend (new terminal)
cd frontend && npm install && npm run dev                         # :5173
```

See [`AGENTS.md`](./AGENTS.md) for architecture, conventions and the failover
pattern. It is written for both AI agents and humans.

## Before opening a PR

Run the full check matrix and make sure everything is green:

```bash
# backend
cd backend && npx tsc --noEmit && npm test

# frontend
cd frontend && npx eslint src && npx tsc -b && npm test && npm run build
```

- Add a **regression test** for every bug fix and a **unit test** for new pure logic.
- Keep the API response shapes stable (CoinGecko-shaped) — update
  `frontend/src/lib/types.ts` and all consumers if you must change them.
- Do **not** commit `.env`, keys, or anything secret.
- Do **not** add paid/required-key APIs; keep the app working on free, keyless sources.

## Commit style

Conventional-ish prefixes are appreciated but not enforced:

```
feat: add X
fix: correct Y
docs: update Z
refactor: simplify W
test: cover V
```

## Reporting issues

Please include: what you did, what you expected, what happened, and any console
/ server logs. Screenshots help for UI issues.

## License

By contributing, you agree your contributions are released under the
[MIT License](./LICENSE).
