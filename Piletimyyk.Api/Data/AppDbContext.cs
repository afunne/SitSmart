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
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<User> Users => Set<User>();

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

        modelBuilder.Entity<User>(user =>
        {
            user.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);

            user.Property(u => u.PasswordHash)
                .IsRequired();

            user.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(20);

            user.HasIndex(u => u.Email)
                .IsUnique();
        });

        modelBuilder.Entity<Reservation>(reservation =>
        {
            reservation.Property(r => r.ExpiresAt)
                .IsRequired();

            reservation.HasIndex(r => new { r.EventId, r.SeatId });
            reservation.HasIndex(r => r.ExpiresAt);

            reservation.HasOne(r => r.Event)
                .WithMany()
                .HasForeignKey(r => r.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            reservation.HasOne(r => r.Seat)
                .WithMany()
                .HasForeignKey(r => r.SeatId)
                .OnDelete(DeleteBehavior.Restrict);

            reservation.HasOne(r => r.User)
                .WithMany(u => u.Reservations)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Ticket>(ticket =>
        {
            ticket.Property(t => t.Code)
                .IsRequired()
                .HasMaxLength(64);

            ticket.HasIndex(t => t.Code)
                .IsUnique();

            ticket.HasIndex(t => new { t.EventId, t.SeatId })
                .IsUnique();

            ticket.HasOne(t => t.Event)
                .WithMany()
                .HasForeignKey(t => t.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            ticket.HasOne(t => t.Seat)
                .WithMany()
                .HasForeignKey(t => t.SeatId)
                .OnDelete(DeleteBehavior.Restrict);

            ticket.HasOne(t => t.User)
                .WithMany(u => u.Tickets)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
