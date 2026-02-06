import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { coins } from "../data/coins";
import { fetchPrices } from "../api/client";
import type { CoinPrice } from "../api/client";

function fmt$(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtNum(n: number) {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    return fmt$(n);
}

export function OverviewPage() {
    const [prices, setPrices] = useState<CoinPrice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrices()
            .then(setPrices)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="overview">
            <div className="overview__header" style={{ textAlign: "center" }}>
                <h1 className="overview__title">Markets</h1>
                <p className="overview__subtitle">
                    Select a coin to view detailed price history and analytics
                </p>
            </div>


            <div className="overview__grid">
                {coins.map((c) => {
                    const p = prices.find((ap) => ap.id === c.id);
                    return (
                        <Link
                            key={c.id}
                            to={`/${c.id}`}
                            className="overview-card"
                        >
                            <div className="overview-card__head">
                                <div>
                                    <span className="overview-card__name">{c.name}</span>
                                    <span className="overview-card__rank">#{c.marketRank}</span>
                                </div>
                                <span className="overview-card__symbol">{c.symbol}</span>
                            </div>

                            <div className="overview-card__price-row">
                                <span className="overview-card__price">
                                    {loading ? "$--" : p ? fmt$(p.currentPrice) : "$--"}
                                </span>
                                {p && (
                                    <span
                                        className={`overview-card__change ${
                                            p.priceChangePercentage24h >= 0
                                                ? "overview-card__change--up"
                                                : "overview-card__change--down"
                                        }`}
                                    >
                                        {p.priceChangePercentage24h >= 0 ? "+" : ""}
                                        {p.priceChangePercentage24h.toFixed(2)}%
                                    </span>
                                )}
                            </div>

                            <div className="overview-card__meta">
                                {p && (
                                    <>
                                        <div className="overview-card__stat">
                                            <span className="overview-card__stat-label">MCap</span>
                                            <span className="overview-card__stat-value">{fmtNum(p.marketCap)}</span>
                                        </div>
                                        <div className="overview-card__stat">
                                            <span className="overview-card__stat-label">Vol 24h</span>
                                            <span className="overview-card__stat-value">{fmtNum(p.totalVolume)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <p className="overview-card__summary">{c.summary}</p>

                            <span className="overview-card__cta">View Chart →</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
