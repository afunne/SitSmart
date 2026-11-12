using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Models;

namespace Piletimyyk.Api.Data;

public static class DbSeeder
{
    private const int Rows = 8;
    private const int SeatsPerRow = 12;

    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Halls.AnyAsync())
        {
            return;
        }

        var hall = new Hall { Name = "Suur saal" };

        for (var row = 1; row <= Rows; row++)
        {
            for (var number = 1; number <= SeatsPerRow; number++)
            {
                hall.Seats.Add(new Seat { Row = row, Number = number });
            }
        }

        var now = DateTime.UtcNow;

        hall.Events.Add(new Event
        {
            Name = "Kontsert",
            Description = "Õhtune kontsert suures saalis.",
            StartTime = now.AddDays(7),
            Price = 15.00m
        });

        hall.Events.Add(new Event
        {
            Name = "Teatrietendus",
            Description = "Teatrietendus suures saalis.",
            StartTime = now.AddDays(14),
            Price = 20.00m
        });

        db.Halls.Add(hall);
        await db.SaveChangesAsync();
    }
}
