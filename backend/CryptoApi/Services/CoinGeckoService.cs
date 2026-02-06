using System.Text.Json;
using System.Text.Json.Serialization;
using CryptoApi.Models;

namespace CryptoApi.Services;

public class CoinGeckoService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    private static readonly string[] SupportedCoins =
        ["bitcoin", "ethereum", "cardano", "binancecoin", "solana", "ripple"];

    // CoinGecko ids → our frontend ids
    private static readonly Dictionary<string, string> IdMap = new()
    {
        ["bitcoin"] = "bitcoin",
        ["ethereum"] = "ethereum",
        ["cardano"] = "cardano",
        ["binancecoin"] = "bnb",
        ["solana"] = "solana",
        ["ripple"] = "xrp"
    };

    private static readonly Dictionary<string, string> ReverseIdMap =
        IdMap.ToDictionary(kvp => kvp.Value, kvp => kvp.Key);

    public CoinGeckoService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _http.BaseAddress = new Uri("https://api.coingecko.com/api/v3/");
        _http.DefaultRequestHeaders.Add("Accept", "application/json");
        _apiKey = config["CoinGecko:ApiKey"] ?? "";
    }

    private string WithKey(string url)
    {
        var sep = url.Contains('?') ? '&' : '?';
        return $"{url}{sep}x_cg_demo_api_key={_apiKey}";
    }

    /// <summary>
    /// Get current prices for all supported coins.
    /// </summary>
    public async Task<List<CoinPrice>> GetPricesAsync()
    {
        var ids = string.Join(",", SupportedCoins);
        var url = $"coins/markets?vs_currency=usd&ids={ids}&order=market_cap_desc&sparkline=false";

        var response = await _http.GetAsync(WithKey(url));
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var raw = JsonSerializer.Deserialize<List<CoinGeckoMarketItem>>(json, _jsonOpts)
            ?? [];

        return raw.Select(r => new CoinPrice(
            Id: IdMap.GetValueOrDefault(r.Id, r.Id),
            Symbol: r.Symbol.ToUpper(),
            Name: r.Name,
            CurrentPrice: r.CurrentPrice,
            MarketCap: r.MarketCap,
            TotalVolume: r.TotalVolume,
            High24h: r.High24h,
            Low24h: r.Low24h,
            PriceChangePercentage24h: r.PriceChangePercentage24h,
            CirculatingSupply: r.CirculatingSupply,
            LastUpdated: DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        )).ToList();
    }

    /// <summary>
    /// Get price for a single coin by our frontend id.
    /// </summary>
    public async Task<CoinPrice?> GetPriceAsync(string coinId)
    {
        var all = await GetPricesAsync();
        return all.FirstOrDefault(c => c.Id == coinId);
    }

    /// <summary>
    /// Get chart data for a coin. Range: "1h", "3h", "12h", "24h", "7d"
    /// </summary>
    public async Task<ChartResponse?> GetChartAsync(string coinId, string range)
    {
        var geckoId = ReverseIdMap.GetValueOrDefault(coinId, coinId);

        var (days, label) = range.ToLower() switch
        {
            "1h" => ("1", "1 Hour"),
            "3h" => ("1", "3 Hours"),
            "12h" => ("1", "12 Hours"),
            "24h" => ("1", "24 Hours"),
            "7d" => ("7", "7 Days"),
            "30d" => ("30", "30 Days"),
            _ => ("1", "1 Hour")
        };

        var url = $"coins/{geckoId}/market_chart?vs_currency=usd&days={days}";
        var response = await _http.GetAsync(WithKey(url));
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var raw = JsonSerializer.Deserialize<CoinGeckoChartRaw>(json, _jsonOpts);

        if (raw?.Prices is null || raw.Prices.Count == 0)
            return null;

        // Filter points based on desired range
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var rangeMs = range.ToLower() switch
        {
            "1h" => 60L * 60 * 1000,
            "3h" => 3L * 60 * 60 * 1000,
            "12h" => 12L * 60 * 60 * 1000,
            "24h" => 24L * 60 * 60 * 1000,
            "7d" => 7L * 24 * 60 * 60 * 1000,
            "30d" => 30L * 24 * 60 * 60 * 1000,
            _ => 60L * 60 * 1000
        };
        var cutoff = now - rangeMs;

        var points = raw.Prices
            .Where(p => p.Count >= 2)
            .Select(p => new ChartDataPoint((long)p[0], (decimal)p[1]))
            .Where(p => p.Timestamp >= cutoff)
            .OrderBy(p => p.Timestamp)
            .ToList();

        if (points.Count == 0)
            return null;

        var prices = points.Select(p => p.Price).ToList();

        return new ChartResponse(
            Id: coinId,
            RangeLabel: label,
            Prices: points,
            High: prices.Max(),
            Low: prices.Min(),
            Average: Math.Round(prices.Average(), 2),
            DataPoints: points.Count
        );
    }
}

// ── Raw deserialization models for CoinGecko responses ──

file record CoinGeckoMarketItem
{
    public string Id { get; init; } = "";
    public string Symbol { get; init; } = "";
    public string Name { get; init; } = "";
    public decimal CurrentPrice { get; init; }
    public decimal MarketCap { get; init; }
    public decimal TotalVolume { get; init; }

    [JsonPropertyName("high_24h")]
    public decimal High24h { get; init; }

    [JsonPropertyName("low_24h")]
    public decimal Low24h { get; init; }

    [JsonPropertyName("price_change_percentage_24h")]
    public decimal PriceChangePercentage24h { get; init; }

    public decimal CirculatingSupply { get; init; }
}

file record CoinGeckoChartRaw
{
    public List<List<double>> Prices { get; init; } = [];
}
