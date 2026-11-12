namespace Piletimyyk.Api.Models;

public class Reservation
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int SeatId { get; set; }
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }

    public Event Event { get; set; } = null!;
    public Seat Seat { get; set; } = null!;
    public User User { get; set; } = null!;
}
