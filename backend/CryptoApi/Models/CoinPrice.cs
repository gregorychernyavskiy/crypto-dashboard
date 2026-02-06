namespace CryptoApi.Models;

public record CoinPrice(
    string Id,
    string Symbol,
    string Name,
    decimal CurrentPrice,
    decimal MarketCap,
    decimal TotalVolume,
    decimal High24h,
    decimal Low24h,
    decimal PriceChangePercentage24h,
    decimal CirculatingSupply,
    long LastUpdated
);
