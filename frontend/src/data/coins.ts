export interface CoinInfo {
    id: string;
    name: string;
    symbol: string;
    marketRank: number;
    summary: string;
}

export const coins: CoinInfo[] = [
    {
        id: "bitcoin",
        name: "Bitcoin",
        symbol: "BTC",
        marketRank: 1,
        summary: "The original store of value with global liquidity and network security.",
    },
    {
        id: "ethereum",
        name: "Ethereum",
        symbol: "ETH",
        marketRank: 2,
        summary: "Smart contract powerhouse powering DeFi, NFTs, and L2 ecosystems.",
    },
    {
        id: "cardano",
        name: "Cardano",
        symbol: "ADA",
        marketRank: 3,
        summary: "Proof-of-stake blockchain focused on security, scalability, and sustainability.",
    },
    {
        id: "bnb",
        name: "BNB",
        symbol: "BNB",
        marketRank: 4,
        summary: "Utility token fueling the Binance ecosystem and BNB Chain.",
    },
    {
        id: "solana",
        name: "Solana",
        symbol: "SOL",
        marketRank: 5,
        summary: "High-throughput network focused on fast, low-fee applications.",
    },
    {
        id: "xrp",
        name: "XRP",
        symbol: "XRP",
        marketRank: 6,
        summary: "Payments-focused asset designed for cross-border liquidity.",
    },
];

export function getCoinById(id: string): CoinInfo {
    const coin = coins.find((item) => item.id === id);
    if (!coin) {
        return {
            id,
            name: "Unknown",
            symbol: "N/A",
            marketRank: 0,
            summary: "No summary available for this asset.",
        };
    }
    return coin;
}
