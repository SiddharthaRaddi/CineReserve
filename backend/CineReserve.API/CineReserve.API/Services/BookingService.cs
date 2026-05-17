using CineReserve.API.Data;
using CineReserve.API.DTOs;
using CineReserve.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CineReserve.API.Services
{
    public class BookingService
    {
        private readonly AppDbContext _context;

        public BookingService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> BookSeats(BookingRequestDto request)
        {
            using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var seat in request.Seats)
                {
                    bool alreadyBooked =
                        await _context.TicketDetails.AnyAsync(x =>
                            x.ShowtimeId == request.ShowtimeId &&
                            x.RowNumber == seat.RowNumber &&
                            x.SeatNumber == seat.SeatNumber);

                    if (alreadyBooked)
                    {
                        throw new Exception(
                            $"Seat {seat.RowNumber}-{seat.SeatNumber} already booked");
                    }
                }

                var booking = new Booking
                {
                    UserId = 1,
                    BookingReference = Guid.NewGuid().ToString(),
                    TotalAmount = request.Seats.Count * 250,
                    BookingTime = DateTime.Now
                };

                _context.Bookings.Add(booking);

                await _context.SaveChangesAsync();

                foreach (var seat in request.Seats)
                {
                    var ticket = new TicketDetail
                    {
                        BookingId = booking.Id,
                        ShowtimeId = request.ShowtimeId,
                        RowNumber = seat.RowNumber,
                        SeatNumber = seat.SeatNumber,
                        Price = 250
                    };

                    _context.TicketDetails.Add(ticket);
                }

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return "Booking Successful";
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}