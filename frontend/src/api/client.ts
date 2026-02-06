const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5160";

export interface CoinPrice {
    id: string;
    symbol: string;
    name: string;
    currentPrice: number;
    marketCap: number;
    totalVolume: number;
    high24h: number;
    low24h: number;
    priceChangePercentage24h: number;
    circulatingSupply: number;
    lastUpdated: number;
}

export interface ChartDataPoint {
    timestamp: number;
    price: number;
}

export interface ChartResponse {
    id: string;
    rangeLabel: string;
    prices: ChartDataPoint[];
    high: number;
    low: number;
    average: number;
    dataPoints: number;
}

export async function fetchPrices(): Promise<CoinPrice[]> {
    const res = await fetch(`${API_BASE}/api/prices`);
    if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status}`);
    return res.json();
}

export async function fetchPrice(coinId: string): Promise<CoinPrice> {
    const res = await fetch(`${API_BASE}/api/prices/${coinId}`);
    if (!res.ok) throw new Error(`Failed to fetch price for ${coinId}: ${res.status}`);
    return res.json();
}

export async function fetchChart(coinId: string, range: string): Promise<ChartResponse> {
    const res = await fetch(`${API_BASE}/api/chart/${coinId}?range=${range}`);
    if (!res.ok) throw new Error(`Failed to fetch chart for ${coinId}: ${res.status}`);
    return res.json();
}
