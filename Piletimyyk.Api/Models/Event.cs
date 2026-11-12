namespace Piletimyyk.Api.Models;

public class Event
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public decimal Price { get; set; }
    public int HallId { get; set; }

    public Hall Hall { get; set; } = null!;
}
