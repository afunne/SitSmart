using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Models;

namespace Piletimyyk.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Hall> Halls => Set<Hall>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<Event> Events => Set<Event>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Hall>(hall =>
        {
            hall.Property(h => h.Name)
                .IsRequired()
                .HasMaxLength(100);

            hall.HasMany(h => h.Seats)
                .WithOne(s => s.Hall)
                .HasForeignKey(s => s.HallId)
                .OnDelete(DeleteBehavior.Cascade);

            hall.HasMany(h => h.Events)
                .WithOne(e => e.Hall)
                .HasForeignKey(e => e.HallId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Seat>(seat =>
        {
            seat.Property(s => s.Row).IsRequired();
            seat.Property(s => s.Number).IsRequired();

            seat.HasIndex(s => new { s.HallId, s.Row, s.Number })
                .IsUnique();
        });

        modelBuilder.Entity<Event>(ev =>
        {
            ev.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);

            ev.Property(e => e.Description)
                .HasMaxLength(1000);

            ev.Property(e => e.StartTime)
                .IsRequired();

            ev.Property(e => e.Price)
                .IsRequired()
                .HasColumnType("decimal(10,2)");
        });
    }
}
