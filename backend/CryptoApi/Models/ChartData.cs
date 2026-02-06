namespace CryptoApi.Models;

public record ChartDataPoint(long Timestamp, decimal Price);

public record ChartResponse(
    string Id,
    string RangeLabel,
    List<ChartDataPoint> Prices,
    decimal High,
    decimal Low,
    decimal Average,
    int DataPoints
);
