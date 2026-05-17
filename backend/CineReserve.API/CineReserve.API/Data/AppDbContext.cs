using Microsoft.EntityFrameworkCore;
using CineReserve.API.Models;

namespace CineReserve.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Movie> Movies { get; set; }

        public DbSet<Showtime> Showtimes { get; set; }

        public DbSet<Booking> Bookings { get; set; }

        public DbSet<TicketDetail> TicketDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TicketDetail>()
                .HasIndex(t => new
                {
                    t.ShowtimeId,
                    t.RowNumber,
                    t.SeatNumber
                })
                .IsUnique();
        }
    }
}