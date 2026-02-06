import { getPrices } from "./_lib/coingecko.js";

export default async function handler(req, res) {
  try {
    const prices = await getPrices();
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(prices);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
