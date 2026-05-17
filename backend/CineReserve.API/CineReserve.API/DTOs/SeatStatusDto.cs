namespace CineReserve.API.DTOs
{
    public class SeatStatusDto
    {
        public string RowNumber { get; set; }

        public int SeatNumber { get; set; }

        public bool IsBooked { get; set; }
    }
}