using CineReserve.API.Data;
using CineReserve.API.DTOs;
using CineReserve.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CineReserve.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShowtimesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ShowtimesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetShowtimes()
        {
            var showtimes = await _context.Showtimes
                .Include(x => x.Movie)
                .ToListAsync();

            return Ok(showtimes);
        }

        [HttpGet("{id}/seats")]
        public async Task<IActionResult> GetSeatStatus(int id)
        {
            var bookedSeats = await _context.TicketDetails
                .Where(x => x.ShowtimeId == id)
                .Select(x => new SeatStatusDto
                {
                    RowNumber = x.RowNumber,
                    SeatNumber = x.SeatNumber,
                    IsBooked = true
                })
                .ToListAsync();

            return Ok(bookedSeats);
        }
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddShowtime([FromBody] Showtime showtime)
        {
            _context.Showtimes.Add(showtime);
            await _context.SaveChangesAsync();
            return Ok(showtime);
        }

    }
}