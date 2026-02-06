import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { getCoinById } from "../data/coins";
import { fetchPrice, fetchChart } from "../api/client";
import type { CoinPrice, ChartResponse } from "../api/client";

const RANGES = [
    { label: "1H", key: "1h" },
    { label: "3H", key: "3h" },
    { label: "12H", key: "12h" },
    { label: "24H", key: "24h" },
    { label: "7D", key: "7d" },
    { label: "1M", key: "30d" },
] as const;

interface CoinPageProps {
    coinId: string;
}

function fmt$(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtNum(n: number) {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    return fmt$(n);
}

function fmtSupply(n: number, sym: string) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B ${sym}`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ${sym}`;
    return `${n.toLocaleString()} ${sym}`;
}

function fmtTs(ts: number, useDate: boolean) {
    const d = new Date(ts);
    return useDate
        ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : d.toLocaleTimeString();
}

export function CoinPage({ coinId }: CoinPageProps) {
    const coin = getCoinById(coinId);
    const [rangeIdx, setRangeIdx] = useState(0);
    const range = RANGES[rangeIdx];

    const [price, setPrice] = useState<CoinPrice | null>(null);
    const [chart, setChart] = useState<ChartResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showAnalytics, setShowAnalytics] = useState(false);

    // Crosshair state
    const chartAreaRef = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState<{ x: number; idx: number } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [p, c] = await Promise.all([
                fetchPrice(coinId),
                fetchChart(coinId, range.key),
            ]);
            setPrice(p);
            setChart(c);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [coinId, range.key]);

    useEffect(() => { load(); }, [load]);

    // Build SVG points from chart data
    const svgW = 400, svgH = 120;
    let polyPoints = "";
    if (chart && chart.prices.length > 1) {
        const minP = chart.low;
        const maxP = chart.high;
        const spread = maxP - minP || 1;
        polyPoints = chart.prices
            .map((pt, i) => {
                const x = (i / (chart.prices.length - 1)) * svgW;
                const y = svgH - ((pt.price - minP) / spread) * (svgH - 10) - 5;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
    }

    // Y-axis labels
    const yLabels: string[] = [];
    if (chart && chart.prices.length > 1) {
        const spread = chart.high - chart.low;
        for (let i = 0; i < 5; i++) {
            yLabels.push(fmt$(chart.high - (spread / 4) * i));
        }
    } else {
        yLabels.push("$--", "$--", "$--", "$--", "$--");
    }

    // X-axis labels
    const useDate = range.key === "24h" || range.key === "7d" || range.key === "30d";
    const xLabels: string[] = [];
    if (chart && chart.prices.length > 2) {
        const pts = chart.prices;
        xLabels.push(
            fmtTs(pts[0].timestamp, useDate),
            fmtTs(pts[Math.floor(pts.length / 2)].timestamp, useDate),
            fmtTs(pts[pts.length - 1].timestamp, useDate)
        );
    }

    // Crosshair handlers
    const handleChartMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!chart || chart.prices.length < 2 || !chartAreaRef.current) return;
        const rect = chartAreaRef.current.getBoundingClientRect();
        const xPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const idx = Math.round(xPct * (chart.prices.length - 1));
        setHover({ x: xPct * 100, idx });
    }, [chart]);

    const handleChartMouseLeave = useCallback(() => setHover(null), []);

    const hoverPoint = hover && chart ? chart.prices[hover.idx] : null;

    // Compute % change from chart data (first point → current or hovered point)
    const startPrice = chart && chart.prices.length > 1 ? chart.prices[0].price : null;
    const endPrice = hoverPoint
        ? hoverPoint.price
        : chart && chart.prices.length > 1
            ? chart.prices[chart.prices.length - 1].price
            : null;
    const rangePct = startPrice && endPrice
        ? ((endPrice - startPrice) / startPrice) * 100
        : null;

    const pctClass = rangePct !== null
        ? (rangePct >= 0 ? "dash-change--up" : "dash-change--down")
        : price && price.priceChangePercentage24h >= 0
            ? "dash-change--up" : "dash-change--down";
    const pctStr = rangePct !== null
        ? `${rangePct >= 0 ? "+" : ""}${rangePct.toFixed(2)}\u2009%`
        : price
            ? `${price.priceChangePercentage24h >= 0 ? "+" : ""}${price.priceChangePercentage24h.toFixed(2)}\u2009%`
            : "--.--\u2009%";
    const pctLabel = hover ? "vs start" : range.label;

    // Display price: hovered point overrides current
    const displayPrice = hoverPoint
        ? fmt$(hoverPoint.price)
        : loading ? "$--" : price ? fmt$(price.currentPrice) : "$--";

    return (
        <section className="coin-page">
            {/* ── top bar ── */}
            <div className="dash-topbar">
                <Link to="/" className="dash-btn dash-btn--back">← All Coins</Link>
                <button
                    className={`dash-btn${showAnalytics ? " is-active" : ""}`}
                    onClick={() => setShowAnalytics(v => !v)}
                >
                    {showAnalytics ? "Hide" : "Show"} Advanced Analytics
                </button>
            </div>

            {error && <p className="dash-error">{error}</p>}

            {/* ── price header ── */}
            <div className="dash-price-header">
                <div className="dash-price-header__left">
                    <h2 className="dash-price-header__name">{coin.name} Price</h2>
                    <span className={`dash-change ${pctClass}`}>{pctStr}</span>
                    <span className="dash-change-label">{pctLabel}</span>
                </div>
                <div className="dash-price-header__right">
                    <p className="dash-price">
                        {displayPrice}
                    </p>
                    <p className="dash-updated">
                        Last updated: {price ? new Date(price.lastUpdated).toLocaleTimeString() : "--"}
                    </p>
                </div>
            </div>

            {/* ── chart ── */}
            <div className="dash-chart-card">
                <div className="dash-chart-card__header">
                    <h3>Price History</h3>
                    <div className="dash-range-tabs">
                        {RANGES.map((r, i) => (
                            <button
                                key={r.label}
                                className={`dash-range-tab${i === rangeIdx ? " is-active" : ""}`}
                                onClick={() => setRangeIdx(i)}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="dash-chart">
                    <div className="dash-chart__y-axis">
                        {yLabels.map((l, i) => <span key={i}>{l}</span>)}
                    </div>
                    <div
                        className="dash-chart__area"
                        ref={chartAreaRef}
                        onMouseMove={handleChartMouseMove}
                        onMouseLeave={handleChartMouseLeave}
                    >
                        <div className="dash-chart__placeholder">
                            <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" className="dash-chart__line">
                                {polyPoints && (
                                    <polyline
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        points={polyPoints}
                                    />
                                )}
                            </svg>
                        </div>

                        {/* Crosshair */}
                        {hover && hoverPoint && (
                            <>
                                <div
                                    className="dash-crosshair"
                                    style={{ left: `${hover.x}%` }}
                                />
                                <div
                                    className="dash-crosshair-tooltip"
                                    style={{
                                        left: `${hover.x}%`,
                                        transform: hover.x > 75
                                            ? "translateX(-100%)"
                                            : hover.x < 25
                                                ? "translateX(0)"
                                                : "translateX(-50%)",
                                    }}
                                >
                                    <span className="dash-crosshair-tooltip__price">{fmt$(hoverPoint.price)}</span>
                                    <span className="dash-crosshair-tooltip__time">{fmtTs(hoverPoint.timestamp, useDate)}</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="dash-chart__x-axis">
                        {xLabels.length > 0
                            ? xLabels.map((l, i) => <span key={i}>{l}</span>)
                            : <>
                                <span>--</span><span>--</span><span>--</span>
                              </>
                        }
                    </div>
                </div>
            </div>

            {/* ── statistics (toggled) ── */}
            {showAnalytics && (
                <>
                    <div className="dash-stats-card">
                        <h3>Statistics</h3>
                        <div className="dash-stats-grid">
                            <div className="dash-stat">
                                <span className="dash-stat__label">Data Points</span>
                                <span className="dash-stat__value">
                                    {chart ? chart.dataPoints : "--"}
                                </span>
                            </div>
                            <div className="dash-stat">
                                <span className="dash-stat__label">High</span>
                                <span className="dash-stat__value dash-stat__value--accent">
                                    {chart ? fmt$(chart.high) : "$--"}
                                </span>
                            </div>
                            <div className="dash-stat">
                                <span className="dash-stat__label">Low</span>
                                <span className="dash-stat__value dash-stat__value--accent">
                                    {chart ? fmt$(chart.low) : "$--"}
                                </span>
                            </div>
                            <div className="dash-stat">
                                <span className="dash-stat__label">Average</span>
                                <span className="dash-stat__value dash-stat__value--accent">
                                    {chart ? fmt$(chart.average) : "$--"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── market data ── */}
                    {price && (
                        <div className="dash-stats-card">
                            <h3>Market Data</h3>
                            <div className="dash-stats-grid">
                                <div className="dash-stat">
                                    <span className="dash-stat__label">Market Cap</span>
                                    <span className="dash-stat__value dash-stat__value--accent">
                                        {fmtNum(price.marketCap)}
                                    </span>
                                </div>
                                <div className="dash-stat">
                                    <span className="dash-stat__label">24h Volume</span>
                                    <span className="dash-stat__value dash-stat__value--accent">
                                        {fmtNum(price.totalVolume)}
                                    </span>
                                </div>
                                <div className="dash-stat">
                                    <span className="dash-stat__label">Circulating</span>
                                    <span className="dash-stat__value">
                                        {fmtSupply(price.circulatingSupply, price.symbol)}
                                    </span>
                                </div>
                                <div className="dash-stat">
                                    <span className="dash-stat__label">24h Range</span>
                                    <span className="dash-stat__value dash-stat__value--accent">
                                        {fmt$(price.low24h)} – {fmt$(price.high24h)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
