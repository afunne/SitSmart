namespace Piletimyyk.Api.Dtos;

/* Sales figures for one event. Sold + Reserved + Free = TotalSeats. Reserved counts only active
   holds (ExpiresAt in the future) on seats that aren't sold. FillPercent is Sold / TotalSeats
   × 100 with one decimal; Revenue is the sum of the prices the tickets were sold at. */
public record EventStatsDto(
    int EventId,
    string Name,
    int TotalSeats,
    int Sold,
    int Reserved,
    int Free,
    int CheckedIn,
    decimal FillPercent,
    decimal Revenue);
