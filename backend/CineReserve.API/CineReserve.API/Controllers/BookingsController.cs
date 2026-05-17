using CineReserve.API.DTOs;
using CineReserve.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CineReserve.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly BookingService _service;

        public BookingsController(BookingService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Book(
            BookingRequestDto request)
        {
            try
            {
                var result =
                    await _service.BookSeats(request);

                return Ok(new
                {
                    message = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }
    }
}