import { getPrices } from "../_lib/coingecko.js";

export default async function handler(req, res) {
  try {
    const { coinId } = req.query;
    const prices = await getPrices();
    const coin = prices.find((p) => p.id === coinId);
    if (!coin) return res.status(404).json({ error: "Not found" });
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(coin);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
