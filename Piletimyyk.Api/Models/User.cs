namespace Piletimyyk.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = Roles.Buyer;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
