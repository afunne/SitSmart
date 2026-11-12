namespace Piletimyyk.Api.Models;

public class Ticket
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public int EventId { get; set; }
    public int SeatId { get; set; }
    public int UserId { get; set; }
    public DateTime PurchasedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }

    public Event Event { get; set; } = null!;
    public Seat Seat { get; set; } = null!;
    public User User { get; set; } = null!;
}
