const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const API_KEY = process.env.COINGECKO_API_KEY || "CG-6GCjCgSq3qniCCv6Qv2G1zQF";

const SUPPORTED = ["bitcoin", "ethereum", "cardano", "binancecoin", "solana", "ripple"];

const ID_MAP = {
  bitcoin: "bitcoin",
  ethereum: "ethereum",
  cardano: "cardano",
  binancecoin: "bnb",
  solana: "solana",
  ripple: "xrp",
};

const REVERSE_MAP = Object.fromEntries(
  Object.entries(ID_MAP).map(([k, v]) => [v, k])
);

function withKey(url) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}x_cg_demo_api_key=${API_KEY}`;
}

async function geckoFetch(path) {
  const res = await fetch(withKey(`${COINGECKO_BASE}/${path}`), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  return res.json();
}

export async function getPrices() {
  const ids = SUPPORTED.join(",");
  const data = await geckoFetch(
    `coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`
  );
  return data.map((r) => ({
    id: ID_MAP[r.id] || r.id,
    symbol: r.symbol.toUpperCase(),
    name: r.name,
    currentPrice: r.current_price,
    marketCap: r.market_cap,
    totalVolume: r.total_volume,
    high24h: r.high_24h,
    low24h: r.low_24h,
    priceChangePercentage24h: r.price_change_percentage_24h,
    circulatingSupply: r.circulating_supply,
    lastUpdated: Date.now(),
  }));
}

export async function getChart(coinId, range) {
  const geckoId = REVERSE_MAP[coinId] || coinId;

  const daysMap = { "1h": "1", "3h": "1", "12h": "1", "24h": "1", "7d": "7", "30d": "30" };
  const labelMap = {
    "1h": "1 Hour", "3h": "3 Hours", "12h": "12 Hours",
    "24h": "24 Hours", "7d": "7 Days", "30d": "30 Days",
  };
  const rangeMsMap = {
    "1h": 3600000, "3h": 10800000, "12h": 43200000,
    "24h": 86400000, "7d": 604800000, "30d": 2592000000,
  };

  const r = (range || "1h").toLowerCase();
  const days = daysMap[r] || "1";
  const label = labelMap[r] || "1 Hour";
  const rangeMs = rangeMsMap[r] || 3600000;

  const data = await geckoFetch(
    `coins/${geckoId}/market_chart?vs_currency=usd&days=${days}`
  );

  if (!data.prices || data.prices.length === 0) return null;

  const now = Date.now();
  const cutoff = now - rangeMs;

  const points = data.prices
    .filter((p) => p.length >= 2 && p[0] >= cutoff)
    .map((p) => ({ timestamp: p[0], price: p[1] }));

  if (points.length === 0) return null;

  const priceVals = points.map((p) => p.price);
  const high = Math.max(...priceVals);
  const low = Math.min(...priceVals);
  const avg = Math.round((priceVals.reduce((a, b) => a + b, 0) / priceVals.length) * 100) / 100;

  return {
    id: coinId,
    rangeLabel: label,
    prices: points,
    high, low,
    average: avg,
    dataPoints: points.length,
  };
}
