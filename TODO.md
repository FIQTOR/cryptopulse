# TODO — CryptoPulse big update

## 1. Bug: currency switch (USD→IDR lalu balik ke USD saat refresh harga) ✅
- [x] Root cause: live Binance tick = USDT selalu dipakai override harga, padahal label IDR
- [x] Endpoint FX rate gratis (frankfurter + open-er-api + static fallback)
- [x] CoinTable konversi tick USDT → currency terpilih via FX rate
- [x] Test regresi (4 test convertFromUsd)

## 2. Multi-source API (anti rate-limit) ✅
- [x] Markets: CoinGecko → CoinCap → CoinPaprika
- [x] Chart/candles: CoinGecko → Binance klines
- [x] Coin detail: CoinGecko → CoinPaprika
- [x] FX: frankfurter → open-er-api → static
- [x] /api/sources observability + verified failover (CoinGecko dimatikan → Binance)

## 3. Home page "/" ✅
- [x] Chart Bitcoin di paling atas (hero, dengan toolbar penuh)
- [x] Section "Hot News"
- [x] Market overview tabel + global stats

## 4. Coin detail /coin/[code] — layout ala Binance ✅
- [x] Header: logo + nama + harga besar + %24h + watch
- [x] Strip statistik 24h (High/Low/Volume/Market Cap)
- [x] Tabs: Chart / Info / News
- [x] Layout: chart kiri (2fr) + order book & trades kanan (1fr)

## 5. Chart lebih easy-use & lengkap ✅
- [x] Tipe chart: Area / Line / Candle / Bar (OHLC)
- [x] Toolbar: range, chart type, indikator, fullscreen, reset zoom
- [x] Volume + SMA/EMA/Bollinger/RSI/MACD
- [x] Backend endpoint OHLC (candle)

## 6. Verifikasi ✅
- [x] backend tsc + tests
- [x] frontend tsc + lint + 33 tests
- [x] build
- [x] e2e smoke + failover test

## 7. Open source · polish ✅
- [x] README screenshots (home dark/light, coin detail, candle, news)
- [x] Deep-linkable chart state (`/coin/:id?type=candle&range=30`)
- [x] Fix news HTML entities (`&#39;` → `'`, `&amp;` decoded last) + 4 tests
- [x] AGENTS.md / CONTRIBUTING.md / LICENSE (MIT)
- [x] Public repo FIQTOR/cryptopulse, tag v1.0.0 + release, topics
