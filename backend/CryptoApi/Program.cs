using CryptoApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──
builder.Services.AddHttpClient<CoinGeckoService>();
builder.Services.AddOpenApi();
builder.Services.AddCors(opts =>
{
    opts.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// ── Pipeline ──
if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors();

// ── Endpoints ──

// GET /api/prices — all 6 coins
app.MapGet("/api/prices", async (CoinGeckoService svc) =>
{
    var prices = await svc.GetPricesAsync();
    return Results.Ok(prices);
})
.WithName("GetPrices");

// GET /api/prices/{coinId} — single coin
app.MapGet("/api/prices/{coinId}", async (string coinId, CoinGeckoService svc) =>
{
    var price = await svc.GetPriceAsync(coinId);
    return price is null ? Results.NotFound() : Results.Ok(price);
})
.WithName("GetPrice");

// GET /api/chart/{coinId}?range=1h — chart data
app.MapGet("/api/chart/{coinId}", async (string coinId, string? range, CoinGeckoService svc) =>
{
    var chart = await svc.GetChartAsync(coinId, range ?? "1h");
    return chart is null ? Results.NotFound() : Results.Ok(chart);
})
.WithName("GetChart");

app.Run();
