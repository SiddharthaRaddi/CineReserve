namespace CineReserve.API.DTOs
{
    public class BookingRequestDto
    {
        public int ShowtimeId { get; set; }

        public List<SeatDto> Seats { get; set; }
    }
}