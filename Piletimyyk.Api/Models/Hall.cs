namespace Piletimyyk.Api.Models;

public class Hall
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
    public ICollection<Event> Events { get; set; } = new List<Event>();
}
