using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Models;

namespace Piletimyyk.Api.Data;

public static class DbSeeder
{
    private const int Rows = 8;
    private const int SeatsPerRow = 12;

    public static async Task SeedAsync(AppDbContext db)
    {
        await SeedHallsAsync(db);
        await SeedUsersAsync(db);
    }

    private static async Task SeedHallsAsync(AppDbContext db)
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

    private static async Task SeedUsersAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
        {
            return;
        }

        var hasher = new PasswordHasher<User>();

        (string Email, string Password, string Role)[] testUsers =
        {
            ("admin@sitsmart.ee", "Admin123!", Roles.Admin),
            ("buyer@sitsmart.ee", "Buyer123!", Roles.Buyer),
            ("buyer2@sitsmart.ee", "Buyer123!", Roles.Buyer),
            ("control@sitsmart.ee", "Control123!", Roles.Controller),
            ("service@sitsmart.ee", "Service123!", Roles.Service)
        };

        foreach (var (email, password, role) in testUsers)
        {
            var user = new User { Email = email, Role = role };
            user.PasswordHash = hasher.HashPassword(user, password);
            db.Users.Add(user);
        }

        await db.SaveChangesAsync();
    }
}
