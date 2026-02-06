import { getChart } from "../_lib/coingecko.js";

export default async function handler(req, res) {
  try {
    const { coinId } = req.query;
    const range = req.query.range || "1h";
    const chart = await getChart(coinId, range);
    if (!chart) return res.status(404).json({ error: "No data" });
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(chart);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
