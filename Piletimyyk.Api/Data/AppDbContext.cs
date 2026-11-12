using Microsoft.EntityFrameworkCore;

namespace Piletimyyk.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // DbSets will be added here as entities are created.
}
